jest.mock('../infrastructure/tag.repository', () => ({
  TagRepository: class TagRepository {},
}));

import { CATALOG_ERROR } from '../domain/catalog.errors';
import { TagService } from './tag.service';

describe('TagService', () => {
  const tags = {
    search: jest.fn(),
    findBySlug: jest.fn(),
    findBySlugs: jest.fn(),
    createMissing: jest.fn(),
    storyCounts: jest.fn(),
  };

  const service = new TagService(tags as never);

  const tag = (slug: string, overrides: Partial<{ id: string }> = {}) => ({
    id: `id-${slug}`,
    name: slug,
    slug,
    type: 'trope',
    ...overrides,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    tags.storyCounts.mockResolvedValue(new Map());
  });

  it('searches with the parsed parameters', async () => {
    tags.search.mockResolvedValue([tag('fluff')]);
    tags.storyCounts.mockResolvedValue(new Map([['id-fluff', 7]]));

    await expect(
      service.search({ search: 'flu', limit: '5' }),
    ).resolves.toEqual([
      expect.objectContaining({ slug: 'fluff', storiesCount: 7 }),
    ]);
    expect(tags.search).toHaveBeenCalledWith({
      search: 'flu',
      type: undefined,
      limit: 5,
    });
  });

  it('skips the count query when nothing matched', async () => {
    tags.search.mockResolvedValue([]);

    await expect(service.search({})).resolves.toEqual([]);
    expect(tags.storyCounts).not.toHaveBeenCalled();
  });

  it('normalizes the path parameter before the lookup', async () => {
    tags.findBySlug.mockResolvedValue(tag('acao-e-aventura'));

    await expect(service.getBySlug('Ação e Aventura')).resolves.toEqual(
      expect.objectContaining({ slug: 'acao-e-aventura', storiesCount: 0 }),
    );
    expect(tags.findBySlug).toHaveBeenCalledWith('acao-e-aventura');
  });

  it('fails on an unknown slug', async () => {
    tags.findBySlug.mockResolvedValue(null);

    await expect(service.getBySlug('ghost')).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.TAG_NOT_FOUND },
    });
  });

  it('answers not found for a slug that could never exist', async () => {
    await expect(service.getBySlug('!')).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.TAG_NOT_FOUND },
    });
    expect(tags.findBySlug).not.toHaveBeenCalled();
  });

  it('reuses existing tags without writing', async () => {
    tags.findBySlugs.mockResolvedValue([tag('fluff')]);

    await expect(service.resolveOrCreate(['Fluff'])).resolves.toEqual([
      expect.objectContaining({ slug: 'fluff' }),
    ]);
    expect(tags.createMissing).not.toHaveBeenCalled();
  });

  it('creates only the missing tags and answers in the requested order', async () => {
    tags.findBySlugs
      .mockResolvedValueOnce([tag('fluff')])
      .mockResolvedValueOnce([tag('fluff'), tag('slow-burn')]);

    await expect(
      service.resolveOrCreate(['Slow Burn', 'Fluff'], 'trope'),
    ).resolves.toEqual([
      expect.objectContaining({ slug: 'slow-burn' }),
      expect.objectContaining({ slug: 'fluff' }),
    ]);
    expect(tags.createMissing).toHaveBeenCalledWith(
      [{ name: 'Slow Burn', slug: 'slow-burn' }],
      'trope',
    );
  });

  it('does not reclassify a tag that already exists', async () => {
    tags.findBySlugs.mockResolvedValue([tag('fluff')]);

    await expect(service.resolveOrCreate(['Fluff'], 'fandom')).resolves.toEqual(
      [expect.objectContaining({ type: 'trope' })],
    );
    expect(tags.createMissing).not.toHaveBeenCalled();
  });

  it('validates the payload before any query', async () => {
    await expect(service.resolveOrCreate(['!!!'])).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.INVALID_TAG_NAME },
    });
    await expect(
      service.resolveOrCreate(['Fluff'], 'tipo inválido'),
    ).rejects.toMatchObject({
      response: { code: CATALOG_ERROR.INVALID_TAG_TYPE },
    });
    expect(tags.findBySlugs).not.toHaveBeenCalled();
  });
});
