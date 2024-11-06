import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Chapter } from "../chapter/entities/chapter.entity";
import { Comment } from "../comment/entities/comment.entity";
import { CreateParagraphDto } from "./dto/create-paragraph.dto";
import { UpdateParagraphDto } from "./dto/update-paragraph.dto";
import { Paragraph } from "./entities/paragraph.entity";

@Injectable()
export class ParagraphService {
  constructor(
    @InjectRepository(Paragraph)
    private paragraphRepository: Repository<Paragraph>,
    @InjectRepository(Paragraph)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>
  ) {}

  async create(createParagraphDto: CreateParagraphDto) {
    const { chapterId, ...data } = createParagraphDto;

    const chapter = await this.chapterRepository.findOneBy({ id: chapterId });

    if (!chapter) {
      throw new NotFoundException("Chapter not found");
    }

    const paragraph = this.paragraphRepository.create({
      ...data,
      chapter,
    });

    return await this.paragraphRepository.save(paragraph);
  }

  async saveParagraphs(createParagraphDto: CreateParagraphDto[]) {
    const paragraphEntities = createParagraphDto.map((paragraph) => {
      const paragraphEntity = this.paragraphRepository.create(paragraph);
      return paragraphEntity;
    });

    return this.paragraphRepository.save(paragraphEntities);
  }

  async findAll() {
    return this.commentRepository.findAndCount();
  }

  async findOne(id: string) {
    return `This action returns a #${id} paragraph`;
  }

  async findAllByChapterId(chapterId: string) {
    return this.paragraphRepository.find({
      where: {
        chapter: { id: chapterId },
      },
    });
  }

  async findAllComments(paragraphId: string) {
    return await this.commentRepository.find({
      where: {
        targetId: paragraphId,
      },
    });
  }

  async update(id: number, updateParagraphDto: UpdateParagraphDto) {
    return `This action updates a #${id} paragraph`;
  }

  async remove(id: number) {
    return `This action removes a #${id} paragraph`;
  }
}
