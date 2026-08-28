import { calculateAge, normalizeBirthDate, toBooleanFlag } from './birth-date';

describe('toBooleanFlag', () => {
  it('accepts true-like values and rejects the rest', () => {
    expect(toBooleanFlag(true)).toBe(true);
    expect(toBooleanFlag('true')).toBe(true);
    expect(toBooleanFlag('1')).toBe(true);
    expect(toBooleanFlag(false)).toBe(false);
    expect(toBooleanFlag('false')).toBe(false);
    expect(toBooleanFlag(undefined)).toBe(false);
  });
});

describe('normalizeBirthDate', () => {
  it('keeps a valid calendar date', () => {
    expect(normalizeBirthDate('1998-03-15')).toBe('1998-03-15');
  });

  it('rejects empty, invalid, future and pre-1900 dates', () => {
    expect(normalizeBirthDate('')).toBeNull();
    expect(normalizeBirthDate('not-a-date')).toBeNull();
    expect(normalizeBirthDate('2020-02-31')).toBeNull();
    expect(normalizeBirthDate('1899-12-31')).toBeNull();
    expect(normalizeBirthDate('2999-01-01')).toBeNull();
  });
});

describe('calculateAge', () => {
  it('returns the completed years of age', () => {
    const today = new Date();
    const thirteen = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate(),
    );
    const iso = `${thirteen.getFullYear()}-${String(thirteen.getMonth() + 1).padStart(2, '0')}-${String(thirteen.getDate()).padStart(2, '0')}`;
    expect(calculateAge(iso)).toBe(13);
  });
});
