import { NAME_RULES } from '../../auth/domain/auth.constants';
import { normalizeAvatarUrl } from './avatar-url';
import { BIO_RULES, TOUR_RULES } from './user.constants';
import {
  invalidBio,
  invalidName,
  invalidProfileField,
  nothingToUpdate,
} from './user.errors';
import type { ProfileUpdateInput, ProfileUpdatePatch } from './user.types';

// eslint-disable-next-line no-control-regex -- caracteres de controle
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
// eslint-disable-next-line no-control-regex -- controle exceto \n (\u000a)
const CONTROL_CHARS_KEEP_LF = /[\u0000-\u0009\u000b-\u001f\u007f]/g;

export function normalizeDisplayName(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw !== 'string') {
    throw invalidName();
  }

  const cleaned = raw
    .replace(/<[^>]*>/g, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length > NAME_RULES.maxLength) {
    throw invalidName();
  }

  return cleaned;
}

export function normalizeBio(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw !== 'string') {
    throw invalidBio();
  }

  const cleaned = raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS_KEEP_LF, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length > BIO_RULES.maxLength) {
    throw invalidBio();
  }

  return cleaned;
}

function normalizeFlag(raw: unknown, field: string): boolean {
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (raw === 'true' || raw === 1 || raw === '1') {
    return true;
  }
  if (raw === 'false' || raw === 0 || raw === '0') {
    return false;
  }
  throw invalidProfileField(field);
}

function normalizeTourVersion(raw: unknown): number {
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number.parseInt(raw, 10)
        : Number.NaN;

  if (!Number.isInteger(value) || value < 0 || value > TOUR_RULES.maxVersion) {
    throw invalidProfileField('tourVersion');
  }

  return value;
}

/**
 * Campo ausente (`undefined`) fica de fora do `UPDATE`; `null` ou string vazia
 * limpam o valor. Sem essa distinção um PATCH parcial apagaria o resto.
 */
export function parseProfileUpdate(
  input: ProfileUpdateInput,
  allowedAvatarHosts: readonly string[],
): ProfileUpdatePatch {
  const patch: ProfileUpdatePatch = {};

  if (input.name !== undefined) {
    patch.name = normalizeDisplayName(input.name);
  }

  if (input.bio !== undefined) {
    patch.bio = normalizeBio(input.bio);
  }

  if (input.avatarUrl !== undefined) {
    patch.avatarUrl = normalizeAvatarUrl(input.avatarUrl, allowedAvatarHosts);
  }

  if (input.emailNotifications !== undefined) {
    patch.emailNotifications = normalizeFlag(
      input.emailNotifications,
      'emailNotifications',
    );
  }

  if (input.tourVersion !== undefined) {
    patch.tourVersion = normalizeTourVersion(input.tourVersion);
  }

  if (Object.keys(patch).length === 0) {
    throw nothingToUpdate();
  }

  return patch;
}
