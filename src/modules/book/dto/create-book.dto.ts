import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

enum Audience {
  CHILDREN = "CHILDREN",
  TEENS = "TEENS",
  ADULTS = "ADULTS",
}

enum Language {
  ENGLISH = "ENGLISH",
  SPANISH = "SPANISH",
  FRENCH = "FRENCH",
  PORTUGUESE = "PORTUGUESE",
}

export class CreateBookDto {
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(200)
  description: string;

  @IsEnum(Audience)
  audience: Audience;

  @IsEnum(Language)
  language: Language;

  @IsString()
  @IsNotEmpty()
  authorRights: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsBoolean()
  mature?: boolean;

  @IsOptional()
  createdAt: Date;

  @IsOptional()
  updatedAt: Date;

  @IsUUID()
  userId: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsArray()
  tags: string[] | null;
}
