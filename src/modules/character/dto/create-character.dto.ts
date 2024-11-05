import { IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class CreateCharacterDto {
  id?: string;
  
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  bookId: string;
}
