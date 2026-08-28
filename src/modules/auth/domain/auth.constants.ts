export const AUTH_COOKIES = {
  access: 'access_token',
  refresh: 'refresh_token',
  profileCompletion: 'profile_completion',
  ageAck: 'age_ack',
} as const;

export const AUTH_COOKIE_PATHS = {
  access: '/',
  refresh: '/api/auth',
  profileCompletion: '/api/auth',
  ageAck: '/',
} as const;

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;
export const EMAIL_TOKEN_BYTES = 32;
/** Tokens opacos são hex de 32 bytes; a folga cobre formatos futuros. */
export const OPAQUE_TOKEN_MAX_LENGTH = 128;
export const JWT_TOKEN_MAX_LENGTH = 4096;
export const VISITOR_AGE_ACK_VERSION = 1;
export const VISITOR_AGE_ACK_DEFAULT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
export const VISITOR_AGE_INPUTS = [12, 14, 16, 18] as const;

export const PROFILE_COMPLETION_PATH = '/complete-profile';

export const GOOGLE_PROVIDER = 'google';

/**
 * Marcador para contas que só entram por provedor social. Não é um hash bcrypt
 * válido, então nenhuma senha pode ser verificada contra ele.
 */
export const UNUSABLE_PASSWORD = '!social-login-only';

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 72,
  bcryptRounds: 12,
} as const;

export const EMAIL_RULES = {
  maxLength: 255,
} as const;

export const NAME_RULES = {
  maxLength: 255,
} as const;

export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 50,
  format: /^[a-z][a-z0-9_]{2,49}$/,
} as const;

/** Minimum age for email/password registration. Google defers this to complete-profile. */
export const PLATFORM_MIN_AGE = 13;

export const REFRESH_TOKEN_BYTES = 32;

export function parseDurationToMs(value: string, fallbackMs: number): number {
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    return fallbackMs;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60_000;
    case 'h':
      return amount * 3_600_000;
    case 'd':
      return amount * 86_400_000;
    default:
      return fallbackMs;
  }
}
