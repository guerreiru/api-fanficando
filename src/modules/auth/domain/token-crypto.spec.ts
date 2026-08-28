import {
  generateRefreshToken,
  generateSecureHexToken,
  hashToken,
} from './token-crypto';

describe('token-crypto', () => {
  it('hashes tokens deterministically without storing the raw value', () => {
    const token = generateRefreshToken();
    expect(token).not.toContain(hashToken(token));
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('derives different hashes for different tokens', () => {
    expect(hashToken(generateSecureHexToken())).not.toBe(
      hashToken(generateSecureHexToken()),
    );
  });

  it('generates a 64-character hex email token', () => {
    expect(generateSecureHexToken()).toMatch(/^[a-f0-9]{64}$/);
  });
});
