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

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error("Category not found");
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
    return await this.bookRepository.findAndCount();
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
      throw new Error("Category not found");
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

  private async getOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    if (!tagNames || tagNames.length === 0) {
      return [];
    }

    // Encontre tags existentes pelo nome
    const existingTags = await this.tagRepository.findBy({
      name: In(tagNames),
    });

    const existingTagNames = existingTags.map((tag) => tag.name);

    // Encontre nomes de tags que não existem no banco de dados
    const newTagNames = tagNames.filter(
      (name) => !existingTagNames.includes(name)
    );

    // Crie novas tags para os nomes que não existem
    const newTags = await Promise.all(
      newTagNames.map(async (name) => {
        const tag = new Tag();
        tag.name = name;
        return await this.tagRepository.save(tag);
      })
    );

    // Combine tags existentes com as novas tags criadas
    return [...existingTags, ...newTags];
  }
}
