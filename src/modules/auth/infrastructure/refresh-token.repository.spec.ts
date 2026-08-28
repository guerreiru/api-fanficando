jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { RefreshTokenRepository } from './refresh-token.repository';

type TxClient = {
  refreshToken: {
    updateMany: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
};

function firstArgOf(mock: jest.Mock): { where: Record<string, unknown> } {
  const calls = mock.mock.calls as [{ where: Record<string, unknown> }][];
  return calls[0][0];
}

describe('RefreshTokenRepository', () => {
  const tx: TxClient = {
    refreshToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn((run: (client: TxClient) => unknown) => run(tx)),
  };

  const repository = new RefreshTokenRepository(prisma as never);

  const params = {
    currentId: 'rt-1',
    newTokenHash: 'new-hash',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 60_000),
    meta: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only rotates a token that is still live', async () => {
    tx.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(repository.rotate(params)).resolves.toBe(true);
    expect(firstArgOf(tx.refreshToken.updateMany).where).toMatchObject({
      id: 'rt-1',
      revokedAt: null,
      replacedByTokenHash: null,
    });
    expect(tx.refreshToken.create).toHaveBeenCalled();
  });

  it('does not create a second session when the token was already consumed', async () => {
    tx.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(repository.rotate(params)).resolves.toBe(false);
    expect(tx.refreshToken.create).not.toHaveBeenCalled();
  });

  it('purges only tokens that already expired', async () => {
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });
    const cutoff = new Date();

    await expect(repository.deleteExpiredBefore(cutoff)).resolves.toBe(3);
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: cutoff } },
    });
  });
});
