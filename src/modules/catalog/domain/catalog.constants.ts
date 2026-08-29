export const CATEGORY_RULES = {
  minLength: 2,
  maxLength: 100,
} as const;

export const TAG_RULES = {
  minLength: 2,
  maxLength: 255,
  slugMaxLength: 255,
  /** Teto por história: o formulário manda a lista inteira de uma vez. */
  maxPerRequest: 30,
} as const;

/**
 * `type` é VARCHAR livre no banco, com default `trope`. Em vez de fixar uma
 * lista (que quebraria a cada categoria nova de tag), a validação exige só um
 * token estável, usável em filtro de URL.
 */
export const TAG_TYPE_RULES = {
  maxLength: 50,
  format: /^[a-z][a-z_]{1,49}$/,
} as const;

export const DEFAULT_TAG_TYPE = 'trope';

export const TAG_SEARCH_RULES = {
  defaultLimit: 20,
  maxLimit: 50,
  minSearchLength: 2,
} as const;
