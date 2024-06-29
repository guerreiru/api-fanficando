import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { Review } from "./entities/review.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Book } from "../book/entities/book.entity";
import { User } from "../user/entities/user.entity";

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const { userId, bookId, rating, comment } = createReviewDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const book = await this.bookRepository.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException("Book not found");
    }

    const review = this.reviewRepository.create({
      rating,
      comment,
      user,
      book,
    });

    return await this.reviewRepository.save(review);
  }

  async getAverageRating(bookId: string): Promise<number> {
    const { avg } = await this.reviewRepository
      .createQueryBuilder("review")
      .select("AVG(review.rating)", "avg")
      .where("review.book_id = :bookId", { bookId })
      .getRawOne();

    return parseFloat(parseFloat(avg).toFixed(2));
  }

  async findAll() {
    return `This action returns all review`;
  }

  async findOne(id: string) {
    return `This action returns a #${id} review`;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  async remove(id: string) {
    return `This action removes a #${id} review`;
  }
}
