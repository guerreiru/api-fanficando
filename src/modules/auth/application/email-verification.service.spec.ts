jest.mock('../../mail/mail.service', () => ({
  MailService: class MailService {},
}));
jest.mock('../infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));
jest.mock('../infrastructure/email-verification-token.repository', () => ({
  EmailVerificationTokenRepository: class EmailVerificationTokenRepository {},
}));

import { AUTH_ERROR } from '../domain/auth.errors';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  const tokens = {
    deleteTokensForUser: jest.fn(),
    createToken: jest.fn(),
    findByToken: jest.fn(),
    deleteToken: jest.fn(),
    markUserVerified: jest.fn(),
    confirmVerification: jest.fn(),
  };
  const users = {
    findAuthById: jest.fn(),
    findByEmail: jest.fn(),
  };
  const mail = {
    sendVerificationEmail: jest.fn(),
  };

  const service = new EmailVerificationService(
    tokens as never,
    users as never,
    mail as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mail.sendVerificationEmail.mockResolvedValue({ sent: true });
  });

  it('returns success without sending when the email is unknown', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(service.resend(undefined, 'ghost@test.com')).resolves.toEqual({
      success: true,
    });
    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('marks a social account as verified on resend', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'ana@gmail.com',
      emailVerified: false,
      googleId: 'sub-1',
      socialProvider: 'google',
    });

    await expect(service.resend(undefined, 'ana@gmail.com')).resolves.toEqual({
      success: true,
    });
    expect(tokens.markUserVerified).toHaveBeenCalledWith('user-1');
    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('issues a new token for an unverified password account', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      emailVerified: false,
      googleId: null,
      socialProvider: null,
    });
    users.findAuthById.mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      emailVerified: false,
    });

    await expect(service.resend(undefined, 'a@test.com')).resolves.toEqual({
      success: true,
    });
    expect(tokens.createToken).toHaveBeenCalled();
    expect(mail.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@test.com' }),
    );
  });

  it('requires an email or a logged-in user to resend', async () => {
    await expect(service.resend(undefined, undefined)).rejects.toMatchObject({
      response: { code: AUTH_ERROR.EMAIL_REQUIRED },
    });
  });

  it('confirms a live verification token', async () => {
    tokens.findByToken.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
      user: { emailVerified: false },
    });

    await expect(service.confirm('abc')).resolves.toEqual({ success: true });
    expect(tokens.confirmVerification).toHaveBeenCalledWith('user-1', 'tok-1');
  });

  it('answers resend identically for unknown, verified and unverified emails', async () => {
    users.findByEmail.mockResolvedValue(null);
    const unknown = await service.resend(undefined, 'ghost@test.com');

    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      emailVerified: true,
      googleId: null,
      socialProvider: null,
    });
    const verified = await service.resend(undefined, 'a@test.com');

    users.findByEmail.mockResolvedValue({
      id: 'user-2',
      email: 'b@test.com',
      emailVerified: false,
      googleId: null,
      socialProvider: null,
    });
    users.findAuthById.mockResolvedValue({
      id: 'user-2',
      email: 'b@test.com',
      emailVerified: false,
    });
    const unverified = await service.resend(undefined, 'b@test.com');

    expect(unknown).toEqual({ success: true });
    expect(verified).toEqual(unknown);
    expect(unverified).toEqual(unknown);
  });

  it('never returns the raw token when issuing a verification email', async () => {
    users.findAuthById.mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      emailVerified: false,
    });

    const result = await service.issueAndSend('user-1', 'a@test.com');

    expect(result).not.toHaveProperty('token');
    expect(tokens.createToken).toHaveBeenCalled();
  });
});
