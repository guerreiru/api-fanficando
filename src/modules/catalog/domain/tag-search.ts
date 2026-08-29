import { TAG_SEARCH_RULES } from './catalog.constants';
import { normalizeTagType } from './tag-name';
import type { TagSearchParams, TagSearchQuery } from './catalog.types';

/**
 * Busca curta demais é ignorada em vez de recusada: o autocomplete dispara a
 * cada tecla e precisa continuar respondendo a lista inicial.
 */
export function parseTagSearch(query: TagSearchQuery): TagSearchParams {
  const rawSearch = typeof query.search === 'string' ? query.search.trim() : '';
  const search =
    rawSearch.length >= TAG_SEARCH_RULES.minSearchLength
      ? rawSearch
      : undefined;

  const type =
    query.type === undefined || query.type === null || query.type === ''
      ? undefined
      : normalizeTagType(query.type);

  return { search, type, limit: parseLimit(query.limit) };
}

function parseLimit(raw: unknown): number {
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number.parseInt(raw, 10)
        : Number.NaN;

  if (!Number.isInteger(value) || value < 1) {
    return TAG_SEARCH_RULES.defaultLimit;
  }

  return Math.min(value, TAG_SEARCH_RULES.maxLimit);
}
