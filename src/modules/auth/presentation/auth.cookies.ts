import type { CookieOptions, Response } from 'express';
import type { AppEnv } from '../../../config/validate-env';
import {
  AUTH_COOKIE_PATHS,
  AUTH_COOKIES,
  VISITOR_AGE_ACK_DEFAULT_MAX_AGE_MS,
  parseDurationToMs,
} from '../domain/auth.constants';
import type { IssuedSession } from '../domain/auth.types';
import {
  buildVisitorAgeAckCookieValue,
  parseVisitorAgeAckTiers,
} from '../domain/visitor-age';
import { readCookie } from './read-cookie';

export type BaseCookieEnv = Pick<
  AppEnv,
  'COOKIE_SECURE' | 'COOKIE_SAMESITE' | 'COOKIE_DOMAIN'
>;

export type CookieEnv = BaseCookieEnv &
  Pick<AppEnv, 'JWT_PROFILE_COMPLETION_EXPIRES_IN'> & {
    AGE_ACK_SECRET: string;
    COOKIE_AGE_ACK_MAX_AGE_MS: number;
  };

function baseCookieOptions(env: BaseCookieEnv): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    domain: env.COOKIE_DOMAIN,
  };
}

export function setAuthCookies(
  response: Response,
  session: IssuedSession,
  env: CookieEnv,
) {
  const base = baseCookieOptions(env);

  response.cookie(AUTH_COOKIES.access, session.accessToken, {
    ...base,
    path: AUTH_COOKIE_PATHS.access,
    maxAge: session.accessTokenMaxAgeMs,
  });

  response.cookie(AUTH_COOKIES.refresh, session.refreshToken, {
    ...base,
    path: AUTH_COOKIE_PATHS.refresh,
    maxAge: session.refreshTokenMaxAgeMs,
  });
}

export function clearAuthCookies(response: Response, env: BaseCookieEnv) {
  const base = baseCookieOptions(env);

  response.clearCookie(AUTH_COOKIES.access, {
    ...base,
    path: AUTH_COOKIE_PATHS.access,
  });

  response.clearCookie(AUTH_COOKIES.refresh, {
    ...base,
    path: AUTH_COOKIE_PATHS.refresh,
  });
}

export function setProfileCompletionCookie(
  response: Response,
  token: string,
  env: CookieEnv,
) {
  response.cookie(AUTH_COOKIES.profileCompletion, token, {
    ...baseCookieOptions(env),
    path: AUTH_COOKIE_PATHS.profileCompletion,
    maxAge: parseDurationToMs(
      env.JWT_PROFILE_COMPLETION_EXPIRES_IN || '30m',
      30 * 60_000,
    ),
  });
}

export function clearProfileCompletionCookie(
  response: Response,
  env: CookieEnv,
) {
  response.clearCookie(AUTH_COOKIES.profileCompletion, {
    ...baseCookieOptions(env),
    path: AUTH_COOKIE_PATHS.profileCompletion,
  });
}

export function setVisitorAgeAckCookie(
  response: Response,
  cookies: Record<string, unknown> | undefined,
  tier: 16 | 18,
  env: CookieEnv,
): number[] {
  const maxAgeMs =
    env.COOKIE_AGE_ACK_MAX_AGE_MS || VISITOR_AGE_ACK_DEFAULT_MAX_AGE_MS;
  const existing = parseVisitorAgeAckTiers(
    readCookie(cookies, AUTH_COOKIES.ageAck),
    env.AGE_ACK_SECRET,
  );
  const signed = buildVisitorAgeAckCookieValue(
    existing,
    tier,
    env.AGE_ACK_SECRET,
    maxAgeMs,
  );

  response.cookie(AUTH_COOKIES.ageAck, signed.value, {
    ...baseCookieOptions(env),
    path: AUTH_COOKIE_PATHS.ageAck,
    maxAge: maxAgeMs,
  });

  return signed.tiers;
}
