import { IsNotEmpty, IsInt, Min, Max, IsUUID } from "class-validator";

export class CreateReviewDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  bookId: string;

  @IsInt()
  @Min(0)
  @Max(5)
  rating: number;

  comment?: string;
}
