jest.mock('../../mail/mail.service', () => ({
  MailService: class MailService {},
}));
jest.mock('../infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));
jest.mock('../infrastructure/email-change-token.repository', () => ({
  EmailChangeTokenRepository: class EmailChangeTokenRepository {},
}));
jest.mock('./password.service', () => ({
  PasswordService: class PasswordService {},
}));

import { AUTH_ERROR } from '../domain/auth.errors';
import { EmailChangeService } from './email-change.service';

describe('EmailChangeService', () => {
  const tokens = {
    deleteTokensForUser: jest.fn(),
    createToken: jest.fn(),
    findByToken: jest.fn(),
    deleteToken: jest.fn(),
    applyEmailChange: jest.fn(),
  };
  const users = {
    findAuthById: jest.fn(),
    findByEmail: jest.fn(),
  };
  const passwords = {
    verify: jest.fn(),
  };
  const mail = {
    sendEmailChangeConfirmation: jest.fn(),
  };

  const service = new EmailChangeService(
    tokens as never,
    users as never,
    passwords as never,
    mail as never,
  );

  const passwordUser = {
    id: 'user-1',
    email: 'old@test.com',
    password: 'hash',
    googleId: null,
    socialProvider: null,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mail.sendEmailChangeConfirmation.mockResolvedValue({ sent: true });
  });

  it('refuses email change for Google accounts', async () => {
    users.findAuthById.mockResolvedValue({
      ...passwordUser,
      googleId: 'sub-1',
      socialProvider: 'google',
    });

    await expect(
      service.requestChange('user-1', 'new@test.com', 'SenhaForte1'),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.SOCIAL_ACCOUNT },
    });
  });

  it('sends a confirmation to the pending email', async () => {
    users.findAuthById.mockResolvedValue(passwordUser);
    passwords.verify.mockResolvedValue(true);
    users.findByEmail.mockResolvedValue(null);

    await expect(
      service.requestChange('user-1', 'new@test.com', 'SenhaForte1'),
    ).resolves.toMatchObject({
      success: true,
      pendingEmail: 'new@test.com',
    });
    expect(mail.sendEmailChangeConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'new@test.com' }),
    );
  });

  it('confirms the token and applies the new email', async () => {
    tokens.findByToken.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      pendingEmail: 'new@test.com',
      expiresAt: new Date(Date.now() + 60_000),
      user: { email: 'old@test.com' },
    });
    users.findByEmail.mockResolvedValue(null);

    await expect(service.confirm('token')).resolves.toEqual({
      success: true,
      email: 'new@test.com',
    });
    expect(tokens.applyEmailChange).toHaveBeenCalledWith(
      'user-1',
      'new@test.com',
    );
  });

  it('refuses a pending email already used by another account', async () => {
    tokens.findByToken.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      pendingEmail: 'new@test.com',
      expiresAt: new Date(Date.now() + 60_000),
      user: { email: 'old@test.com' },
    });
    users.findByEmail.mockResolvedValue({ id: 'user-2' });

    await expect(service.confirm('token')).rejects.toMatchObject({
      response: { code: AUTH_ERROR.EMAIL_IN_USE },
    });
    expect(tokens.applyEmailChange).not.toHaveBeenCalled();
    expect(tokens.deleteToken).toHaveBeenCalledWith('tok-1');
  });
});
