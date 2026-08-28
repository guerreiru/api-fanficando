import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import {
  EMAIL_RULES,
  PASSWORD_RESET_TTL_MS,
  PASSWORD_RULES,
} from '../domain/auth.constants';
import {
  invalidToken,
  passwordTooShort,
  tokenExpired,
} from '../domain/auth.errors';
import { isPasswordAccount } from '../domain/password-account';
import { generateSecureHexToken } from '../domain/token-crypto';
import { AuthUserRepository } from '../infrastructure/auth-user.repository';
import { PasswordResetTokenRepository } from '../infrastructure/password-reset-token.repository';
import { PasswordService } from './password.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly tokens: PasswordResetTokenRepository,
    private readonly users: AuthUserRepository,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
  ) {}

  async requestReset(emailRaw: string | undefined) {
    const email = String(emailRaw || '')
      .trim()
      .toLowerCase()
      .slice(0, EMAIL_RULES.maxLength);
    if (!email) {
      return { success: true as const };
    }

    const user = await this.users.findByEmail(email);
    if (!user || !isPasswordAccount(user)) {
      return { success: true as const };
    }

    const token = generateSecureHexToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.tokens.deleteTokensForUser(user.id);
    await this.tokens.createToken(user.id, token, expiresAt);
    await this.mail.sendPasswordResetEmail({ to: user.email, token });

    return { success: true as const };
  }

  async preview(tokenRaw: string | undefined) {
    await this.findLiveToken(tokenRaw, true);
    return { valid: true as const };
  }

  async resetPassword(
    tokenRaw: string | undefined,
    passwordRaw: string | undefined,
  ) {
    const password = String(passwordRaw || '');
    if (password.length < PASSWORD_RULES.minLength) {
      throw passwordTooShort();
    }
    if (password.length > PASSWORD_RULES.maxLength) {
      throw invalidToken('Senha inválida.');
    }

    const record = await this.findLiveToken(tokenRaw, true);
    const passwordHash = await this.passwords.hash(password);

    await this.tokens.applyPasswordReset({
      userId: record.userId,
      tokenId: record.id,
      passwordHash,
    });

    return { success: true as const };
  }

  private async findLiveToken(
    tokenRaw: string | undefined,
    deleteIfExpired: boolean,
  ) {
    const token = String(tokenRaw || '').trim();
    if (!token) {
      throw invalidToken('Token de redefinição é obrigatório');
    }

    const record = await this.tokens.findByToken(token);
    if (!record) {
      throw invalidToken('Link de redefinição inválido');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      if (deleteIfExpired) {
        await this.tokens.deleteToken(record.id);
      }
      throw tokenExpired('Link de redefinição expirado');
    }

    return record;
  }
}
