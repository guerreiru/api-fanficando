export type CategoryView = {
  id: string;
  name: string;
  /** Só histórias visíveis: rascunho na lixeira e oculta não contam. */
  storiesCount: number;
  createdAt: Date;
};

export type TagView = {
  id: string;
  name: string;
  slug: string;
  type: string;
  storiesCount: number;
};

/** Nome como o autor digitou + slug, que é a chave de deduplicação. */
export type TagInput = {
  name: string;
  slug: string;
};

export type TagSearchQuery = {
  search?: unknown;
  type?: unknown;
  limit?: unknown;
};

export type TagSearchParams = {
  search?: string;
  type?: string;
  limit: number;
};
