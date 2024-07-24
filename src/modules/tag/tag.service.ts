import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { Tag } from "./entities/tag.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  private async findTagById(id: string) {
    const tag = this.findOne(id);

    if (!tag) {
      throw new NotFoundException("Tag not found");
    }

    return tag;
  }

  async create(createTagDto: CreateTagDto) {
    const tag = this.tagRepository.create(createTagDto);
    return await this.tagRepository.save(tag);
  }

  async findAll() {
    return await this.tagRepository.findAndCount();
  }

  async findOne(id: string) {
    return await this.tagRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    await this.findTagById(id);

    return await this.tagRepository.update(id, updateTagDto);
  }

  async remove(id: string) {
    await this.findTagById(id);
    return await this.tagRepository.delete(id);
  }
}
