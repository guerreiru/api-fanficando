import { Transform } from 'class-transformer';
import {
  Allow,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EMAIL_RULES,
  PASSWORD_RULES,
} from '../../../auth/domain/auth.constants';

export class ChangeEmailDto {
  @Transform(
    ({ obj }: { obj: Record<string, unknown> }) => obj.newEmail ?? obj.email,
  )
  @IsEmail()
  @MaxLength(EMAIL_RULES.maxLength)
  newEmail: string;

  @Allow()
  email?: string;

  @Transform(
    ({ obj }: { obj: Record<string, unknown> }) =>
      obj.currentPassword ?? obj.password,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_RULES.maxLength)
  currentPassword: string;

  @Allow()
  password?: string;
}
