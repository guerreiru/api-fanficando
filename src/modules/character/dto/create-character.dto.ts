import { IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class CreateCharacterDto {
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  bookId: string;
}
