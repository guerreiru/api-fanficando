import { IsString, MaxLength } from 'class-validator';
import { CATEGORY_RULES } from '../../domain/catalog.constants';

/**
 * Serve para criar e para renomear: a categoria só tem nome. O limite mínimo e
 * a normalização ficam no domínio, que responde com código próprio.
 */
export class CategoryNameDto {
  @IsString()
  @MaxLength(CATEGORY_RULES.maxLength)
  name: string;
}
