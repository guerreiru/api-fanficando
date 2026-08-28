import { PLATFORM_MIN_AGE } from './auth.constants';
import {
  ageNotConfirmed,
  invalidBirthDate,
  termsNotAccepted,
  underage,
} from './auth.errors';
import {
  calculateAge,
  normalizeBirthDate,
  toBirthDateUtc,
  toBooleanFlag,
} from './birth-date';

export type PasswordRegistrationCompliance = {
  termsAccepted: true;
  ageVerified: true;
  birthDate: Date;
};

/**
 * Email/password signup must prove terms + age on the server.
 * Google signup skips this and collects it later in complete-profile.
 */
export function requirePasswordRegistrationCompliance(input: {
  termsAccepted: unknown;
  ageVerified: unknown;
  birthDate: unknown;
}): PasswordRegistrationCompliance {
  if (!toBooleanFlag(input.termsAccepted)) {
    throw termsNotAccepted();
  }

  if (!toBooleanFlag(input.ageVerified)) {
    throw ageNotConfirmed();
  }

  const iso = normalizeBirthDate(input.birthDate);
  if (!iso) {
    throw invalidBirthDate();
  }

  const age = calculateAge(iso);
  if (age === null || age < PLATFORM_MIN_AGE) {
    throw underage();
  }

  return {
    termsAccepted: true,
    ageVerified: true,
    birthDate: toBirthDateUtc(iso),
  };
}
