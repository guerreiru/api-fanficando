import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Book } from "../book/entities/book.entity";
import { User } from "../user/entities/user.entity";
import { Review } from "./entities/review.entity";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";

@Module({
  imports: [TypeOrmModule.forFeature([Book, User, Review])],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
