import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import {
  EMAIL_RULES,
  EMAIL_VERIFICATION_TTL_MS,
} from '../domain/auth.constants';
import {
  emailRequired,
  invalidToken,
  tokenExpired,
  unauthenticated,
} from '../domain/auth.errors';
import { isPasswordAccount } from '../domain/password-account';
import { generateSecureHexToken } from '../domain/token-crypto';
import { AuthUserRepository } from '../infrastructure/auth-user.repository';
import { EmailVerificationTokenRepository } from '../infrastructure/email-verification-token.repository';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly tokens: EmailVerificationTokenRepository,
    private readonly users: AuthUserRepository,
    private readonly mail: MailService,
  ) {}

  async issueAndSend(userId: string, email: string) {
    const user = await this.users.findAuthById(userId);
    if (!user) {
      throw unauthenticated();
    }
    if (user.emailVerified) {
      return { skipped: true as const, reason: 'already_verified' };
    }

    const token = generateSecureHexToken();
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

    await this.tokens.deleteTokensForUser(userId);
    await this.tokens.createToken(userId, token, expiresAt);

    return this.mail.sendVerificationEmail({ to: email, token });
  }

  async preview(tokenRaw: string | undefined) {
    const record = await this.findLiveToken(
      tokenRaw,
      'Token de verificação é obrigatório',
      'Token de verificação inválido',
      'Token de verificação expirado',
      false,
    );

    if (record.user.emailVerified) {
      return { valid: true as const, alreadyVerified: true as const };
    }

    return { valid: true as const };
  }

  async confirm(tokenRaw: string | undefined) {
    const record = await this.findLiveToken(
      tokenRaw,
      'Token de verificação é obrigatório',
      'Token de verificação inválido',
      'Token de verificação expirado',
      true,
    );

    await this.tokens.confirmVerification(record.userId, record.id);

    return { success: true as const };
  }

  async resend(userId: string | undefined, emailRaw: string | undefined) {
    if (userId) {
      return this.resendForUser(userId);
    }

    const email = String(emailRaw || '')
      .trim()
      .toLowerCase()
      .slice(0, EMAIL_RULES.maxLength);
    if (!email) {
      throw emailRequired();
    }

    return this.resendForEmail(email);
  }

  private async resendForUser(userId: string) {
    const user = await this.users.findAuthById(userId);
    if (!user) {
      throw unauthenticated();
    }

    return this.resendForEmail(user.email, user);
  }

  private async resendForEmail(
    email: string,
    existingUser?: Awaited<ReturnType<AuthUserRepository['findAuthById']>>,
  ) {
    const user = existingUser ?? (await this.users.findByEmail(email));

    // Resposta idêntica para e-mail inexistente, já verificado e reenviado:
    // qualquer diferença permite enumerar contas.
    if (!user || user.emailVerified) {
      return { success: true as const };
    }

    if (!isPasswordAccount(user)) {
      await this.tokens.markUserVerified(user.id);
      return { success: true as const };
    }

    await this.issueAndSend(user.id, user.email);
    return { success: true as const };
  }

  private async findLiveToken(
    tokenRaw: string | undefined,
    missingMessage: string,
    invalidMessage: string,
    expiredMessage: string,
    deleteIfExpired: boolean,
  ) {
    const token = String(tokenRaw || '').trim();
    if (!token) {
      throw invalidToken(missingMessage);
    }

    const record = await this.tokens.findByToken(token);
    if (!record) {
      throw invalidToken(invalidMessage);
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      if (deleteIfExpired) {
        await this.tokens.deleteToken(record.id);
      }
      throw tokenExpired(expiredMessage);
    }

    return record;
  }
}
