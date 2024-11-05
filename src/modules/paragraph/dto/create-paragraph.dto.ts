import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateParagraphDto {
  id?: string;

  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  chapterId: string;
}
