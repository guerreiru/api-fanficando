import { Injectable } from '@nestjs/common';
import { tagNotFound } from '../domain/catalog.errors';
import { toTagView, type TagSource } from '../domain/catalog.mapper';
import type { TagSearchQuery, TagView } from '../domain/catalog.types';
import {
  normalizeTagType,
  parseTagInputs,
  slugOrNull,
} from '../domain/tag-name';
import { parseTagSearch } from '../domain/tag-search';
import { TagRepository } from '../infrastructure/tag.repository';

@Injectable()
export class TagService {
  constructor(private readonly tags: TagRepository) {}

  async search(query: TagSearchQuery): Promise<TagView[]> {
    const found = await this.tags.search(parseTagSearch(query));
    return this.withCounts(found);
  }

  /** Tolera o nome exibido no lugar do slug: "Ação e Aventura" também resolve. */
  async getBySlug(rawSlug: unknown): Promise<TagView> {
    const slug = slugOrNull(rawSlug);
    const tag = slug ? await this.tags.findBySlug(slug) : null;
    if (!tag) {
      throw tagNotFound();
    }

    const [view] = await this.withCounts([tag]);
    return view;
  }

  /**
   * Ponto de entrada do formulário de história: recebe os nomes digitados e
   * devolve as tags já existentes, criando só as que faltam. O `type` vale
   * apenas para as novas — tag consolidada não é reclassificada por quem a
   * reutiliza.
   */
  async resolveOrCreate(
    rawNames: unknown,
    rawType?: unknown,
  ): Promise<TagView[]> {
    const inputs = parseTagInputs(rawNames);
    const type = normalizeTagType(rawType);
    const slugs = inputs.map((tag) => tag.slug);

    const existing = await this.tags.findBySlugs(slugs);
    const known = new Set(existing.map((tag) => tag.slug));
    const missing = inputs.filter((tag) => !known.has(tag.slug));

    if (missing.length === 0) {
      return this.withCounts(this.inInputOrder(existing, slugs));
    }

    await this.tags.createMissing(missing, type);

    return this.withCounts(
      this.inInputOrder(await this.tags.findBySlugs(slugs), slugs),
    );
  }

  private inInputOrder(tags: TagSource[], slugs: string[]): TagSource[] {
    const bySlug = new Map(tags.map((tag) => [tag.slug, tag]));
    return slugs
      .map((slug) => bySlug.get(slug))
      .filter((tag): tag is TagSource => Boolean(tag));
  }

  private async withCounts(tags: TagSource[]): Promise<TagView[]> {
    if (tags.length === 0) {
      return [];
    }

    const counts = await this.tags.storyCounts(tags.map((tag) => tag.id));
    return tags.map((tag) => toTagView(tag, counts.get(tag.id) ?? 0));
  }
}
