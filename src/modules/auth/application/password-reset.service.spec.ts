jest.mock('../../mail/mail.service', () => ({
  MailService: class MailService {},
}));
jest.mock('../infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));
jest.mock('../infrastructure/password-reset-token.repository', () => ({
  PasswordResetTokenRepository: class PasswordResetTokenRepository {},
}));
jest.mock('./password.service', () => ({
  PasswordService: class PasswordService {},
}));

import { AUTH_ERROR } from '../domain/auth.errors';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  const tokens = {
    deleteTokensForUser: jest.fn(),
    createToken: jest.fn(),
    findByToken: jest.fn(),
    deleteToken: jest.fn(),
    applyPasswordReset: jest.fn(),
  };
  const users = {
    findByEmail: jest.fn(),
  };
  const passwords = {
    hash: jest.fn(),
  };
  const mail = {
    sendPasswordResetEmail: jest.fn(),
  };

  const service = new PasswordResetService(
    tokens as never,
    users as never,
    passwords as never,
    mail as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mail.sendPasswordResetEmail.mockResolvedValue({ sent: true });
    passwords.hash.mockResolvedValue('new-hash');
  });

  it('does not send a reset email for unknown addresses', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(service.requestReset('ghost@test.com')).resolves.toEqual({
      success: true,
    });
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('ignores Google accounts on forgot-password', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'ana@gmail.com',
      googleId: 'sub-1',
      socialProvider: 'google',
    });

    await expect(service.requestReset('ana@gmail.com')).resolves.toEqual({
      success: true,
    });
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends a reset email for a password account', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      googleId: null,
      socialProvider: null,
    });

    await expect(service.requestReset('a@test.com')).resolves.toEqual({
      success: true,
    });
    expect(tokens.createToken).toHaveBeenCalled();
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@test.com' }),
    );
  });

  it('applies password, revoke and token deletion in a single operation', async () => {
    tokens.findByToken.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.resetPassword('token', 'NovaSenha1')).resolves.toEqual(
      { success: true },
    );
    expect(tokens.applyPasswordReset).toHaveBeenCalledWith({
      userId: 'user-1',
      tokenId: 'tok-1',
      passwordHash: 'new-hash',
    });
  });

  it('rejects an expired reset token and drops it', async () => {
    tokens.findByToken.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(
      service.resetPassword('token', 'NovaSenha1'),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.TOKEN_EXPIRED },
    });
    expect(tokens.deleteToken).toHaveBeenCalledWith('tok-1');
    expect(tokens.applyPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects an unknown reset token', async () => {
    tokens.findByToken.mockResolvedValue(null);

    await expect(
      service.resetPassword('token', 'NovaSenha1'),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_TOKEN },
    });
    expect(tokens.applyPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects a short password', async () => {
    await expect(service.resetPassword('token', '123')).rejects.toMatchObject({
      response: { code: AUTH_ERROR.WEAK_PASSWORD },
    });
  });
});
