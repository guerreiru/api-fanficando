import { USERNAME_CHANGE_COOLDOWN_MS } from './user.constants';
import { usernameChangeTooSoon } from './user.errors';

/**
 * `null` significa liberado: quem nunca trocou (`usernameChangedAt` vazio) ou
 * já cumpriu o intervalo.
 */
export function usernameChangeAvailableAt(
  changedAt: Date | null | undefined,
  now: Date = new Date(),
): Date | null {
  if (!changedAt) {
    return null;
  }

  const availableAt = new Date(
    changedAt.getTime() + USERNAME_CHANGE_COOLDOWN_MS,
  );
  return availableAt.getTime() > now.getTime() ? availableAt : null;
}

export function assertUsernameChangeAllowed(
  changedAt: Date | null | undefined,
  now: Date = new Date(),
): void {
  const availableAt = usernameChangeAvailableAt(changedAt, now);
  if (availableAt) {
    throw usernameChangeTooSoon(availableAt);
  }
}
