import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JWT_TOKEN_MAX_LENGTH } from '../../domain/auth.constants';

export class GoogleTokenDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(JWT_TOKEN_MAX_LENGTH)
  idToken?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(JWT_TOKEN_MAX_LENGTH)
  credential?: string;
}
