import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { UpdateChapterDto } from "./dto/update-chapter.dto";
import { Chapter } from "./entities/chapter.entity";
import { Book } from "../book/entities/book.entity";

@Injectable()
export class ChapterService {
  constructor(
    @InjectRepository(Chapter)
    private chapteRepository: Repository<Chapter>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>
  ) {}

  private async findChapterById(id: string) {
    const chapter = this.findOne(id);

    if (!chapter) {
      throw new NotFoundException("Chapter not found");
    }

    return chapter;
  }

  async create(createChapterDto: CreateChapterDto) {
    const { bookId, ...chapterData } = createChapterDto;

    const book = await this.bookRepository.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new Error("Book not found");
    }

    const chapter = this.chapteRepository.create({
      ...chapterData,
      book,
    });

    return await this.chapteRepository.save(chapter);
  }

  async findAll() {
    return await this.chapteRepository.findAndCount();
  }

  async findOne(id: string) {
    return await this.chapteRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateChapterDto: UpdateChapterDto) {
    await this.findChapterById(id);

    return this.chapteRepository.update(id, updateChapterDto);
  }

  async remove(id: string) {
    await this.findChapterById(id);

    return await this.chapteRepository.delete(id);
  }
}
