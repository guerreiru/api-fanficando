import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';
import { USERNAME_RULES } from '../../../auth/domain/auth.constants';

export class ChangeUsernameDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(USERNAME_RULES.maxLength)
  username: string;
}
