import { PLATFORM_MIN_AGE } from './auth.constants';
import {
  ageNotConfirmed,
  displayNameRequired,
  invalidBirthDate,
  termsNotAccepted,
  unauthenticated,
  underage,
} from './auth.errors';
import { calculateAge, normalizeBirthDate, toBooleanFlag } from './birth-date';
import { assertValidUsernameFormat, normalizeUsername } from './username';

export type CompleteProfileBody = {
  birthDate?: unknown;
  birth_date?: unknown;
  ageVerified?: unknown;
  age_verified?: unknown;
  username?: unknown;
  displayName?: unknown;
  acceptTerms?: unknown;
};

export type ValidatedCompleteProfileInput =
  | {
      mode: 'token';
      completionToken: string;
      birthDate: string;
      username: string;
    }
  | {
      mode: 'authenticated';
      userId: string;
      displayName: string;
      birthDate: string;
      username: string;
    };

export function parseCompleteProfileInput(
  body: CompleteProfileBody,
  authenticatedUserId?: string,
  completionTokenFromCookie?: string,
): ValidatedCompleteProfileInput {
  const completionToken = String(completionTokenFromCookie || '').trim();
  const birthDate = normalizeBirthDate(body.birth_date ?? body.birthDate);

  if (completionToken) {
    if (!birthDate) {
      throw invalidBirthDate();
    }
    if (!toBooleanFlag(body.age_verified ?? body.ageVerified)) {
      throw ageNotConfirmed();
    }
    // `completeProfile` grava termsAccepted: true, então o aceite tem de vir do
    // usuário também no fluxo social.
    if (!toBooleanFlag(body.acceptTerms)) {
      throw termsNotAccepted();
    }
    assertMinimumAge(birthDate);

    return {
      mode: 'token',
      completionToken,
      birthDate,
      username: assertValidUsernameFormat(body.username),
    };
  }

  if (!authenticatedUserId) {
    throw unauthenticated();
  }

  const username = assertValidUsernameFormat(body.username);
  const displayName =
    (typeof body.displayName === 'string' ? body.displayName.trim() : '') ||
    normalizeUsername(body.username);
  if (!displayName) {
    throw displayNameRequired();
  }
  if (!birthDate) {
    throw invalidBirthDate();
  }
  if (!toBooleanFlag(body.acceptTerms)) {
    throw termsNotAccepted();
  }
  assertMinimumAge(birthDate);

  return {
    mode: 'authenticated',
    userId: authenticatedUserId,
    displayName,
    birthDate,
    username,
  };
}

function assertMinimumAge(birthDate: string) {
  const age = calculateAge(birthDate);
  if (age === null || age < PLATFORM_MIN_AGE) {
    throw underage();
  }
}
