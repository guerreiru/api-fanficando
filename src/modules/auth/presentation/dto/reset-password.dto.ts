import { IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_RULES } from '../../domain/auth.constants';
import { TokenBodyDto } from './token-body.dto';

export class ResetPasswordDto extends TokenBodyDto {
  @IsString()
  @MinLength(PASSWORD_RULES.minLength)
  @MaxLength(PASSWORD_RULES.maxLength)
  password: string;
}
