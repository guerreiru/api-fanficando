import { IsOptional, IsString, MaxLength } from 'class-validator';
import { OPAQUE_TOKEN_MAX_LENGTH } from '../../domain/auth.constants';

export class TokenBodyDto {
  @IsOptional()
  @IsString()
  @MaxLength(OPAQUE_TOKEN_MAX_LENGTH)
  token?: string;
}
