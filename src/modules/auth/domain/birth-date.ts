const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_BIRTH_YEAR = 1900;

export function toBooleanFlag(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    );
  }

  return false;
}

export function parseLocalIsoDate(iso: string): Date | null {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatBirthDate(
  value: Date | string | null | undefined,
): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const iso = value.trim().slice(0, 10);
    return parseLocalIsoDate(iso) ? iso : null;
  }

  return null;
}

/**
 * Normalizes a birth date to YYYY-MM-DD.
 * Rejects empty, invalid, future, and pre-1900 dates.
 */
export function normalizeBirthDate(rawValue: unknown): string | null {
  if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
    return normalizeBirthDate(rawValue.toISOString().slice(0, 10));
  }

  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const iso = ISO_DATE.exec(trimmed.slice(0, 10))?.[0] ?? null;
  if (!iso) {
    return null;
  }

  const date = parseLocalIsoDate(iso);
  if (!date) {
    return null;
  }

  if (date.getFullYear() < MIN_BIRTH_YEAR) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return null;
  }

  return iso;
}

export function calculateAge(
  birthDate: Date | string | null | undefined,
): number | null {
  const iso = normalizeBirthDate(birthDate) ?? formatBirthDate(birthDate);
  if (!iso) {
    return null;
  }

  const birth = parseLocalIsoDate(iso);
  if (!birth) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function toBirthDateUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
