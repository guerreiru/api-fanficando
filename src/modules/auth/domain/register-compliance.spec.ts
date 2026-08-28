import { AuthException, AUTH_ERROR } from './auth.errors';
import { requirePasswordRegistrationCompliance } from './register-compliance';

const validAdult = {
  termsAccepted: true,
  ageVerified: true,
  birthDate: '1995-03-10',
};

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

describe('requirePasswordRegistrationCompliance', () => {
  it('accepts terms, age confirmation and a valid birth date', () => {
    const result = requirePasswordRegistrationCompliance(validAdult);
    expect(result.termsAccepted).toBe(true);
    expect(result.ageVerified).toBe(true);
    expect(result.birthDate.toISOString().startsWith('1995-03-10')).toBe(true);
  });

  it('rejects missing terms even if the client sent a birth date', () => {
    expectAuthCode(
      () =>
        requirePasswordRegistrationCompliance({
          ...validAdult,
          termsAccepted: false,
        }),
      AUTH_ERROR.TERMS_NOT_ACCEPTED,
    );
  });

  it('rejects a birth date without explicit age confirmation', () => {
    expectAuthCode(
      () =>
        requirePasswordRegistrationCompliance({
          ...validAdult,
          ageVerified: false,
        }),
      AUTH_ERROR.AGE_NOT_CONFIRMED,
    );
  });

  it('rejects users younger than the platform minimum age', () => {
    const today = new Date();
    const tooYoung = new Date(
      today.getFullYear() - 12,
      today.getMonth(),
      today.getDate(),
    );
    const birthDate = `${tooYoung.getFullYear()}-${String(tooYoung.getMonth() + 1).padStart(2, '0')}-${String(tooYoung.getDate()).padStart(2, '0')}`;

    expectAuthCode(
      () =>
        requirePasswordRegistrationCompliance({
          ...validAdult,
          birthDate,
        }),
      AUTH_ERROR.UNDERAGE,
    );
  });
});
