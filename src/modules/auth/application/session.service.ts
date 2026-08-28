import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseDurationToMs } from '../domain/auth.constants';
import {
  accountSuspended,
  emailNotVerified,
  invalidRefresh,
} from '../domain/auth.errors';
import { isPasswordAccount } from '../domain/password-account';
import { generateRefreshToken, hashToken } from '../domain/token-crypto';
import type {
  AuthUserView,
  IssuedSession,
  RequestMeta,
} from '../domain/auth.types';
import { toAuthUserView } from '../domain/auth.mapper';
import { JwtAccessService } from '../infrastructure/jwt-access.service';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';

@Injectable()
export class SessionService {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwtAccess: JwtAccessService,
    private readonly config: ConfigService,
  ) {}

  async issue(user: AuthUserView, meta: RequestMeta): Promise<IssuedSession> {
    const refreshToken = generateRefreshToken();
    const refreshTtlMs = this.refreshTtlMs();
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      meta: this.sanitizeMeta(meta),
    });

    return {
      accessToken: await this.jwtAccess.sign(user.id),
      refreshToken,
      accessTokenMaxAgeMs: this.accessTtlMs(),
      refreshTokenMaxAgeMs: refreshTtlMs,
      user: toAuthUserView(user),
    };
  }

  async rotate(
    rawRefreshToken: string,
    meta: RequestMeta,
  ): Promise<IssuedSession> {
    const tokenHash = hashToken(rawRefreshToken);
    const current = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!current) {
      throw invalidRefresh();
    }

    if (current.revokedAt || current.replacedByTokenHash) {
      await this.refreshTokens.revokeAllByUserId(current.userId);
      throw invalidRefresh();
    }

    if (current.expiresAt.getTime() <= Date.now()) {
      await this.refreshTokens.revokeByTokenHash(tokenHash);
      throw invalidRefresh();
    }

    if (current.user.suspendedAt) {
      await this.refreshTokens.revokeAllByUserId(current.userId);
      throw accountSuspended();
    }

    if (!current.user.emailVerified && isPasswordAccount(current.user)) {
      throw emailNotVerified();
    }

    const nextRefreshToken = generateRefreshToken();
    const refreshTtlMs = this.refreshTtlMs();

    const rotated = await this.refreshTokens.rotate({
      currentId: current.id,
      newTokenHash: hashToken(nextRefreshToken),
      userId: current.userId,
      expiresAt: new Date(Date.now() + refreshTtlMs),
      meta: this.sanitizeMeta(meta),
    });

    // Outra requisição consumiu o mesmo token entre o SELECT e o UPDATE:
    // indistinguível de replay, então encerra todas as sessões.
    if (!rotated) {
      await this.refreshTokens.revokeAllByUserId(current.userId);
      throw invalidRefresh();
    }

    return {
      accessToken: await this.jwtAccess.sign(current.userId),
      refreshToken: nextRefreshToken,
      accessTokenMaxAgeMs: this.accessTtlMs(),
      refreshTokenMaxAgeMs: refreshTtlMs,
      user: toAuthUserView(current.user),
    };
  }

  async revoke(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    await this.refreshTokens.revokeByTokenHash(hashToken(rawRefreshToken));
  }

  async revokeAll(userId: string): Promise<void> {
    await this.refreshTokens.revokeAllByUserId(userId);
  }

  private accessTtlMs() {
    return parseDurationToMs(
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      15 * 60_000,
    );
  }

  private refreshTtlMs() {
    return parseDurationToMs(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      7 * 86_400_000,
    );
  }

  private sanitizeMeta(meta: RequestMeta): RequestMeta {
    return {
      userAgent: meta.userAgent?.slice(0, 512) || undefined,
      ipAddress: meta.ipAddress?.slice(0, 64) || undefined,
    };
  }
}
