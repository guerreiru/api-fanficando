import { Module } from "@nestjs/common";
import { UserBookService } from "./user-book.service";
import { UserBookController } from "./user-book.controller";
import { UserBook } from "./entities/user-book.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/entities/user.entity";
import { Book } from "../book/entities/book.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserBook, Book, User])],
  controllers: [UserBookController],
  providers: [UserBookService],
  exports: [UserBookService, TypeOrmModule],
})
export class UserBookModule {}
