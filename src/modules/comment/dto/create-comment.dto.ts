import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";

enum TargetType {
  CHAPTER = "chapter",
  PARAGRAPH = "paragraph",
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(TargetType)
  @IsNotEmpty()
  targetType: TargetType;

  @IsUUID()
  @IsNotEmpty()
  targetId: string;
}
