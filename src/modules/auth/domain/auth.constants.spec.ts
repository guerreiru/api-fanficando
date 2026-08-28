import { parseDurationToMs } from './auth.constants';

describe('parseDurationToMs', () => {
  it('parses minutes, hours and days', () => {
    expect(parseDurationToMs('15m', 0)).toBe(15 * 60_000);
    expect(parseDurationToMs('1h', 0)).toBe(3_600_000);
    expect(parseDurationToMs('7d', 0)).toBe(7 * 86_400_000);
  });

  it('falls back on invalid values', () => {
    expect(parseDurationToMs('nope', 123)).toBe(123);
  });
});
