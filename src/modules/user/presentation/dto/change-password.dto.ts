import { Transform } from 'class-transformer';
import { Allow, IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_RULES } from '../../../auth/domain/auth.constants';

export class ChangePasswordDto {
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

  @Transform(
    ({ obj }: { obj: Record<string, unknown> }) =>
      obj.newPassword ?? obj.new_password,
  )
  @IsString()
  @MaxLength(PASSWORD_RULES.maxLength)
  newPassword: string;

  @Allow()
  new_password?: string;
}
