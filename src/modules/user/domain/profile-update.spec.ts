import {
  normalizeBio,
  normalizeDisplayName,
  parseProfileUpdate,
} from './profile-update';
import {
  invalidAvatarUrl,
  invalidBio,
  invalidName,
  invalidProfileField,
  nothingToUpdate,
} from './user.errors';

describe('normalizeDisplayName', () => {
  it('collapses whitespace and strips markup', () => {
    expect(normalizeDisplayName('  Ana   <b>Maria</b> ')).toBe('Ana Maria');
  });

  it('turns empty input into removal', () => {
    expect(normalizeDisplayName('   ')).toBeNull();
    expect(normalizeDisplayName(null)).toBeNull();
  });

  it('rejects names above the column limit', () => {
    expect(() => normalizeDisplayName('a'.repeat(256))).toThrow(invalidName());
  });
});

describe('normalizeBio', () => {
  it('keeps paragraphs but collapses runs of blank lines', () => {
    expect(normalizeBio('Linha 1\r\n\r\n\r\n\r\nLinha 2')).toBe(
      'Linha 1\n\nLinha 2',
    );
  });

  it('strips control characters other than newline', () => {
    expect(normalizeBio('Escrevo\u0000 fanfics\u0007')).toBe('Escrevo fanfics');
  });

  it('rejects a bio above the limit', () => {
    expect(() => normalizeBio('a'.repeat(501))).toThrow(invalidBio());
  });
});

describe('parseProfileUpdate', () => {
  const hosts = ['cdn.fanficando.com'];

  it('only includes the fields present in the request', () => {
    expect(parseProfileUpdate({ bio: 'Oi' }, hosts)).toEqual({ bio: 'Oi' });
  });

  it('uses null to clear a field', () => {
    expect(parseProfileUpdate({ name: null, avatarUrl: '' }, hosts)).toEqual({
      name: null,
      avatarUrl: null,
    });
  });

  it('accepts boolean flags sent as strings', () => {
    expect(parseProfileUpdate({ emailNotifications: 'false' }, hosts)).toEqual({
      emailNotifications: false,
    });
  });

  it('rejects a flag that is neither boolean nor boolean-like', () => {
    expect(() =>
      parseProfileUpdate({ emailNotifications: 'talvez' }, hosts),
    ).toThrow(invalidProfileField('emailNotifications'));
  });

  it('accepts a numeric tour version and rejects an out-of-range one', () => {
    expect(parseProfileUpdate({ tourVersion: '3' }, hosts)).toEqual({
      tourVersion: 3,
    });
    expect(() => parseProfileUpdate({ tourVersion: -1 }, hosts)).toThrow(
      invalidProfileField('tourVersion'),
    );
  });

  it('refuses an empty patch', () => {
    expect(() => parseProfileUpdate({}, hosts)).toThrow(nothingToUpdate());
  });

  it('validates the avatar host', () => {
    expect(() =>
      parseProfileUpdate({ avatarUrl: 'https://evil.com/a.png' }, hosts),
    ).toThrow(invalidAvatarUrl());
  });
});
