import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TAG_RULES, TAG_TYPE_RULES } from '../../domain/catalog.constants';

export class CreateTagsDto {
  /** O editor manda a lista de uma vez; uma tag só também é aceita. */
  @Transform(({ value }: { value: unknown }): unknown[] =>
    Array.isArray(value) ? (value as unknown[]) : [value],
  )
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(TAG_RULES.maxPerRequest)
  @IsString({ each: true })
  @MaxLength(TAG_RULES.maxLength, { each: true })
  names: string[];

  @IsOptional()
  @IsString()
  @MaxLength(TAG_TYPE_RULES.maxLength)
  type?: string;
}
