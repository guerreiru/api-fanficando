import type { CategoryView, TagView } from './catalog.types';

export type CategorySource = {
  id: string;
  name: string;
  createdAt: Date;
};

export type TagSource = {
  id: string;
  name: string;
  slug: string;
  type: string;
};

export function toCategoryView(
  category: CategorySource,
  storiesCount: number,
): CategoryView {
  return {
    id: category.id,
    name: category.name,
    storiesCount,
    createdAt: category.createdAt,
  };
}

export function toTagView(tag: TagSource, storiesCount: number): TagView {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    type: tag.type,
    storiesCount,
  };
}
