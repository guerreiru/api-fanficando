jest.mock('../infrastructure/category.repository', () => ({
  CategoryRepository: class CategoryRepository {},
}));

import { CATALOG_ERROR } from '../domain/catalog.errors';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  const categories = {
    listAll: jest.fn(),
    storyCountsByCategory: jest.fn(),
    storyCount: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    rename: jest.fn(),
    remove: jest.fn(),
  };

  const service = new CategoryService(categories as never);

  const category = (overrides: Partial<{ id: string; name: string }> = {}) => ({
    id: 'cat-1',
    name: 'Anime',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('lists categories with their visible story counts', async () => {
    categories.listAll.mockResolvedValue([
      category(),
      category({ id: 'cat-2', name: 'Livros' }),
    ]);
    categories.storyCountsByCategory.mockResolvedValue(
      new Map([['cat-1', 12]]),
    );

    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({ id: 'cat-1', storiesCount: 12 }),
      expect.objectContaining({ id: 'cat-2', storiesCount: 0 }),
    ]);
  });

  it('creates a normalized category', async () => {
    categories.findByName.mockResolvedValue(null);
    categories.create.mockResolvedValue(category());

    await expect(service.create('  Anime ')).resolves.toEqual(
      expect.objectContaining({ name: 'Anime', storiesCount: 0 }),
    );
    expect(categories.create).toHaveBeenCalledWith('Anime');
  });

  it('refuses a name that already exists in another case', async () => {
    categories.findByName.mockResolvedValue(category());

    await expect(service.create('anime')).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.CATEGORY_NAME_TAKEN },
    });
    expect(categories.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid name before touching the database', async () => {
    await expect(service.create('a')).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.INVALID_CATEGORY_NAME },
    });
    expect(categories.findByName).not.toHaveBeenCalled();
  });

  it('renames a category ignoring its own name in the uniqueness check', async () => {
    categories.findById.mockResolvedValue(category());
    categories.findByName.mockResolvedValue(null);
    categories.rename.mockResolvedValue(category({ name: 'Animes' }));
    categories.storyCount.mockResolvedValue(3);

    await expect(service.rename('cat-1', 'Animes')).resolves.toEqual(
      expect.objectContaining({ name: 'Animes', storiesCount: 3 }),
    );
    expect(categories.findByName).toHaveBeenCalledWith('Animes', 'cat-1');
  });

  it('fails to rename a category that does not exist', async () => {
    categories.findById.mockResolvedValue(null);

    await expect(service.rename('ghost', 'Animes')).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.CATEGORY_NOT_FOUND },
    });
    expect(categories.rename).not.toHaveBeenCalled();
  });

  it('reports how many stories were left uncategorized', async () => {
    categories.findById.mockResolvedValue(category());
    categories.storyCount.mockResolvedValue(4);

    await expect(service.remove('cat-1')).resolves.toEqual({
      success: true,
      storiesUncategorized: 4,
    });
    // A contagem tem de vir antes do delete, senão já vem zerada.
    expect(categories.storyCount.mock.invocationCallOrder[0]).toBeLessThan(
      categories.remove.mock.invocationCallOrder[0],
    );
  });

  it('requires an existing category for the stories module', async () => {
    categories.findById.mockResolvedValue(null);

    await expect(service.requireCategory('ghost')).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.CATEGORY_NOT_FOUND },
    });
  });
});
