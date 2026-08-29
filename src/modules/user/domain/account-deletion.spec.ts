import { assertUsernameConfirmation } from './account-deletion';
import { invalidConfirmation } from './user.errors';

describe('assertUsernameConfirmation', () => {
  const rejected = invalidConfirmation();

  it('accepts the username as typed by the user', () => {
    expect(() => assertUsernameConfirmation('ana', ' @Ana ')).not.toThrow();
  });

  it('rejects another username', () => {
    expect(() => assertUsernameConfirmation('ana', 'ana2')).toThrow(rejected);
  });

  it('rejects an empty confirmation', () => {
    expect(() => assertUsernameConfirmation('ana', '')).toThrow(rejected);
    expect(() => assertUsernameConfirmation('ana', undefined)).toThrow(
      rejected,
    );
  });

  it('rejects an account without username instead of accepting anything', () => {
    expect(() => assertUsernameConfirmation(null, '')).toThrow(rejected);
  });
});
