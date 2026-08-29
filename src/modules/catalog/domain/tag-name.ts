import {
  DEFAULT_TAG_TYPE,
  TAG_RULES,
  TAG_TYPE_RULES,
} from './catalog.constants';
import { invalidTagName, invalidTagType, tooManyTags } from './catalog.errors';
import type { TagInput } from './catalog.types';

// eslint-disable-next-line no-control-regex -- caracteres de controle
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function normalizeTagName(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw invalidTagName();
  }

  const cleaned = raw
    .replace(/<[^>]*>/g, '')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    cleaned.length < TAG_RULES.minLength ||
    cleaned.length > TAG_RULES.maxLength
  ) {
    throw invalidTagName();
  }

  return cleaned;
}

/**
 * O slug é a identidade da tag: "Enemies to Lovers", "enemies to lovers" e
 * "enemies-to-lovers" viram a mesma entrada, e acento não cria duplicata.
 * Letra não-latina é preservada (`\p{L}`) para não recusar tag em japonês.
 */
export function slugFromTagName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TAG_RULES.slugMaxLength)
    .replace(/-+$/, '');

  if (!slug) {
    throw invalidTagName();
  }

  return slug;
}

/**
 * Para lookup por URL: devolve `null` em vez de estourar, porque um slug que
 * nem chega a ser válido é simplesmente uma tag que não existe (404).
 */
export function slugOrNull(raw: unknown): string | null {
  try {
    return slugFromTagName(normalizeTagName(raw));
  } catch {
    return null;
  }
}

export function toTagInput(raw: unknown): TagInput {
  const name = normalizeTagName(raw);
  return { name, slug: slugFromTagName(name) };
}

/**
 * Aceita uma tag ou a lista inteira do formulário. Duplicata no mesmo pedido é
 * resolvida pelo slug, mantendo a primeira grafia digitada.
 */
export function parseTagInputs(raw: unknown): TagInput[] {
  const list = Array.isArray(raw) ? raw : [raw];

  if (list.length > TAG_RULES.maxPerRequest) {
    throw tooManyTags();
  }

  const bySlug = new Map<string, TagInput>();
  for (const entry of list) {
    const tag = toTagInput(entry);
    if (!bySlug.has(tag.slug)) {
      bySlug.set(tag.slug, tag);
    }
  }

  if (bySlug.size === 0) {
    throw invalidTagName();
  }

  return [...bySlug.values()];
}

export function normalizeTagType(raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_TAG_TYPE;
  }

  if (typeof raw !== 'string') {
    throw invalidTagType();
  }

  const normalized = raw.trim().toLowerCase();
  if (!TAG_TYPE_RULES.format.test(normalized)) {
    throw invalidTagType();
  }

  return normalized;
}
