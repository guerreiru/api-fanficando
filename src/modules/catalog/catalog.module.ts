import { Module } from '@nestjs/common';
import { CategoryService } from './application/category.service';
import { TagService } from './application/tag.service';
import { CategoryRepository } from './infrastructure/category.repository';
import { TagRepository } from './infrastructure/tag.repository';
import { CategoryController } from './presentation/category.controller';
import { TagController } from './presentation/tag.controller';

@Module({
  controllers: [CategoryController, TagController],
  providers: [CategoryService, TagService, CategoryRepository, TagRepository],
  // O módulo de histórias valida `categoryId` e resolve as tags do formulário.
  exports: [CategoryService, TagService],
})
export class CatalogModule {}
