import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  PASSWORD_RULES,
  USERNAME_RULES,
} from '../../../auth/domain/auth.constants';

/**
 * Conta com senha confirma pela senha; conta social, que não tem senha,
 * confirma digitando o próprio @username.
 */
export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(PASSWORD_RULES.maxLength)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(USERNAME_RULES.maxLength)
  confirmUsername?: string;
}
