import { AUTH_ERROR, AuthException } from './auth.errors';
import { parseCompleteProfileInput } from './complete-profile-input';
import { PLATFORM_MIN_AGE } from './auth.constants';

function expectAuthCode(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AuthException);
    expect((error as AuthException).getResponse()).toMatchObject({ code });
    return;
  }

  throw new Error(`expected ${code}`);
}

describe('parseCompleteProfileInput', () => {
  it('accepts the HttpOnly completion cookie flow', () => {
    const result = parseCompleteProfileInput(
      {
        birth_date: '2000-05-15',
        age_verified: true,
        acceptTerms: true,
        username: 'sandraoliveira',
      },
      undefined,
      'abc',
    );

    expect(result).toMatchObject({
      mode: 'token',
      birthDate: '2000-05-15',
      username: 'sandraoliveira',
    });
  });

  it('requires a username in token mode', () => {
    expectAuthCode(
      () =>
        parseCompleteProfileInput(
          {
            birth_date: '2000-05-15',
            age_verified: true,
            acceptTerms: true,
          },
          undefined,
          'abc',
        ),
      AUTH_ERROR.USERNAME_REQUIRED,
    );
  });

  it('requires accepting the terms in token mode', () => {
    expectAuthCode(
      () =>
        parseCompleteProfileInput(
          {
            birth_date: '2000-05-15',
            age_verified: true,
            username: 'sandraoliveira',
          },
          undefined,
          'abc',
        ),
      AUTH_ERROR.TERMS_NOT_ACCEPTED,
    );
  });

  it('rejects users younger than the platform minimum age', () => {
    const today = new Date();
    const recentYear = today.getFullYear() - (PLATFORM_MIN_AGE - 1);
    const birthDate = `${recentYear}-01-01`;

    expectAuthCode(
      () =>
        parseCompleteProfileInput(
          {
            birth_date: birthDate,
            age_verified: true,
            acceptTerms: true,
            username: 'leitornovo',
          },
          undefined,
          'abc',
        ),
      AUTH_ERROR.UNDERAGE,
    );
  });

  it('ignores completionToken in the body and requires cookie or session', () => {
    expectAuthCode(
      () =>
        parseCompleteProfileInput(
          {
            birth_date: '2000-05-15',
            age_verified: true,
            username: 'leitornovo',
          },
          undefined,
          undefined,
        ),
      AUTH_ERROR.UNAUTHENTICATED,
    );
  });

  it('accepts the authenticated completion flow', () => {
    const result = parseCompleteProfileInput(
      {
        displayName: 'LeitorNovo',
        birthDate: '1995-03-10',
        acceptTerms: true,
        username: 'leitornovo',
      },
      'user-42',
    );

    expect(result).toMatchObject({
      mode: 'authenticated',
      userId: 'user-42',
      displayName: 'LeitorNovo',
      username: 'leitornovo',
    });
  });
});
