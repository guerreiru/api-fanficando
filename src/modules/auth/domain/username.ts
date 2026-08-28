import { USERNAME_RULES } from './auth.constants';
import { invalidUsername, usernameRequired } from './auth.errors';

export function normalizeUsername(raw: unknown): string {
  return (
    (typeof raw === 'string' ? raw : '')
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/<[^>]*>/g, '')
      // eslint-disable-next-line no-control-regex -- remove caracteres de controle
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/\s+/g, '')
  );
}

export function assertValidUsernameFormat(username: unknown): string {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw usernameRequired();
  }
  if (!USERNAME_RULES.format.test(normalized)) {
    throw invalidUsername();
  }
  return normalized;
}

export function slugFromDisplayName(name: string | null | undefined): string {
  let base = String(name || 'usuario')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);

  if (!base) {
    base = 'usuario';
  }
  if (!/^[a-z]/.test(base)) {
    base = `u${base}`.slice(0, 40);
  }
  if (base.length < USERNAME_RULES.minLength) {
    base = `${base}user`.slice(0, 40);
  }

  return base;
}

export async function allocateUniqueUsername(
  preferredRaw: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugFromDisplayName(preferredRaw);

  if (!(await isTaken(base))) {
    return base;
  }

  for (let i = 2; i < 1000; i += 1) {
    const suffix = String(i);
    const candidate = `${base.slice(0, Math.max(1, USERNAME_RULES.maxLength - suffix.length))}${suffix}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  return `${base.slice(0, 32)}${Date.now().toString(36)}`.slice(
    0,
    USERNAME_RULES.maxLength,
  );
}
