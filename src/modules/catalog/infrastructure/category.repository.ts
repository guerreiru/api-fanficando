import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { categoryNameTaken, categoryNotFound } from '../domain/catalog.errors';
import type { CategorySource } from '../domain/catalog.mapper';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  createdAt: true,
} satisfies Prisma.CategorySelect;

/** Mesma visibilidade usada no perfil: lixeira e moderação não contam. */
const VISIBLE_STORY_WHERE = {
  deletedAt: null,
  hiddenAt: null,
} satisfies Prisma.FanficWhereInput;

function isMissingRecord(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAll(): Promise<CategorySource[]> {
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Uma agregação para todas as categorias em vez de um COUNT por linha: a
   * lista é carregada em toda navegação de descoberta.
   */
  async storyCountsByCategory(): Promise<Map<string, number>> {
    const grouped = await this.prisma.fanfic.groupBy({
      by: ['categoryId'],
      where: { categoryId: { not: null }, ...VISIBLE_STORY_WHERE },
      _count: { _all: true },
    });

    return new Map(
      grouped
        .filter((row) => row.categoryId !== null)
        .map((row) => [row.categoryId as string, row._count._all]),
    );
  }

  storyCount(categoryId: string): Promise<number> {
    return this.prisma.fanfic.count({
      where: { categoryId, ...VISIBLE_STORY_WHERE },
    });
  }

  findById(id: string): Promise<CategorySource | null> {
    return this.prisma.category.findUnique({
      where: { id },
      select: CATEGORY_SELECT,
    });
  }

  /**
   * O UNIQUE do banco é sensível à caixa, então "Anime" e "anime" conviveriam
   * como duas categorias. A checagem case-insensitive é o que evita isso.
   */
  async findByName(
    name: string,
    excludeId?: string,
  ): Promise<CategorySource | null> {
    return this.prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: CATEGORY_SELECT,
    });
  }

  async create(name: string): Promise<CategorySource> {
    try {
      return await this.prisma.category.create({
        data: { name },
        select: CATEGORY_SELECT,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw categoryNameTaken();
      }
      throw error;
    }
  }

  async rename(id: string, name: string): Promise<CategorySource> {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name },
        select: CATEGORY_SELECT,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw categoryNameTaken();
      }
      if (isMissingRecord(error)) {
        throw categoryNotFound();
      }
      throw error;
    }
  }

  /** O `ON DELETE SET NULL` deixa as histórias sem categoria, não as apaga. */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (isMissingRecord(error)) {
        throw categoryNotFound();
      }
      throw error;
    }
  }
}
