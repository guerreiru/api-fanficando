import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./entities/category.entity";
import { Repository } from "typeorm";

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  private async findCategoryById(id: string) {
    const chapter = this.findOne(id);

    if (!chapter) {
      throw new NotFoundException("Category not found");
    }

    return chapter;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const categoryWithSameName = await this.categoryRepository.findOneBy({
      name: createCategoryDto.name,
    });

    if (categoryWithSameName) {
      throw new ConflictException("Category not found");
    }

    return await this.categoryRepository.save(createCategoryDto);
  }

  findAll() {
    return this.categoryRepository.find();
  }

  findOne(id: string) {
    return this.categoryRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findCategoryById(id);

    return await this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: string) {
    await this.findCategoryById(id);

    return await this.categoryRepository.delete(id);
  }
}
