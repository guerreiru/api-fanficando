import { Transform } from 'class-transformer';
import { Allow, IsOptional, IsString, MaxLength } from 'class-validator';
import { NAME_RULES, USERNAME_RULES } from '../../domain/auth.constants';

export class CompleteProfileDto {
  @Transform(
    ({ obj }: { obj: Record<string, unknown> }) =>
      obj.birthDate ?? obj.birth_date,
  )
  @IsOptional()
  @IsString()
  birthDate?: string;

  @Allow()
  birth_date?: string;

  @Allow()
  ageVerified?: unknown;

  @Allow()
  age_verified?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(USERNAME_RULES.maxLength)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_RULES.maxLength)
  displayName?: string;

  @Allow()
  acceptTerms?: unknown;
}
