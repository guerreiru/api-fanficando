import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { usernameTaken } from '../../auth/domain/auth.errors';
import { normalizeUsername } from '../../auth/domain/username';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  OwnProfileSource,
  PublicProfileSource,
} from '../domain/user.mapper';
import type { ProfileStats, ProfileUpdatePatch } from '../domain/user.types';

const OWN_PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  username: true,
  usernameChangedAt: true,
  birthDate: true,
  bio: true,
  avatarUrl: true,
  emailVerified: true,
  termsAccepted: true,
  ageVerified: true,
  emailNotifications: true,
  tourVersion: true,
  authorVerified: true,
  authorFounder: true,
  founderRequestStatus: true,
  socialProvider: true,
  isAdmin: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const PUBLIC_PROFILE_SELECT = {
  id: true,
  username: true,
  name: true,
  bio: true,
  avatarUrl: true,
  authorVerified: true,
  authorFounder: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/** Rascunho na lixeira e história oculta por moderação não contam no perfil. */
const VISIBLE_STORY_WHERE = {
  deletedAt: null,
  hiddenAt: null,
} satisfies Prisma.FanficWhereInput;

@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwnProfile(userId: string): Promise<OwnProfileSource | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: OWN_PROFILE_SELECT,
    });
  }

  /**
   * Conta suspensa ou com e-mail nunca confirmado não tem perfil público:
   * responder 404 evita usar o endpoint para enumerar cadastros.
   */
  findPublicProfileByUsername(
    username: string,
  ): Promise<PublicProfileSource | null> {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      return Promise.resolve(null);
    }

    return this.prisma.user.findFirst({
      where: {
        username: { equals: normalized, mode: 'insensitive' },
        suspendedAt: null,
        emailVerified: true,
      },
      select: PUBLIC_PROFILE_SELECT,
    });
  }

  /**
   * `author_followers` guarda os dois lados na mesma tabela, então a contagem
   * depende da coluna: `authorId` são os seguidores deste autor e `followerId`
   * são as contas que ele segue.
   */
  async statsFor(userId: string): Promise<ProfileStats> {
    const [stories, followers, following] = await Promise.all([
      this.prisma.fanfic.count({
        where: { authorId: userId, ...VISIBLE_STORY_WHERE },
      }),
      this.prisma.authorFollower.count({ where: { authorId: userId } }),
      this.prisma.authorFollower.count({ where: { followerId: userId } }),
    ]);

    return { stories, followers, following };
  }

  updateProfile(
    userId: string,
    patch: ProfileUpdatePatch,
  ): Promise<OwnProfileSource> {
    return this.prisma.user.update({
      where: { id: userId },
      data: patch,
      select: OWN_PROFILE_SELECT,
    });
  }

  async updateUsername(
    userId: string,
    username: string,
  ): Promise<OwnProfileSource> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { username, usernameChangedAt: new Date() },
        select: OWN_PROFILE_SELECT,
      });
    } catch (error) {
      // Corrida entre a checagem de disponibilidade e o UPDATE.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw usernameTaken();
      }
      throw error;
    }
  }

  /**
   * Trocar a senha e encerrar as sessões precisa ser atômico: se o revoke
   * falhasse, as sessões antigas seguiriam válidas com a senha nova.
   */
  async changePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
