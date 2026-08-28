import { createHash, randomBytes } from 'node:crypto';
import {
  EMAIL_TOKEN_BYTES,
  REFRESH_TOKEN_BYTES,
} from '../domain/auth.constants';

/**
 * Todo token de uso único (refresh, verificação, reset, troca de e-mail) é
 * guardado só como hash: quem ler o banco não consegue usar nenhum deles.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

export function generateSecureHexToken(): string {
  return randomBytes(EMAIL_TOKEN_BYTES).toString('hex');
}
