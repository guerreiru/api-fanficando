import { HttpException, HttpStatus } from '@nestjs/common';
import { CATEGORY_RULES, TAG_RULES } from './catalog.constants';

export class CatalogException extends HttpException {
  constructor(
    status: HttpStatus,
    error: string,
    code: string,
    extras: Record<string, unknown> = {},
  ) {
    super({ error, code, ...extras }, status);
  }
}

export const CATALOG_ERROR = {
  INVALID_CATEGORY_NAME: 'INVALID_CATEGORY_NAME',
  CATEGORY_NAME_TAKEN: 'CATEGORY_NAME_TAKEN',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  INVALID_TAG_NAME: 'INVALID_TAG_NAME',
  INVALID_TAG_TYPE: 'INVALID_TAG_TYPE',
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  TOO_MANY_TAGS: 'TOO_MANY_TAGS',
} as const;

export function invalidCategoryName(): CatalogException {
  return new CatalogException(
    HttpStatus.BAD_REQUEST,
    `O nome da categoria deve ter de ${CATEGORY_RULES.minLength} a ${CATEGORY_RULES.maxLength} caracteres.`,
    CATALOG_ERROR.INVALID_CATEGORY_NAME,
  );
}

export function categoryNameTaken(): CatalogException {
  return new CatalogException(
    HttpStatus.CONFLICT,
    'Já existe uma categoria com este nome.',
    CATALOG_ERROR.CATEGORY_NAME_TAKEN,
  );
}

export function categoryNotFound(): CatalogException {
  return new CatalogException(
    HttpStatus.NOT_FOUND,
    'Categoria não encontrada.',
    CATALOG_ERROR.CATEGORY_NOT_FOUND,
  );
}

export function invalidTagName(): CatalogException {
  return new CatalogException(
    HttpStatus.BAD_REQUEST,
    `A tag deve ter de ${TAG_RULES.minLength} a ${TAG_RULES.maxLength} caracteres e conter letras ou números.`,
    CATALOG_ERROR.INVALID_TAG_NAME,
  );
}

export function invalidTagType(): CatalogException {
  return new CatalogException(
    HttpStatus.BAD_REQUEST,
    'Tipo de tag inválido.',
    CATALOG_ERROR.INVALID_TAG_TYPE,
  );
}

export function tagNotFound(): CatalogException {
  return new CatalogException(
    HttpStatus.NOT_FOUND,
    'Tag não encontrada.',
    CATALOG_ERROR.TAG_NOT_FOUND,
  );
}

export function tooManyTags(): CatalogException {
  return new CatalogException(
    HttpStatus.BAD_REQUEST,
    `Use no máximo ${TAG_RULES.maxPerRequest} tags.`,
    CATALOG_ERROR.TOO_MANY_TAGS,
    { max: TAG_RULES.maxPerRequest },
  );
}
