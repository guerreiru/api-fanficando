import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserBookDto } from "./dto/create-user-book.dto";
import { UpdateUserBookDto } from "./dto/update-user-book.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserBook } from "./entities/user-book.entity";
import { Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { Book } from "../book/entities/book.entity";

@Injectable()
export class UserBookService {
  constructor(
    @InjectRepository(UserBook)
    private userBookRepository: Repository<UserBook>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>
  ) {}

  async create(createUserBookDto: CreateUserBookDto): Promise<UserBook> {
    const { userId, bookId, ...userBookData } = createUserBookDto;

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    const book = await this.bookRepository.findOneBy({ id: bookId });
    if (!book) {
      throw new NotFoundException("Livro não encontrado");
    }

    const userBook = this.userBookRepository.create({
      ...userBookData,
      userId,
      user,
      bookId,
      book,
    });

    return await this.userBookRepository.save(userBook);
  }

  async findAll(): Promise<[UserBook[], number]> {
    return await this.userBookRepository.findAndCount({
      relations: {
        user: true,
        book: true,
      },
    });
  }

  async findOne(id: string): Promise<UserBook> {
    const userBook = await this.userBookRepository.findOne({
      where: { id },
      relations: {
        user: true,
        book: true,
      },
    });
    if (!userBook) {
      throw new NotFoundException(`UserBook com ID ${id} não encontrado`);
    }
    return userBook;
  }

  async update(
    id: string,
    updateUserBookDto: UpdateUserBookDto
  ): Promise<UserBook> {
    await this.findUserBookById(id);
    await this.userBookRepository.update(id, updateUserBookDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findUserBookById(id);
    await this.userBookRepository.delete(id);
  }

  async findByUserId(userId: string): Promise<UserBook[]> {
    return await this.userBookRepository.find({
      where: { userId },
      relations: {
        book: true,
      },
    });
  }

  async findByBookId(bookId: string): Promise<UserBook[]> {
    return await this.userBookRepository.find({
      where: { bookId },
      relations: {
        book: true,
      },
    });
  }

  async updateReadingProgress(id: string, progress: number): Promise<UserBook> {
    const userBook = await this.findOne(id);
    userBook.progress = progress;
    return await this.userBookRepository.save(userBook);
  }

  private async findUserBookById(id: string): Promise<UserBook> {
    const userBook = await this.findOne(id);
    if (!userBook) {
      throw new NotFoundException(`UserBook com ID ${id} não encontrado`);
    }
    return userBook;
  }
}
