import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  TAG_RULES,
  TAG_SEARCH_RULES,
  TAG_TYPE_RULES,
} from '../../domain/catalog.constants';

export class ListTagsDto {
  @IsOptional()
  @IsString()
  @MaxLength(TAG_RULES.maxLength)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(TAG_TYPE_RULES.maxLength)
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(TAG_SEARCH_RULES.maxLimit)
  limit?: number;
}
