import { USERNAME_CHANGE_COOLDOWN_MS } from './user.constants';
import { usernameChangeTooSoon } from './user.errors';
import {
  assertUsernameChangeAllowed,
  usernameChangeAvailableAt,
} from './username-change';

describe('username cooldown', () => {
  const now = new Date('2026-08-28T12:00:00.000Z');

  it('allows the first change', () => {
    expect(usernameChangeAvailableAt(null, now)).toBeNull();
    expect(() => assertUsernameChangeAllowed(null, now)).not.toThrow();
  });

  it('blocks a change inside the cooldown and says when it opens', () => {
    const changedAt = new Date(now.getTime() - 86_400_000);
    const availableAt = new Date(
      changedAt.getTime() + USERNAME_CHANGE_COOLDOWN_MS,
    );

    expect(usernameChangeAvailableAt(changedAt, now)).toEqual(availableAt);
    expect(() => assertUsernameChangeAllowed(changedAt, now)).toThrow(
      usernameChangeTooSoon(availableAt),
    );
  });

  it('allows again once the cooldown has elapsed', () => {
    const changedAt = new Date(
      now.getTime() - USERNAME_CHANGE_COOLDOWN_MS - 1000,
    );

    expect(usernameChangeAvailableAt(changedAt, now)).toBeNull();
    expect(() => assertUsernameChangeAllowed(changedAt, now)).not.toThrow();
  });
});
