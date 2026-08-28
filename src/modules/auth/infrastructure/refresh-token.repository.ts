import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestMeta } from '../domain/auth.types';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            emailVerified: true,
            termsAccepted: true,
            birthDate: true,
            ageVerified: true,
            avatarUrl: true,
            socialProvider: true,
            googleId: true,
            isAdmin: true,
            createdAt: true,
            suspendedAt: true,
          },
        },
      },
    });
  }

  create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    meta: RequestMeta;
  }) {
    return this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.meta.userAgent,
        ipAddress: data.meta.ipAddress,
      },
    });
  }

  /**
   * Só rotaciona se o token ainda estiver vivo no momento do UPDATE. Sem essa
   * condição, dois refresh simultâneos criariam duas sessões válidas e a
   * detecção de reuse nunca dispararia. `false` significa que outra requisição
   * chegou primeiro — o chamador trata como reuse.
   */
  rotate(params: {
    currentId: string;
    newTokenHash: string;
    userId: string;
    expiresAt: Date;
    meta: RequestMeta;
  }): Promise<boolean> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.refreshToken.updateMany({
        where: {
          id: params.currentId,
          revokedAt: null,
          replacedByTokenHash: null,
          expiresAt: { gt: now },
        },
        data: {
          revokedAt: now,
          lastUsedAt: now,
          replacedByTokenHash: params.newTokenHash,
        },
      });

      if (claimed.count === 0) {
        return false;
      }

      await tx.refreshToken.create({
        data: {
          userId: params.userId,
          tokenHash: params.newTokenHash,
          expiresAt: params.expiresAt,
          userAgent: params.meta.userAgent,
          ipAddress: params.meta.ipAddress,
        },
      });

      return true;
    });
  }

  revokeByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });
  }

  revokeAllByUserId(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Só apaga tokens já expirados: um token revogado ainda dentro da validade
   * precisa existir para a detecção de reuse disparar.
   */
  async deleteExpiredBefore(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });
    return count;
  }
}
