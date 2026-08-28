import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../domain/token-crypto';

@Injectable()
export class EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteTokensForUser(userId: string) {
    return this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
  }

  createToken(userId: string, token: string, expiresAt: Date) {
    return this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
  }

  findByToken(token: string) {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          select: { id: true, emailVerified: true },
        },
      },
    });
  }

  deleteToken(id: string) {
    return this.prisma.emailVerificationToken.delete({ where: { id } });
  }

  markUserVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  async confirmVerification(userId: string, tokenId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.deleteMany({ where: { id: tokenId } }),
    ]);
  }
}
