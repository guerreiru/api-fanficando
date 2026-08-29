import { normalizeUsername } from '../../auth/domain/username';
import { invalidConfirmation } from './user.errors';

/**
 * Exclusão é irreversível e as histórias sobrevivem sem autor, então a conta
 * social — que não tem senha para confirmar — precisa digitar o próprio
 * @username.
 */
export function assertUsernameConfirmation(
  username: string | null,
  confirmation: unknown,
): void {
  if (!username) {
    throw invalidConfirmation();
  }

  if (normalizeUsername(confirmation) !== normalizeUsername(username)) {
    throw invalidConfirmation();
  }
}
