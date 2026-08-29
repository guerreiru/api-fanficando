import { TAG_SEARCH_RULES } from './catalog.constants';
import { invalidTagType } from './catalog.errors';
import { parseTagSearch } from './tag-search';

describe('parseTagSearch', () => {
  it('applies the default limit', () => {
    expect(parseTagSearch({})).toEqual({
      search: undefined,
      type: undefined,
      limit: TAG_SEARCH_RULES.defaultLimit,
    });
  });

  it('ignores a search term that is too short to be useful', () => {
    expect(parseTagSearch({ search: ' e ' }).search).toBeUndefined();
    expect(parseTagSearch({ search: ' en ' }).search).toBe('en');
  });

  it('caps the limit and falls back on garbage', () => {
    expect(parseTagSearch({ limit: 500 }).limit).toBe(
      TAG_SEARCH_RULES.maxLimit,
    );
    expect(parseTagSearch({ limit: '10' }).limit).toBe(10);
    expect(parseTagSearch({ limit: 0 }).limit).toBe(
      TAG_SEARCH_RULES.defaultLimit,
    );
    expect(parseTagSearch({ limit: 'abc' }).limit).toBe(
      TAG_SEARCH_RULES.defaultLimit,
    );
  });

  it('keeps the type filter absent instead of defaulting it', () => {
    expect(parseTagSearch({ type: undefined }).type).toBeUndefined();
    expect(parseTagSearch({ type: 'Fandom' }).type).toBe('fandom');
    expect(() => parseTagSearch({ type: 'nope!' })).toThrow(invalidTagType());
  });
});
