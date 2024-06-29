import { AuthModule } from "./auth/auth.module";
import { BookModule } from "./book/book.module";
import { CategoryModule } from "./category/category.module";
import { ChapterModule } from "./chapter/chapter.module";
import { CharacterModule } from "./character/character.module";
import { CommentModule } from "./comment/comment.module";
import { ParagraphModule } from "./paragraph/paragraph.module";
import { ReviewModule } from "./review/review.module";
import { TagModule } from "./tag/tag.module";
import { UserModule } from "./user/user.module";

export const modules = [
  AuthModule,
  BookModule,
  CategoryModule,
  ChapterModule,
  CharacterModule,
  CommentModule,
  ParagraphModule,
  ReviewModule,
  TagModule,
  UserModule,
];
