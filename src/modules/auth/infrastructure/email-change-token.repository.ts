import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { emailInUse } from '../domain/auth.errors';
import { hashToken } from '../domain/token-crypto';

@Injectable()
export class EmailChangeTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteTokensForUser(userId: string) {
    return this.prisma.emailChangeToken.deleteMany({ where: { userId } });
  }

  createToken(
    userId: string,
    pendingEmail: string,
    token: string,
    expiresAt: Date,
  ) {
    return this.prisma.emailChangeToken.create({
      data: { userId, pendingEmail, tokenHash: hashToken(token), expiresAt },
    });
  }

  findByToken(token: string) {
    return this.prisma.emailChangeToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });
  }

  deleteToken(id: string) {
    return this.prisma.emailChangeToken.delete({ where: { id } });
  }

  /**
   * Aplica o novo e-mail e encerra as sessões existentes atomicamente: quem
   * ainda tiver um refresh token da conta perderia a recuperação por e-mail.
   */
  async applyEmailChange(userId: string, email: string): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            email,
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        }),
        this.prisma.emailChangeToken.deleteMany({ where: { userId } }),
        this.prisma.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw emailInUse();
      }
      throw error;
    }
  }
}
