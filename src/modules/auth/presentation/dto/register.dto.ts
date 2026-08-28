import { Transform } from 'class-transformer';
import {
  Allow,
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EMAIL_RULES,
  NAME_RULES,
  PASSWORD_RULES,
  USERNAME_RULES,
} from '../../domain/auth.constants';
import { toBooleanFlag } from '../../domain/birth-date';

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(EMAIL_RULES.maxLength)
  email: string;

  @IsString()
  @MinLength(PASSWORD_RULES.minLength)
  @MaxLength(PASSWORD_RULES.maxLength)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_RULES.maxLength)
  name?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(USERNAME_RULES.maxLength)
  username: string;

  @Transform(
    ({ obj }: { obj: Record<string, unknown> }) =>
      obj.birthDate ?? obj.birth_date,
  )
  @IsString()
  birthDate: string;

  @Allow()
  birth_date?: string;

  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    toBooleanFlag(obj.ageVerified ?? obj.age_verified),
  )
  @IsBoolean()
  @Equals(true, {
    message: 'Confirmação da data de nascimento é obrigatória.',
  })
  ageVerified: boolean;

  @Allow()
  age_verified?: unknown;

  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    toBooleanFlag(obj.termsAccepted ?? obj.terms_accepted),
  )
  @IsBoolean()
  @Equals(true, { message: 'É necessário aceitar os termos de uso.' })
  termsAccepted: boolean;

  @Allow()
  terms_accepted?: unknown;
}
