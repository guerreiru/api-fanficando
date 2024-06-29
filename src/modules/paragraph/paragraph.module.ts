import { Module } from "@nestjs/common";
import { ParagraphService } from "./paragraph.service";
import { ParagraphController } from "./paragraph.controller";
import { Paragraph } from "./entities/paragraph.entity";
import { Comment } from "../comment/entities/comment.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Chapter } from "../chapter/entities/chapter.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Comment, Paragraph])],
  controllers: [ParagraphController],
  providers: [ParagraphService],
})
export class ParagraphModule {}
