import { IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class CreateCategoryDto {
  id?: string;

  @IsNotEmpty()
  @MaxLength(20)
  name: string;
}
