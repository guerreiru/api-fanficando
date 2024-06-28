import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookController } from "./book.controller";
import { BookService } from "./book.service";
import { Book } from "./entities/book.entity";
import { User } from "../user/entities/user.entity";
import { Category } from "../category/entities/category.entity";
import { Tag } from "../tag/entities/tag.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Book, User, Category, Tag])],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}
