const WEAK_JWT_SECRETS = new Set([
  'change-me',
  'secret',
  'jwt_secret',
  'password',
]);

export type AppEnv = {
  NODE_ENV: string;
  PORT: number;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  JWT_PROFILE_COMPLETION_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  AGE_ACK_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  COOKIE_SECURE: boolean;
  COOKIE_SAMESITE: 'lax' | 'strict' | 'none';
  COOKIE_DOMAIN?: string;
  FRONTEND_URL?: string;
  ALLOWED_ORIGINS: string[];
  RESEND_API_KEY?: string;
  RESEND_FROM: string;
  EMAIL_LOGO_URL?: string;
  COOKIE_AGE_ACK_MAX_AGE_MS: number;
  R2_PUBLIC_URL?: string;
  AVATAR_ALLOWED_HOSTS: string[];
};

/**
 * Avatares só podem apontar para o CDN da Cloudflare: a API guarda a URL, e
 * URL de terceiro transformaria cada perfil visitado em um beacon de IP.
 * `*.host` casa subdomínio.
 */
const DEFAULT_AVATAR_HOSTS = ['imagedelivery.net', '*.r2.dev'];

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseOrigins(config: Record<string, unknown>): string[] {
  const raw = [
    asString(config.ALLOWED_ORIGINS),
    asString(config.FRONTEND_URLS),
    asString(config.FRONTEND_URL),
  ]
    .join(',')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set(raw)];
}

function hostFromUrl(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).hostname.toLowerCase() || undefined;
  } catch {
    return undefined;
  }
}

function parseAvatarHosts(config: Record<string, unknown>): string[] {
  const publicHost = hostFromUrl(asString(config.R2_PUBLIC_URL).trim());
  const configured = asString(config.AVATAR_ALLOWED_HOSTS)
    .split(',')
    .map((host) => hostFromUrl(host.trim()) ?? host.trim().toLowerCase())
    .filter(Boolean);

  const hosts = [...configured, ...(publicHost ? [publicHost] : [])];
  return [...new Set(hosts.length > 0 ? hosts : DEFAULT_AVATAR_HOSTS)];
}

function parseSameSite(value: string): AppEnv['COOKIE_SAMESITE'] {
  const normalized = value.toLowerCase();
  if (
    normalized === 'strict' ||
    normalized === 'none' ||
    normalized === 'lax'
  ) {
    return normalized;
  }
  return 'lax';
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv =
    process.env.NODE_ENV === 'test'
      ? 'test'
      : asString(config.NODE_ENV, process.env.NODE_ENV || 'development');
  let jwtSecret = asString(config.JWT_SECRET);

  if (nodeEnv === 'test' && jwtSecret.length < 16) {
    jwtSecret = 'test-only-jwt-secret-do-not-use-prod';
  }

  if (jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters.');
  }

  if (nodeEnv === 'production') {
    if (jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters in production.',
      );
    }
    if (WEAK_JWT_SECRETS.has(jwtSecret.toLowerCase())) {
      throw new Error('JWT_SECRET is too weak for production.');
    }
  }

  const sameSite = parseSameSite(asString(config.COOKIE_SAMESITE, 'lax'));
  const secure =
    asString(config.COOKIE_SECURE).toLowerCase() === 'true' ||
    (nodeEnv === 'production' &&
      asString(config.COOKIE_SECURE).toLowerCase() !== 'false');

  if (sameSite === 'none' && !secure) {
    throw new Error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true.');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: Number.parseInt(asString(config.PORT, '3001'), 10) || 3001,
    JWT_SECRET: jwtSecret,
    JWT_ACCESS_EXPIRES_IN: asString(config.JWT_ACCESS_EXPIRES_IN, '15m'),
    JWT_REFRESH_EXPIRES_IN: asString(config.JWT_REFRESH_EXPIRES_IN, '7d'),
    JWT_PROFILE_COMPLETION_EXPIRES_IN: asString(
      config.JWT_PROFILE_COMPLETION_EXPIRES_IN,
      '30m',
    ),
    JWT_ISSUER: asString(config.JWT_ISSUER, 'fanficando-api'),
    JWT_AUDIENCE: asString(config.JWT_AUDIENCE, 'fanficando-app'),
    // Independente do JWT_SECRET para que rotacionar o segredo dos tokens não
    // derrube o age-gate de 180 dias dos visitantes.
    AGE_ACK_SECRET: asString(config.AGE_ACK_SECRET) || jwtSecret,
    GOOGLE_CLIENT_ID: asString(config.GOOGLE_CLIENT_ID),
    COOKIE_SECURE: secure,
    COOKIE_SAMESITE: sameSite,
    COOKIE_DOMAIN: asString(config.COOKIE_DOMAIN) || undefined,
    FRONTEND_URL: asString(config.FRONTEND_URL) || undefined,
    ALLOWED_ORIGINS: parseOrigins(config),
    RESEND_API_KEY: asString(config.RESEND_API_KEY) || undefined,
    RESEND_FROM:
      asString(config.RESEND_FROM) || 'Fanficando <no-reply@fanficando.com>',
    EMAIL_LOGO_URL: asString(config.EMAIL_LOGO_URL) || undefined,
    COOKIE_AGE_ACK_MAX_AGE_MS:
      Number.parseInt(asString(config.COOKIE_AGE_ACK_MAX_AGE_MS), 10) ||
      180 * 24 * 60 * 60 * 1000,
    R2_PUBLIC_URL: asString(config.R2_PUBLIC_URL).trim() || undefined,
    AVATAR_ALLOWED_HOSTS: parseAvatarHosts(config),
  };
}
