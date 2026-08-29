import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TagSource } from '../domain/catalog.mapper';
import type { TagInput, TagSearchParams } from '../domain/catalog.types';

const TAG_SELECT = {
  id: true,
  name: true,
  slug: true,
  type: true,
} satisfies Prisma.TagSelect;

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Casa nome e slug: quem digita "enemies-to" acha "Enemies to Lovers". */
  search(params: TagSearchParams): Promise<TagSource[]> {
    return this.prisma.tag.findMany({
      where: {
        ...(params.type ? { type: params.type } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: TAG_SELECT,
      orderBy: { name: 'asc' },
      take: params.limit,
    });
  }

  findBySlug(slug: string): Promise<TagSource | null> {
    return this.prisma.tag.findUnique({
      where: { slug },
      select: TAG_SELECT,
    });
  }

  findBySlugs(slugs: string[]): Promise<TagSource[]> {
    if (slugs.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.tag.findMany({
      where: { slug: { in: slugs } },
      select: TAG_SELECT,
    });
  }

  /**
   * `skipDuplicates` cobre a corrida de dois autores criando a mesma tag no
   * mesmo instante — o slug único decide, sem erro para nenhum dos dois.
   */
  async createMissing(tags: TagInput[], type: string): Promise<void> {
    if (tags.length === 0) {
      return;
    }

    await this.prisma.tag.createMany({
      data: tags.map((tag) => ({ name: tag.name, slug: tag.slug, type })),
      skipDuplicates: true,
    });
  }

  async storyCounts(tagIds: string[]): Promise<Map<string, number>> {
    if (tagIds.length === 0) {
      return new Map();
    }

    const grouped = await this.prisma.storyTag.groupBy({
      by: ['tagId'],
      where: {
        tagId: { in: tagIds },
        story: { deletedAt: null, hiddenAt: null },
      },
      _count: { _all: true },
    });

    return new Map(grouped.map((row) => [row.tagId, row._count._all]));
  }
}
