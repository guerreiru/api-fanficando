import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { EMAIL_RULES, PASSWORD_RULES } from '../../domain/auth.constants';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(EMAIL_RULES.maxLength)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_RULES.maxLength)
  password: string;
}
