import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { Book } from "./entities/book.entity";
import { In, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "../category/entities/category.entity";
import { User } from "../user/entities/user.entity";
import { Tag } from "../tag/entities/tag.entity";

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const { userId, categoryId, tags: tagNames, ...bookData } = createBookDto;

    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    const tags = await this.getOrCreateTags(tagNames);

    const book = this.bookRepository.create({
      ...bookData,
      user,
      category,
      tags,
    });

    return await this.bookRepository.save(book);
  }

  async findAll() {
    return await this.bookRepository.findAndCount({
      relations: {
        user: true,
      },
    });
  }

  async findOne(id: string) {
    return this.bookRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    const { categoryId, tags: tagNames, ...bookData } = updateBookDto;

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    const tags = await this.getOrCreateTags(tagNames);

    const book = this.bookRepository.create({
      ...bookData,
      category,
      tags,
    });

    return await this.bookRepository.update(id, book);
  }

  async remove(id: string) {
    await this.findBookById(id);

    return await this.bookRepository.delete(id);
  }

  private async findBookById(id: string) {
    const book = this.findOne(id);

    if (!book) {
      throw new NotFoundException("Book not found");
    }

    return book;
  }

  private async getOrCreateTags(tagNames: string[]) {
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await this.tagRepository.findOne({ where: { name } });
        if (!tag) {
          tag = this.tagRepository.create({ name, usageCount: 1 });
          await this.tagRepository.save(tag);
        } else {
          tag.usageCount++;
          await this.tagRepository.save(tag);
        }
        return tag;
      })
    );

    return tags;
  }
}
