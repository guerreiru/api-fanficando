import { AUTH_ERROR } from './auth.errors';
import {
  allocateUniqueUsername,
  assertValidUsernameFormat,
  normalizeUsername,
  slugFromDisplayName,
} from './username';

describe('username', () => {
  it('normalizes case, spaces and leading @', () => {
    expect(normalizeUsername(' @Maria_Silva ')).toBe('maria_silva');
  });

  it('accepts a valid username format', () => {
    expect(assertValidUsernameFormat('maria_silva')).toBe('maria_silva');
  });

  it('rejects usernames that start with a number', () => {
    try {
      assertValidUsernameFormat('1maria');
      throw new Error('expected invalid username');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: AUTH_ERROR.INVALID_USERNAME },
      });
    }
  });

  it('builds a slug from a display name', () => {
    expect(slugFromDisplayName('Sandra Oliveira')).toBe('sandraoliveira');
  });

  it('allocates a numeric suffix when the base username is taken', async () => {
    const taken = new Set(['sandraoliveira', 'sandraoliveira2']);
    await expect(
      allocateUniqueUsername('Sandra Oliveira', (candidate) =>
        Promise.resolve(taken.has(candidate)),
      ),
    ).resolves.toBe('sandraoliveira3');
  });
});
