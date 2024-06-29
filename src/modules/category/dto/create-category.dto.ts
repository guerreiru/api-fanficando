import { IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @MaxLength(20)
  name: string;
}
