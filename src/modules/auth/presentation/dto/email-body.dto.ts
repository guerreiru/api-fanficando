import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, MaxLength } from 'class-validator';
import { EMAIL_RULES } from '../../domain/auth.constants';

export class EmailBodyDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  @MaxLength(EMAIL_RULES.maxLength)
  email?: string;
}
