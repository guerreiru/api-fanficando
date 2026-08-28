import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { EMAIL_CHANGE_TTL_MS, EMAIL_RULES } from '../domain/auth.constants';
import {
  emailInUse,
  invalidPassword,
  invalidToken,
  sameEmail,
  socialAccount,
  tokenExpired,
  unauthenticated,
} from '../domain/auth.errors';
import { isPasswordAccount } from '../domain/password-account';
import { generateSecureHexToken } from '../domain/token-crypto';
import { AuthUserRepository } from '../infrastructure/auth-user.repository';
import { EmailChangeTokenRepository } from '../infrastructure/email-change-token.repository';
import { PasswordService } from './password.service';

@Injectable()
export class EmailChangeService {
  constructor(
    private readonly tokens: EmailChangeTokenRepository,
    private readonly users: AuthUserRepository,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
  ) {}

  async requestChange(
    userId: string,
    newEmailRaw: string,
    currentPassword: string,
  ) {
    const user = await this.users.findAuthById(userId);
    if (!user) {
      throw unauthenticated();
    }

    if (!isPasswordAccount(user)) {
      throw socialAccount();
    }

    const validPassword = await this.passwords.verify(
      currentPassword,
      user.password,
    );
    if (!validPassword) {
      throw invalidPassword();
    }

    const newEmail = String(newEmailRaw || '')
      .trim()
      .toLowerCase()
      .slice(0, EMAIL_RULES.maxLength);
    if (newEmail === user.email.toLowerCase()) {
      throw sameEmail();
    }

    const existing = await this.users.findByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw emailInUse();
    }

    const token = generateSecureHexToken();
    const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

    await this.tokens.deleteTokensForUser(userId);
    await this.tokens.createToken(userId, newEmail, token, expiresAt);
    await this.mail.sendEmailChangeConfirmation({ to: newEmail, token });

    return {
      success: true as const,
      pendingEmail: newEmail,
      message: 'Enviamos um link de confirmação para o novo e-mail.',
    };
  }

  async preview(tokenRaw: string | undefined) {
    const record = await this.findLiveToken(tokenRaw, true);
    return {
      valid: true as const,
      pendingEmail: record.pendingEmail,
      currentEmail: record.user.email,
    };
  }

  async confirm(tokenRaw: string | undefined) {
    const record = await this.findLiveToken(tokenRaw, true);
    const pendingEmail = record.pendingEmail.toLowerCase();
    const existing = await this.users.findByEmail(pendingEmail);
    if (existing && existing.id !== record.userId) {
      await this.tokens.deleteToken(record.id);
      throw emailInUse();
    }

    await this.tokens.applyEmailChange(record.userId, pendingEmail);

    return {
      success: true as const,
      email: pendingEmail,
    };
  }

  private async findLiveToken(
    tokenRaw: string | undefined,
    deleteIfExpired: boolean,
  ) {
    const token = String(tokenRaw || '').trim();
    if (!token) {
      throw invalidToken('Token de confirmação é obrigatório');
    }

    const record = await this.tokens.findByToken(token);
    if (!record) {
      throw invalidToken('Link de confirmação inválido');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      if (deleteIfExpired) {
        await this.tokens.deleteToken(record.id);
      }
      throw tokenExpired('Link de confirmação expirado');
    }

    return record;
  }
}
