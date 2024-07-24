import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateChapterDto {
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  chapterName: string;

  chapterImage: string;

  @IsUUID()
  bookId: string;
}
