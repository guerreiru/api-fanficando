import { Injectable } from '@nestjs/common';
import { categoryNameTaken, categoryNotFound } from '../domain/catalog.errors';
import { toCategoryView, type CategorySource } from '../domain/catalog.mapper';
import type { CategoryView } from '../domain/catalog.types';
import { normalizeCategoryName } from '../domain/category-name';
import { CategoryRepository } from '../infrastructure/category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async list(): Promise<CategoryView[]> {
    const [categories, counts] = await Promise.all([
      this.categories.listAll(),
      this.categories.storyCountsByCategory(),
    ]);

    return categories.map((category) =>
      toCategoryView(category, counts.get(category.id) ?? 0),
    );
  }

  async create(rawName: unknown): Promise<CategoryView> {
    const name = normalizeCategoryName(rawName);

    if (await this.categories.findByName(name)) {
      throw categoryNameTaken();
    }

    return toCategoryView(await this.categories.create(name), 0);
  }

  async rename(id: string, rawName: unknown): Promise<CategoryView> {
    const name = normalizeCategoryName(rawName);

    const existing = await this.categories.findById(id);
    if (!existing) {
      throw categoryNotFound();
    }

    if (await this.categories.findByName(name, id)) {
      throw categoryNameTaken();
    }

    const renamed = await this.categories.rename(id, name);

    return toCategoryView(renamed, await this.categories.storyCount(id));
  }

  async remove(
    id: string,
  ): Promise<{ success: true; storiesUncategorized: number }> {
    const existing = await this.categories.findById(id);
    if (!existing) {
      throw categoryNotFound();
    }

    // Contado antes do DELETE: depois o vínculo das histórias já virou NULL.
    const storiesUncategorized = await this.categories.storyCount(id);
    await this.categories.remove(id);

    return { success: true as const, storiesUncategorized };
  }

  /** Usado pelo módulo de histórias antes de gravar `categoryId`. */
  async requireCategory(id: string): Promise<CategorySource> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw categoryNotFound();
    }

    return category;
  }
}
