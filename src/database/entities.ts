import { Book } from "src/modules/book/entities/book.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Chapter } from "src/modules/chapter/entities/chapter.entity";
import { Character } from "src/modules/character/entities/character.entity";
import { Comment } from "src/modules/comment/entities/comment.entity";
import { Paragraph } from "src/modules/paragraph/entities/paragraph.entity";
import { Review } from "src/modules/review/entities/review.entity";
import { Tag } from "src/modules/tag/entities/tag.entity";
import { UserBook } from "src/modules/user-book/entities/user-book.entity";
import { User } from "src/modules/user/entities/user.entity";

export const entities = [
  Book,
  Category,
  Comment,
  Chapter,
  Character,
  Tag,
  User,
  Review,
  Paragraph,
  UserBook,
];
