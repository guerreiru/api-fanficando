jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { hashToken } from '../domain/token-crypto';
import { EmailChangeTokenRepository } from './email-change-token.repository';
import { EmailVerificationTokenRepository } from './email-verification-token.repository';
import { PasswordResetTokenRepository } from './password-reset-token.repository';

const RAW_TOKEN = 'a'.repeat(64);

function createdData(mock: jest.Mock): Record<string, unknown> {
  const calls = mock.mock.calls as [{ data: Record<string, unknown> }][];
  return calls[0][0].data;
}

function firstArgOf(mock: jest.Mock): { where: Record<string, unknown> } {
  const calls = mock.mock.calls as [{ where: Record<string, unknown> }][];
  return calls[0][0];
}

function prismaDouble() {
  return {
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
    emailChangeToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
    user: { update: jest.fn() },
    refreshToken: { updateMany: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };
}

describe('email token repositories', () => {
  let prisma: ReturnType<typeof prismaDouble>;

  beforeEach(() => {
    prisma = prismaDouble();
  });

  it('never stores the raw password reset token', async () => {
    const repository = new PasswordResetTokenRepository(prisma as never);

    await repository.createToken('user-1', RAW_TOKEN, new Date());

    const data = createdData(prisma.passwordResetToken.create);
    expect(data.tokenHash).toBe(hashToken(RAW_TOKEN));
    expect(data.tokenHash).not.toBe(RAW_TOKEN);
    expect(JSON.stringify(data)).not.toContain(RAW_TOKEN);
  });

  it('looks up the password reset token by hash', async () => {
    const repository = new PasswordResetTokenRepository(prisma as never);

    await repository.findByToken(RAW_TOKEN);

    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashToken(RAW_TOKEN) },
    });
  });

  it('never stores the raw verification token', async () => {
    const repository = new EmailVerificationTokenRepository(prisma as never);

    await repository.createToken('user-1', RAW_TOKEN, new Date());

    expect(createdData(prisma.emailVerificationToken.create).tokenHash).toBe(
      hashToken(RAW_TOKEN),
    );
  });

  it('never stores the raw email change token', async () => {
    const repository = new EmailChangeTokenRepository(prisma as never);

    await repository.createToken(
      'user-1',
      'new@test.com',
      RAW_TOKEN,
      new Date(),
    );

    expect(createdData(prisma.emailChangeToken.create).tokenHash).toBe(
      hashToken(RAW_TOKEN),
    );
  });

  it('revokes the sessions in the same transaction that changes the email', async () => {
    const repository = new EmailChangeTokenRepository(prisma as never);

    await repository.applyEmailChange('user-1', 'new@test.com');

    expect(createdData(prisma.user.update)).toMatchObject({
      email: 'new@test.com',
    });
    expect(firstArgOf(prisma.refreshToken.updateMany).where).toEqual({
      userId: 'user-1',
      revokedAt: null,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('resets password, sessions and token in the same transaction', async () => {
    const repository = new PasswordResetTokenRepository(prisma as never);

    await repository.applyPasswordReset({
      userId: 'user-1',
      tokenId: 'tok-1',
      passwordHash: 'new-hash',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { password: 'new-hash' } }),
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { id: 'tok-1' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
