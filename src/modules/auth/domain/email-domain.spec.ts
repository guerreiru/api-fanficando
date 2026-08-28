import { suggestEmailDomainCorrection } from './email-domain';

describe('suggestEmailDomainCorrection', () => {
  it('detects common typos', () => {
    expect(suggestEmailDomainCorrection('ana@gamil.com')).toBe('gmail.com');
    expect(suggestEmailDomainCorrection('ana@gmail.con')).toBe('gmail.com');
    expect(suggestEmailDomainCorrection('ana@hotnail.com')).toBe('hotmail.com');
    expect(suggestEmailDomainCorrection('ana@outlok.com')).toBe('outlook.com');
    expect(suggestEmailDomainCorrection('ana@yahooo.com')).toBe('yahoo.com');
  });

  it('returns null for a correct domain or invalid email', () => {
    expect(suggestEmailDomainCorrection('ana@gmail.com')).toBeNull();
    expect(suggestEmailDomainCorrection('sem-arroba')).toBeNull();
    expect(suggestEmailDomainCorrection('')).toBeNull();
  });
});
