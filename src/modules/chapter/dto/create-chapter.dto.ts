import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateChapterDto {
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  chapterName: string;

  @IsString()
  @IsNotEmpty()
  chapterContent: string;

  @IsString()
  chapterImage: string;

  @IsUUID()
  bookId: string;
}
