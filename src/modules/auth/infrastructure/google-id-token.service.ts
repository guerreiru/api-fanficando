import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import {
  AuthException,
  googleNotConfigured,
  invalidGoogleToken,
} from '../domain/auth.errors';

export type GoogleIdentity = {
  providerUserId: string;
  email: string;
  name: string | null;
  avatar: string | null;
};

@Injectable()
export class GoogleIdTokenService {
  private readonly logger = new Logger(GoogleIdTokenService.name);
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  async verify(idToken: string): Promise<GoogleIdentity> {
    const audiences = this.audiences();
    if (audiences.length === 0) {
      this.logger.error(
        'GOOGLE_CLIENT_ID não configurado: login Google indisponível',
      );
      throw googleNotConfigured();
    }

    if (!idToken) {
      throw invalidGoogleToken();
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: audiences,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw invalidGoogleToken();
      }

      return {
        providerUserId: String(payload.sub),
        email: String(payload.email).trim().toLowerCase(),
        name: String(payload.name || '').trim() || null,
        avatar: String(payload.picture || '').trim() || null,
      };
    } catch (error) {
      if (error instanceof AuthException) {
        throw error;
      }
      throw invalidGoogleToken();
    }
  }

  private audiences(): string[] {
    return String(this.config.get<string>('GOOGLE_CLIENT_ID') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
}
