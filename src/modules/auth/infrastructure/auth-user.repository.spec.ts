jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { AuthUserRepository } from './auth-user.repository';

describe('AuthUserRepository', () => {
  const prisma = {
    user: { deleteMany: jest.fn() },
  };

  const repository = new AuthUserRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUnverifiedRegistrations', () => {
    const params = {
      createdBefore: new Date('2026-08-27T00:00:00Z'),
      abandonedBefore: new Date('2026-08-21T00:00:00Z'),
      now: new Date('2026-08-28T00:00:00Z'),
    };

    async function purgeWhere(): Promise<Record<string, unknown>> {
      prisma.user.deleteMany.mockResolvedValue({ count: 2 });

      await expect(
        repository.deleteUnverifiedRegistrations(params),
      ).resolves.toBe(2);

      const calls = prisma.user.deleteMany.mock.calls as [
        { where: Record<string, unknown> },
      ][];
      return calls[0][0].where;
    }

    it('only reaches password accounts that never confirmed the email', async () => {
      expect(await purgeWhere()).toMatchObject({
        emailVerified: false,
        socialProvider: null,
        googleId: null,
      });
    });

    it('never deletes an account that already opened a session', async () => {
      expect(await purgeWhere()).toMatchObject({
        refreshTokens: { none: {} },
      });
    });

    it('spares whoever still has a live verification link', async () => {
      const where = await purgeWhere();

      expect(where.OR).toContainEqual({
        createdAt: { lt: params.createdBefore },
        emailVerificationTokens: { none: { expiresAt: { gt: params.now } } },
      });
    });

    it('drops a long-abandoned registration even with a live link', async () => {
      const where = await purgeWhere();

      expect(where.OR).toContainEqual({
        createdAt: { lt: params.abandonedBefore },
      });
    });
  });
});
