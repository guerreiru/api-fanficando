import { userNeedsProfileCompletion } from './profile-completion';

describe('userNeedsProfileCompletion', () => {
  it('requires birth date and age confirmation', () => {
    expect(
      userNeedsProfileCompletion({ birthDate: null, ageVerified: false }),
    ).toBe(true);
    expect(
      userNeedsProfileCompletion({
        birthDate: '2000-01-01',
        ageVerified: false,
      }),
    ).toBe(true);
    expect(
      userNeedsProfileCompletion({
        birthDate: '2000-01-01',
        ageVerified: true,
      }),
    ).toBe(false);
  });
});
