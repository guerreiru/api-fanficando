import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../domain/token-crypto';

@Injectable()
export class PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteTokensForUser(userId: string) {
    return this.prisma.passwordResetToken.deleteMany({ where: { userId } });
  }

  createToken(userId: string, token: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
  }

  findByToken(token: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
  }

  deleteToken(id: string) {
    return this.prisma.passwordResetToken.delete({ where: { id } });
  }

  /**
   * Troca a senha, encerra as sessões e consome o token de uma vez: uma falha
   * parcial deixaria sessões antigas válidas com a senha já trocada.
   */
  async applyPasswordReset(params: {
    userId: string;
    tokenId: string;
    passwordHash: string;
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: params.userId },
        data: { password: params.passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: params.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { id: params.tokenId },
      }),
    ]);
  }
}
