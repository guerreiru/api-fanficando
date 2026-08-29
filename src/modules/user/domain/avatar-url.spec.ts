import { normalizeAvatarUrl } from './avatar-url';
import { invalidAvatarUrl } from './user.errors';

describe('normalizeAvatarUrl', () => {
  const hosts = ['cdn.fanficando.com', '*.r2.dev'];
  const rejected = invalidAvatarUrl();

  it('accepts a url on an allowed host', () => {
    expect(
      normalizeAvatarUrl('https://cdn.fanficando.com/avatars/a.webp', hosts),
    ).toBe('https://cdn.fanficando.com/avatars/a.webp');
  });

  it('accepts a subdomain of a wildcard host but not the apex', () => {
    expect(normalizeAvatarUrl('https://pub-1.r2.dev/a.webp', hosts)).toBe(
      'https://pub-1.r2.dev/a.webp',
    );
    expect(() => normalizeAvatarUrl('https://r2.dev/a.webp', hosts)).toThrow(
      rejected,
    );
  });

  it('treats empty input as removal', () => {
    expect(normalizeAvatarUrl('   ', hosts)).toBeNull();
    expect(normalizeAvatarUrl(null, hosts)).toBeNull();
    expect(normalizeAvatarUrl(undefined, hosts)).toBeNull();
  });

  it('rejects hosts outside the cdn', () => {
    expect(() =>
      normalizeAvatarUrl('https://evil.com/beacon.png', hosts),
    ).toThrow(rejected);
  });

  it('rejects a lookalike host that only ends with the allowed name', () => {
    expect(() =>
      normalizeAvatarUrl('https://evilcdn.fanficando.com.evil.io/a.png', hosts),
    ).toThrow(rejected);
  });

  it('rejects non-https urls', () => {
    expect(() =>
      normalizeAvatarUrl('http://cdn.fanficando.com/a.webp', hosts),
    ).toThrow(rejected);
    expect(() => normalizeAvatarUrl('javascript:alert(1)', hosts)).toThrow(
      rejected,
    );
  });

  it('rejects credentials embedded in the url', () => {
    expect(() =>
      normalizeAvatarUrl('https://user:pass@cdn.fanficando.com/a.webp', hosts),
    ).toThrow(rejected);
  });

  it('rejects non-string and oversized values', () => {
    expect(() => normalizeAvatarUrl(42, hosts)).toThrow(rejected);
    expect(() =>
      normalizeAvatarUrl(
        `https://cdn.fanficando.com/${'a'.repeat(600)}.webp`,
        hosts,
      ),
    ).toThrow(rejected);
  });

  it('drops the fragment', () => {
    expect(
      normalizeAvatarUrl('https://cdn.fanficando.com/a.webp#x', hosts),
    ).toBe('https://cdn.fanficando.com/a.webp');
  });

  it('rejects everything when no host is configured', () => {
    expect(() =>
      normalizeAvatarUrl('https://cdn.fanficando.com/a.webp', []),
    ).toThrow(rejected);
  });
});
