import { DEFAULT_TAG_TYPE } from './catalog.constants';
import { invalidTagName, invalidTagType, tooManyTags } from './catalog.errors';
import {
  normalizeTagName,
  normalizeTagType,
  parseTagInputs,
  slugFromTagName,
  slugOrNull,
  toTagInput,
} from './tag-name';

describe('normalizeTagName', () => {
  it('collapses whitespace and strips markup', () => {
    expect(normalizeTagName('  Enemies   to <i>Lovers</i> ')).toBe(
      'Enemies to Lovers',
    );
  });

  it('rejects names outside the length limits', () => {
    expect(() => normalizeTagName('a')).toThrow(invalidTagName());
    expect(() => normalizeTagName('a'.repeat(256))).toThrow(invalidTagName());
  });
});

describe('slugFromTagName', () => {
  it('folds case, accents and separators into one identity', () => {
    expect(slugFromTagName('Enemies to Lovers')).toBe('enemies-to-lovers');
    expect(slugFromTagName('enemies-to-lovers')).toBe('enemies-to-lovers');
    expect(slugFromTagName('Ação e Aventura')).toBe('acao-e-aventura');
  });

  it('keeps non-latin letters instead of rejecting the tag', () => {
    expect(slugFromTagName('進撃の巨人')).toBe('進撃の巨人');
  });

  it('rejects a name with no letters or numbers', () => {
    expect(() => slugFromTagName('!!!')).toThrow(invalidTagName());
  });
});

describe('parseTagInputs', () => {
  it('accepts a single name', () => {
    expect(parseTagInputs('Slow Burn')).toEqual([
      { name: 'Slow Burn', slug: 'slow-burn' },
    ]);
  });

  it('dedupes by slug keeping the first spelling', () => {
    expect(
      parseTagInputs(['Slow Burn', 'slow-burn', 'SLOW BURN', 'Fluff']),
    ).toEqual([
      { name: 'Slow Burn', slug: 'slow-burn' },
      { name: 'Fluff', slug: 'fluff' },
    ]);
  });

  it('rejects more tags than allowed per request', () => {
    const names = Array.from({ length: 31 }, (_, i) => `tag-${i}`);
    expect(() => parseTagInputs(names)).toThrow(tooManyTags());
  });

  it('rejects the whole list when one entry is invalid', () => {
    expect(() => parseTagInputs(['Fluff', 'a'])).toThrow(invalidTagName());
  });

  it('rejects an empty list', () => {
    expect(() => parseTagInputs([])).toThrow(invalidTagName());
  });
});

describe('normalizeTagType', () => {
  it('falls back to the schema default', () => {
    expect(normalizeTagType(undefined)).toBe(DEFAULT_TAG_TYPE);
    expect(normalizeTagType('')).toBe(DEFAULT_TAG_TYPE);
  });

  it('accepts a token and normalizes the case', () => {
    expect(normalizeTagType(' Fandom ')).toBe('fandom');
    expect(normalizeTagType('character_relationship')).toBe(
      'character_relationship',
    );
  });

  it('rejects anything that would not survive a url filter', () => {
    expect(() => normalizeTagType('tipo com espaço')).toThrow(invalidTagType());
    expect(() => normalizeTagType('1fandom')).toThrow(invalidTagType());
    expect(() => normalizeTagType(42)).toThrow(invalidTagType());
  });
});

describe('slugOrNull', () => {
  it('normalizes a display name into its slug', () => {
    expect(slugOrNull('Ação e Aventura')).toBe('acao-e-aventura');
  });

  it('returns null instead of throwing for junk', () => {
    expect(slugOrNull('!')).toBeNull();
    expect(slugOrNull(undefined)).toBeNull();
  });
});

describe('toTagInput', () => {
  it('pairs the typed name with its slug', () => {
    expect(toTagInput('  Hurt/Comfort ')).toEqual({
      name: 'Hurt/Comfort',
      slug: 'hurt-comfort',
    });
  });
});
