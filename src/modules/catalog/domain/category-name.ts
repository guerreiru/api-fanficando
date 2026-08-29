import { CATEGORY_RULES } from './catalog.constants';
import { invalidCategoryName } from './catalog.errors';

// eslint-disable-next-line no-control-regex -- caracteres de controle
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/**
 * Preserva a caixa digitada (é o rótulo exibido); a unicidade é resolvida na
 * comparação case-insensitive, não aqui.
 */
export function normalizeCategoryName(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw invalidCategoryName();
  }

  const cleaned = raw
    .replace(/<[^>]*>/g, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    cleaned.length < CATEGORY_RULES.minLength ||
    cleaned.length > CATEGORY_RULES.maxLength
  ) {
    throw invalidCategoryName();
  }

  return cleaned;
}
