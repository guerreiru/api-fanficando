import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateParagraphDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  chapterId: string;
}
