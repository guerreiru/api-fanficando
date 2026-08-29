jest.mock('../infrastructure/user-profile.repository', () => ({
  UserProfileRepository: class UserProfileRepository {},
}));
jest.mock('../../auth/infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));
jest.mock('../../auth/application/password.service', () => ({
  PasswordService: class PasswordService {},
}));

import { AUTH_ERROR } from '../../auth/domain/auth.errors';
import { USER_ERROR } from '../domain/user.errors';
import { AccountService } from './account.service';

describe('AccountService', () => {
  const users = {
    findAuthById: jest.fn(),
  };
  const profiles = {
    changePassword: jest.fn(),
    deleteAccount: jest.fn(),
  };
  const passwords = {
    verify: jest.fn(),
    hash: jest.fn(),
  };

  const service = new AccountService(
    users as never,
    profiles as never,
    passwords as never,
  );

  const passwordUser = {
    id: 'user-1',
    username: 'ana',
    password: 'hash-atual',
    googleId: null,
    socialProvider: null,
  };

  const googleUser = {
    ...passwordUser,
    password: '!social-login-only',
    googleId: 'sub-1',
    socialProvider: 'google',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    passwords.hash.mockResolvedValue('hash-novo');
  });

  describe('changePassword', () => {
    it('refuses accounts without password', async () => {
      users.findAuthById.mockResolvedValue(googleUser);

      await expect(
        service.changePassword('user-1', 'atual', 'SenhaForte1'),
      ).rejects.toMatchObject({
        response: { code: AUTH_ERROR.SOCIAL_ACCOUNT },
      });
    });

    it('refuses a new password below the minimum length', async () => {
      users.findAuthById.mockResolvedValue(passwordUser);

      await expect(
        service.changePassword('user-1', 'atual', 'curta'),
      ).rejects.toMatchObject({
        response: { code: AUTH_ERROR.WEAK_PASSWORD },
      });
      expect(passwords.verify).not.toHaveBeenCalled();
    });

    it('refuses a wrong current password', async () => {
      users.findAuthById.mockResolvedValue(passwordUser);
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', 'errada', 'SenhaForte1'),
      ).rejects.toMatchObject({
        response: { code: AUTH_ERROR.INVALID_PASSWORD },
      });
      expect(profiles.changePassword).not.toHaveBeenCalled();
    });

    it('refuses reusing the current password', async () => {
      users.findAuthById.mockResolvedValue(passwordUser);
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.changePassword('user-1', 'SenhaForte1', 'SenhaForte1'),
      ).rejects.toMatchObject({
        response: { code: USER_ERROR.SAME_PASSWORD },
      });
    });

    it('stores the new hash', async () => {
      users.findAuthById.mockResolvedValue(passwordUser);
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.changePassword('user-1', 'SenhaAntiga1', 'SenhaForte1'),
      ).resolves.toMatchObject({ success: true });
      expect(profiles.changePassword).toHaveBeenCalledWith(
        'user-1',
        'hash-novo',
      );
    });
  });

  describe('deleteAccount', () => {
    it('requires the password on a password account', async () => {
      users.findAuthById.mockResolvedValue(passwordUser);
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.deleteAccount('user-1', { currentPassword: 'errada' }),
      ).rejects.toMatchObject({
        response: { code: AUTH_ERROR.INVALID_PASSWORD },
      });
      expect(profiles.deleteAccount).not.toHaveBeenCalled();
    });

    it('requires the username on a social account', async () => {
      users.findAuthById.mockResolvedValue(googleUser);

      await expect(
        service.deleteAccount('user-1', { confirmUsername: 'outra' }),
      ).rejects.toMatchObject({
        response: { code: USER_ERROR.INVALID_CONFIRMATION },
      });
      expect(profiles.deleteAccount).not.toHaveBeenCalled();
    });

    it('never falls back to the password check on a social account', async () => {
      users.findAuthById.mockResolvedValue(googleUser);
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.deleteAccount('user-1', { currentPassword: 'qualquer' }),
      ).rejects.toMatchObject({
        response: { code: USER_ERROR.INVALID_CONFIRMATION },
      });
    });

    it('deletes after a valid confirmation', async () => {
      users.findAuthById.mockResolvedValue(passwordUser);
      passwords.verify.mockResolvedValue(true);

      await expect(
        service.deleteAccount('user-1', { currentPassword: 'SenhaForte1' }),
      ).resolves.toMatchObject({ success: true });
      expect(profiles.deleteAccount).toHaveBeenCalledWith('user-1');
    });

    it('deletes a social account confirmed by username', async () => {
      users.findAuthById.mockResolvedValue(googleUser);

      await expect(
        service.deleteAccount('user-1', { confirmUsername: '@ana' }),
      ).resolves.toMatchObject({ success: true });
      expect(profiles.deleteAccount).toHaveBeenCalledWith('user-1');
    });

    it('refuses when the session points to a user that no longer exists', async () => {
      users.findAuthById.mockResolvedValue(null);

      await expect(service.deleteAccount('user-1', {})).rejects.toMatchObject({
        response: { code: AUTH_ERROR.UNAUTHENTICATED },
      });
    });
  });
});
