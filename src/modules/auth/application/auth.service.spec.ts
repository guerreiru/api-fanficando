jest.mock('../infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));
jest.mock('./session.service', () => ({
  SessionService: class SessionService {},
}));
jest.mock('../infrastructure/google-id-token.service', () => ({
  GoogleIdTokenService: class GoogleIdTokenService {},
}));
jest.mock('../infrastructure/profile-completion-token.service', () => ({
  ProfileCompletionTokenService: class ProfileCompletionTokenService {},
}));
jest.mock('./email-verification.service', () => ({
  EmailVerificationService: class EmailVerificationService {},
}));

import { AUTH_ERROR } from '../domain/auth.errors';
import { AuthService } from './auth.service';
import type { PasswordService } from './password.service';
import type { SessionService } from './session.service';
import type { AuthUserRepository } from '../infrastructure/auth-user.repository';
import type { GoogleIdTokenService } from '../infrastructure/google-id-token.service';
import type { ProfileCompletionTokenService } from '../infrastructure/profile-completion-token.service';
import type { EmailVerificationService } from './email-verification.service';

describe('AuthService', () => {
  const users = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findAuthById: jest.fn(),
    findAuthContext: jest.fn(),
    create: jest.fn(),
    findSocialAccount: jest.fn(),
    upsertSocialAccount: jest.fn(),
    syncGoogleAccountFields: jest.fn(),
    isUsernameTaken: jest.fn(),
    completeProfile: jest.fn(),
    setUsername: jest.fn(),
  };
  const passwords = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const sessions = {
    issue: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
  };
  const googleTokens = {
    verify: jest.fn(),
  };
  const profileCompletionTokens = {
    issue: jest.fn(),
    verify: jest.fn(),
  };
  const emailVerification = {
    issueAndSend: jest.fn(),
  };

  const service = new AuthService(
    users as unknown as AuthUserRepository,
    passwords as unknown as PasswordService,
    sessions as unknown as SessionService,
    googleTokens as unknown as GoogleIdTokenService,
    profileCompletionTokens as unknown as ProfileCompletionTokenService,
    emailVerification as unknown as EmailVerificationService,
  );

  const googleIdentity = {
    providerUserId: 'google-sub-1',
    email: 'ana@gmail.com',
    name: 'Ana Silva',
    avatar: 'https://example.com/a.png',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    profileCompletionTokens.issue.mockResolvedValue('completion.jwt');
    emailVerification.issueAndSend.mockResolvedValue({ sent: true });
    users.isUsernameTaken.mockResolvedValue(false);
    users.upsertSocialAccount.mockResolvedValue(true);
    sessions.issue.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'user-1' },
    });
  });

  it('rejects login with a generic error when the password is wrong', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      password: 'hash',
      suspendedAt: null,
    });
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: 'a@test.com', password: 'x' }, {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_CREDENTIALS },
    });
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it('rejects login with the same generic error when the email does not exist', async () => {
    users.findByEmail.mockResolvedValue(null);
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: 'ghost@test.com', password: 'x' }, {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_CREDENTIALS },
    });
    expect(passwords.verify).toHaveBeenCalled();
  });

  it('blocks a suspended account after a valid password', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      password: 'hash',
      suspendedAt: new Date(),
    });
    passwords.verify.mockResolvedValue(true);

    await expect(
      service.login({ email: 'a@test.com', password: 'ok' }, {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.ACCOUNT_SUSPENDED },
    });
  });

  it('does not create an email account without terms and age confirmation', async () => {
    await expect(
      service.register({
        email: 'a@test.com',
        password: 'SenhaForte1',
        termsAccepted: false,
        ageVerified: true,
        birthDate: '1995-03-10',
      }),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.TERMS_NOT_ACCEPTED },
    });
    expect(passwords.hash).not.toHaveBeenCalled();
    expect(users.create).not.toHaveBeenCalled();
  });

  it('persists username, terms and age after a valid email registration', async () => {
    passwords.hash.mockResolvedValue('hashed');
    users.create.mockResolvedValue({ id: 'user-1', email: 'a@test.com' });

    await service.register({
      email: 'a@test.com',
      password: 'SenhaForte1',
      username: 'mariasilva',
      termsAccepted: true,
      ageVerified: true,
      birthDate: '1995-03-10',
    });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'a@test.com',
        password: 'hashed',
        username: 'mariasilva',
        termsAccepted: true,
        ageVerified: true,
      }),
    );
    expect(emailVerification.issueAndSend).toHaveBeenCalledWith(
      'user-1',
      'a@test.com',
    );
  });

  it('does not open a session before the email is confirmed', async () => {
    passwords.hash.mockResolvedValue('hashed');
    users.create.mockResolvedValue({ id: 'user-1', email: 'a@test.com' });

    const result = await service.register({
      email: 'a@test.com',
      password: 'SenhaForte1',
      username: 'mariasilva',
      termsAccepted: true,
      ageVerified: true,
      birthDate: '1995-03-10',
    });

    expect(result).toMatchObject({ requiresEmailVerification: true });
    expect(result).not.toHaveProperty('accessToken');
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it('rejects a taken username on register with a suggestion', async () => {
    users.isUsernameTaken.mockImplementation((candidate: string) =>
      Promise.resolve(candidate === 'mariasilva'),
    );

    await expect(
      service.register({
        email: 'a@test.com',
        password: 'SenhaForte1',
        username: 'mariasilva',
        termsAccepted: true,
        ageVerified: true,
        birthDate: '1995-03-10',
      }),
    ).rejects.toMatchObject({
      response: {
        code: AUTH_ERROR.USERNAME_TAKEN,
        suggestion: 'mariasilva2',
      },
    });
    expect(users.create).not.toHaveBeenCalled();
    expect(passwords.hash).not.toHaveBeenCalled();
  });

  it('blocks password login when the email is not verified', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      password: 'hash',
      suspendedAt: null,
      emailVerified: false,
      googleId: null,
      socialProvider: null,
    });
    passwords.verify.mockResolvedValue(true);

    await expect(
      service.login({ email: 'a@test.com', password: 'ok' }, {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.EMAIL_NOT_VERIFIED },
    });
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it('refuses password login on a social account with the generic error', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      password: 'hash',
      suspendedAt: null,
      emailVerified: true,
      googleId: 'google-sub-1',
      socialProvider: 'google',
      username: 'anasilva',
      birthDate: '1995-03-10',
      ageVerified: true,
    });
    passwords.verify.mockResolvedValue(true);

    await expect(
      service.login({ email: 'ana@gmail.com', password: 'ok' }, {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_CREDENTIALS },
    });
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it('creates a Google account and asks for profile completion', async () => {
    googleTokens.verify.mockResolvedValue(googleIdentity);
    users.findSocialAccount.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(null);
    passwords.hash.mockResolvedValue('placeholder');
    users.create.mockResolvedValue({ id: 'user-google' });
    users.findAuthById.mockResolvedValue({
      id: 'user-google',
      email: 'ana@gmail.com',
      name: 'Ana Silva',
      username: null,
      emailVerified: true,
      termsAccepted: false,
      birthDate: null,
      ageVerified: false,
      avatarUrl: null,
      socialProvider: 'google',
      isAdmin: false,
      createdAt: new Date(),
      password: 'placeholder',
      suspendedAt: null,
      googleId: 'google-sub-1',
      socialProviderId: 'google-sub-1',
      emailVerifiedAt: new Date(),
    });

    const result = await service.googleTokenLogin('id-token', {});

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@gmail.com',
        emailVerified: true,
        socialProvider: 'google',
        googleId: 'google-sub-1',
      }),
    );
    expect(users.upsertSocialAccount).toHaveBeenCalledWith(
      'user-google',
      'google',
      'google-sub-1',
    );
    expect(sessions.issue).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      requiresProfileCompletion: true,
      completionPath: '/complete-profile',
      socialProfile: {
        provider: 'google',
        email: 'ana@gmail.com',
        name: 'Ana Silva',
      },
    });
  });

  it('does not auto-link Google to an existing email/password account', async () => {
    googleTokens.verify.mockResolvedValue(googleIdentity);
    users.findSocialAccount.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      googleId: null,
      password: 'hash',
      suspendedAt: null,
    });

    await expect(
      service.googleTokenLogin('id-token', {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.GOOGLE_SIGN_IN_REJECTED },
    });
    expect(users.create).not.toHaveBeenCalled();
  });

  it('answers a Google id collision with the same generic rejection', async () => {
    googleTokens.verify.mockResolvedValue(googleIdentity);
    users.findSocialAccount.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      googleId: 'another-sub',
    });

    await expect(
      service.googleTokenLogin('id-token', {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.GOOGLE_SIGN_IN_REJECTED },
    });
  });

  it('refuses to move a Google identity already linked to another user', async () => {
    googleTokens.verify.mockResolvedValue(googleIdentity);
    users.findSocialAccount.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({ id: 'user-google' });
    users.upsertSocialAccount.mockResolvedValue(false);

    await expect(
      service.googleTokenLogin('id-token', {}),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.GOOGLE_SIGN_IN_REJECTED },
    });
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it('issues a session for a complete Google account', async () => {
    googleTokens.verify.mockResolvedValue(googleIdentity);
    users.findSocialAccount.mockResolvedValue({
      id: 'user-google',
      googleId: 'google-sub-1',
      socialProvider: 'google',
      socialProviderId: 'google-sub-1',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
    users.findAuthById.mockResolvedValue({
      id: 'user-google',
      email: 'ana@gmail.com',
      name: 'Ana Silva',
      username: 'anasilva',
      emailVerified: true,
      termsAccepted: true,
      birthDate: '1995-03-10',
      ageVerified: true,
      avatarUrl: null,
      socialProvider: 'google',
      isAdmin: false,
      createdAt: new Date(),
      password: 'hash',
      suspendedAt: null,
      googleId: 'google-sub-1',
      socialProviderId: 'google-sub-1',
      emailVerifiedAt: new Date(),
    });

    const result = await service.googleTokenLogin('id-token', {});

    expect(sessions.issue).toHaveBeenCalled();
    expect(result).toMatchObject({ accessToken: 'access' });
  });

  it('completes a Google profile from the completion cookie', async () => {
    profileCompletionTokens.verify.mockResolvedValue({ userId: 'user-google' });
    users.findAuthContext.mockResolvedValue({
      id: 'user-google',
      suspendedAt: null,
    });
    users.isUsernameTaken.mockResolvedValue(false);
    users.completeProfile.mockResolvedValue({
      id: 'user-google',
      username: 'anasilva',
    });

    await service.completeProfile(
      {
        birth_date: '1995-03-10',
        age_verified: true,
        acceptTerms: true,
        username: 'anasilva',
      },
      {},
      undefined,
      'completion.jwt',
    );

    expect(users.completeProfile).toHaveBeenCalledWith(
      'user-google',
      expect.objectContaining({
        username: 'anasilva',
        ageVerified: true,
        termsAccepted: true,
      }),
    );
    expect(sessions.issue).toHaveBeenCalled();
  });

  it('refuses to complete the profile of an account suspended in the meantime', async () => {
    profileCompletionTokens.verify.mockResolvedValue({ userId: 'user-google' });
    users.findAuthContext.mockResolvedValue({
      id: 'user-google',
      suspendedAt: new Date(),
    });

    await expect(
      service.completeProfile(
        {
          birth_date: '1995-03-10',
          age_verified: true,
          acceptTerms: true,
          username: 'anasilva',
        },
        {},
        undefined,
        'completion.jwt',
      ),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.ACCOUNT_SUSPENDED },
    });
    expect(users.completeProfile).not.toHaveBeenCalled();
    expect(sessions.issue).not.toHaveBeenCalled();
  });

  it('does not mark terms as accepted when the Google flow omits acceptTerms', async () => {
    await expect(
      service.completeProfile(
        {
          birth_date: '1995-03-10',
          age_verified: true,
          username: 'anasilva',
        },
        {},
        undefined,
        'completion.jwt',
      ),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.TERMS_NOT_ACCEPTED },
    });
    expect(users.completeProfile).not.toHaveBeenCalled();
  });
});
