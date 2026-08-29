import { invalidCategoryName } from './catalog.errors';
import { normalizeCategoryName } from './category-name';

describe('normalizeCategoryName', () => {
  const rejected = invalidCategoryName();

  it('collapses whitespace and strips markup, keeping the typed case', () => {
    expect(normalizeCategoryName('  Anime   e <b>Mangá</b> ')).toBe(
      'Anime e Mangá',
    );
  });

  it('rejects a name below the minimum length', () => {
    expect(() => normalizeCategoryName('a')).toThrow(rejected);
    expect(() => normalizeCategoryName('   ')).toThrow(rejected);
  });

  it('rejects a name above the column limit', () => {
    expect(() => normalizeCategoryName('a'.repeat(101))).toThrow(rejected);
  });

  it('rejects non-string input', () => {
    expect(() => normalizeCategoryName(42)).toThrow(rejected);
    expect(() => normalizeCategoryName(null)).toThrow(rejected);
  });
});
