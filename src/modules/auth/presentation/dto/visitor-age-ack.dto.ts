import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class VisitorAgeAckDto {
  @Type(() => Number)
  @IsNumber()
  requiredAge: number;
}
