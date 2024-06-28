import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChapterController } from "./chapter.controller";
import { ChapterService } from "./chapter.service";
import { Chapter } from "./entities/chapter.entity";
import { Book } from "../book/entities/book.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Book])],
  controllers: [ChapterController],
  providers: [ChapterService],
})
export class ChapterModule {}
