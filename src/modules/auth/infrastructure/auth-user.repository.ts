import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { registrationRejected, usernameTaken } from '../domain/auth.errors';
import { toAuthUserView } from '../domain/auth.mapper';
import type { AuthUserView } from '../domain/auth.types';
import { normalizeUsername } from '../domain/username';
import { prismaUniqueTargetIncludes } from './prisma-unique';

const AUTH_USER_SELECT = {
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
  isAdmin: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const AUTH_USER_WITH_SECRETS_SELECT = {
  ...AUTH_USER_SELECT,
  password: true,
  suspendedAt: true,
  googleId: true,
  socialProviderId: true,
  emailVerifiedAt: true,
} satisfies Prisma.UserSelect;

export type AuthUserRecord = AuthUserView;
export type AuthUserWithSecrets = AuthUserView & {
  password: string;
  suspendedAt: Date | null;
  googleId: string | null;
  socialProviderId: string | null;
  emailVerifiedAt: Date | null;
};

type AuthUserRow = {
  id: unknown;
  email: string;
  name: string | null;
  username: string | null;
  emailVerified: boolean;
  termsAccepted: boolean;
  birthDate: Date | null;
  ageVerified: boolean;
  avatarUrl: string | null;
  socialProvider: string | null;
  isAdmin: boolean;
  createdAt: Date;
};

function requireUserId(id: unknown): string {
  if (typeof id !== 'string') {
    throw new TypeError('User id must be a UUID string');
  }
  return id;
}

function mapAuthUser(user: AuthUserRow): AuthUserView {
  return toAuthUserView({
    id: requireUserId(user.id),
    email: user.email,
    name: user.name,
    username: user.username,
    emailVerified: user.emailVerified,
    termsAccepted: user.termsAccepted,
    birthDate: user.birthDate,
    ageVerified: user.ageVerified,
    avatarUrl: user.avatarUrl,
    socialProvider: user.socialProvider,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  });
}

function mapAuthUserWithSecrets(
  user: AuthUserRow & {
    password: string;
    suspendedAt: Date | null;
    googleId: string | null;
    socialProviderId: string | null;
    emailVerifiedAt: Date | null;
  },
): AuthUserWithSecrets {
  return {
    ...mapAuthUser(user),
    password: user.password,
    suspendedAt: user.suspendedAt,
    googleId: user.googleId,
    socialProviderId: user.socialProviderId,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

@Injectable()
export class AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUserWithSecrets | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: AUTH_USER_WITH_SECRETS_SELECT,
    });
    return user ? mapAuthUserWithSecrets(user) : null;
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: AUTH_USER_SELECT,
    });
    return user ? mapAuthUser(user) : null;
  }

  async findAuthById(id: string): Promise<AuthUserWithSecrets | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: AUTH_USER_WITH_SECRETS_SELECT,
    });
    return user ? mapAuthUserWithSecrets(user) : null;
  }

  async findAuthContext(id: string): Promise<{
    id: string;
    isAdmin: boolean;
    suspendedAt: Date | null;
    emailVerified: boolean;
    socialProvider: string | null;
    googleId: string | null;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isAdmin: true,
        suspendedAt: true,
        emailVerified: true,
        socialProvider: true,
        googleId: true,
      },
    });
    if (!user) {
      return null;
    }
    return {
      id: requireUserId(user.id),
      isAdmin: user.isAdmin,
      suspendedAt: user.suspendedAt,
      emailVerified: user.emailVerified,
      socialProvider: user.socialProvider,
      googleId: user.googleId,
    };
  }

  async findSocialAccount(
    provider: string,
    providerUserId: string,
  ): Promise<AuthUserWithSecrets | null> {
    const account = await this.prisma.userSocialAccount.findUnique({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
      select: {
        user: { select: AUTH_USER_WITH_SECRETS_SELECT },
      },
    });
    return account?.user ? mapAuthUserWithSecrets(account.user) : null;
  }

  /**
   * O update nunca move `providerUserId` para outro usuário: reassociar uma
   * identidade social a outra conta seria um caminho direto de takeover.
   */
  async upsertSocialAccount(
    userId: string,
    provider: string,
    providerUserId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.userSocialAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
      select: { userId: true },
    });

    if (existing) {
      if (existing.userId !== userId) {
        return false;
      }

      await this.prisma.userSocialAccount.update({
        where: { provider_providerUserId: { provider, providerUserId } },
        data: { updatedAt: new Date() },
      });
      return true;
    }

    await this.prisma.userSocialAccount.create({
      data: { userId, provider, providerUserId },
    });
    return true;
  }

  async syncGoogleAccountFields(
    userId: string,
    data: {
      emailVerifiedAt: Date | null;
      socialProvider: string;
      socialProviderId: string;
      googleId: string;
    },
  ): Promise<AuthUserWithSecrets> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: data.emailVerifiedAt ?? new Date(),
        socialProvider: data.socialProvider,
        socialProviderId: data.socialProviderId,
        googleId: data.googleId,
      },
      select: AUTH_USER_WITH_SECRETS_SELECT,
    });
    return mapAuthUserWithSecrets(user);
  }

  async isUsernameTaken(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      return false;
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        username: { equals: normalized, mode: 'insensitive' },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    return Boolean(existing);
  }

  async setUsername(userId: string, username: string): Promise<AuthUserRecord> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username },
      select: AUTH_USER_SELECT,
    });
    return mapAuthUser(user);
  }

  async completeProfile(
    userId: string,
    data: {
      name?: string;
      username: string;
      birthDate: Date;
      ageVerified: boolean;
      termsAccepted: boolean;
    },
  ): Promise<AuthUserRecord> {
    const now = new Date();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        username: data.username,
        birthDate: data.birthDate,
        ageVerified: data.ageVerified,
        ageVerifiedAt: data.ageVerified ? now : null,
        termsAccepted: data.termsAccepted,
        termsAcceptedAt: data.termsAccepted ? now : null,
      },
      select: AUTH_USER_SELECT,
    });
    return mapAuthUser(user);
  }

  /**
   * Cadastro nunca confirmado é squatting: enquanto a linha existe, o e-mail e
   * o username ficam bloqueados para o dono real, que não tem como recuperar
   * (não tem senha, e `create` responde com o erro genérico de colisão).
   *
   * `refreshTokens: none` é a rede de segurança — conta que já abriu sessão
   * nunca é apagada por aqui.
   */
  async deleteUnverifiedRegistrations(params: {
    /** Antes disto o primeiro link já venceu (TTL do token de verificação). */
    createdBefore: Date;
    /** Teto absoluto: nem reenviar em loop segura o e-mail além disto. */
    abandonedBefore: Date;
    now: Date;
  }): Promise<number> {
    const { count } = await this.prisma.user.deleteMany({
      where: {
        emailVerified: false,
        socialProvider: null,
        googleId: null,
        refreshTokens: { none: {} },
        OR: [
          {
            createdAt: { lt: params.createdBefore },
            // Quem pediu reenvio há pouco continua com o link válido.
            emailVerificationTokens: {
              none: { expiresAt: { gt: params.now } },
            },
          },
          { createdAt: { lt: params.abandonedBefore } },
        ],
      },
    });
    return count;
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
    username?: string | null;
    termsAccepted?: boolean;
    termsAcceptedAt?: Date | null;
    birthDate?: Date | null;
    ageVerified?: boolean;
    ageVerifiedAt?: Date | null;
    emailVerified?: boolean;
    emailVerifiedAt?: Date | null;
    socialProvider?: string | null;
    socialProviderId?: string | null;
    googleId?: string | null;
  }): Promise<AuthUserRecord> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: data.password,
          name: data.name,
          username: data.username ?? null,
          termsAccepted: data.termsAccepted ?? false,
          termsAcceptedAt: data.termsAcceptedAt ?? null,
          birthDate: data.birthDate ?? null,
          ageVerified: data.ageVerified ?? false,
          ageVerifiedAt: data.ageVerifiedAt ?? null,
          emailVerified: data.emailVerified ?? false,
          emailVerifiedAt: data.emailVerifiedAt ?? null,
          socialProvider: data.socialProvider ?? null,
          socialProviderId: data.socialProviderId ?? null,
          googleId: data.googleId ?? null,
          isAdmin: false,
        },
        select: AUTH_USER_SELECT,
      });
      return mapAuthUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        if (prismaUniqueTargetIncludes(error, 'username')) {
          throw usernameTaken();
        }
        throw registrationRejected();
      }
      throw error;
    }
  }
}
