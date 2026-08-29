import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { toBooleanFlag } from '../../../auth/domain/birth-date';
import { AVATAR_RULES, TOUR_RULES } from '../../domain/user.constants';

/**
 * Campo ausente não é alterado; `null` (ou string vazia) limpa o valor. Os
 * limites de tamanho e o host do avatar ficam no domínio, que responde com
 * código de erro próprio.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(AVATAR_RULES.maxLength)
  avatarUrl?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === null ? value : toBooleanFlag(value),
  )
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(TOUR_RULES.maxVersion)
  tourVersion?: number;
}
