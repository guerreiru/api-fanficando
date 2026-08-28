import {
  parseVisitorAgeAckTiers,
  resolveVisitorAckTierFromInput,
  signVisitorAgeAck,
} from './visitor-age';

describe('visitor-age', () => {
  it('maps 12/14/16 to the 16 tier and 18 to 18', () => {
    expect(resolveVisitorAckTierFromInput(12)).toBe(16);
    expect(resolveVisitorAckTierFromInput(14)).toBe(16);
    expect(resolveVisitorAckTierFromInput(16)).toBe(16);
    expect(resolveVisitorAckTierFromInput(18)).toBe(18);
    expect(resolveVisitorAckTierFromInput(21)).toBeNull();
  });

  it('round-trips a signed cookie payload', () => {
    const value = signVisitorAgeAck(
      {
        v: 1,
        tiers: [16],
        exp: Date.now() + 60_000,
      },
      'test-secret',
    );

    expect(parseVisitorAgeAckTiers(value, 'test-secret')).toEqual([16]);
    expect(parseVisitorAgeAckTiers(value, 'other-secret')).toEqual([]);
  });
});
