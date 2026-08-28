import { Injectable, Logger } from '@nestjs/common';
import {
  EMAIL_RULES,
  GOOGLE_PROVIDER,
  PROFILE_COMPLETION_PATH,
  UNUSABLE_PASSWORD,
} from '../domain/auth.constants';
import {
  AUTH_ERROR,
  AuthException,
  accountSuspended,
  emailNotVerified,
  googleSignInRejected,
  invalidCredentials,
  invalidRefresh,
  unauthenticated,
  usernameTaken,
} from '../domain/auth.errors';
import { parseCompleteProfileInput } from '../domain/complete-profile-input';
import { toBirthDateUtc } from '../domain/birth-date';
import {
  profileCompletionRequired,
  userNeedsProfileCompletion,
} from '../domain/profile-completion';
import type {
  AuthFlowResult,
  AuthUserView,
  IssuedSession,
  MeResult,
  RegisterResult,
  RequestMeta,
} from '../domain/auth.types';
import { toAuthUserView } from '../domain/auth.mapper';
import { requirePasswordRegistrationCompliance } from '../domain/register-compliance';
import {
  allocateUniqueUsername,
  assertValidUsernameFormat,
  slugFromDisplayName,
} from '../domain/username';
import { suggestEmailDomainCorrection } from '../domain/email-domain';
import { isPasswordAccount } from '../domain/password-account';
import { AuthUserRepository } from '../infrastructure/auth-user.repository';
import { GoogleIdTokenService } from '../infrastructure/google-id-token.service';
import { ProfileCompletionTokenService } from '../infrastructure/profile-completion-token.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { EmailVerificationService } from './email-verification.service';

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  username?: unknown;
  termsAccepted: unknown;
  ageVerified: unknown;
  birthDate: unknown;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type CompleteProfileInput = {
  birthDate?: unknown;
  birth_date?: unknown;
  ageVerified?: unknown;
  age_verified?: unknown;
  username?: unknown;
  displayName?: unknown;
  acceptTerms?: unknown;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: AuthUserRepository,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly googleTokens: GoogleIdTokenService,
    private readonly profileCompletionTokens: ProfileCompletionTokenService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  async register(input: RegisterInput): Promise<RegisterResult> {
    const compliance = requirePasswordRegistrationCompliance(input);
    const username = assertValidUsernameFormat(input.username);
    const email = this.normalizeEmail(input.email);
    const name = this.normalizeName(input.name);
    const now = new Date();

    if (await this.users.isUsernameTaken(username)) {
      throw usernameTaken(await this.suggestUsername(username));
    }

    const passwordHash = await this.passwords.hash(input.password);

    let user: AuthUserView;
    try {
      user = await this.users.create({
        email,
        password: passwordHash,
        name,
        username,
        termsAccepted: compliance.termsAccepted,
        termsAcceptedAt: now,
        birthDate: compliance.birthDate,
        ageVerified: compliance.ageVerified,
        ageVerifiedAt: now,
      });
    } catch (error) {
      if (this.isUsernameTakenError(error)) {
        throw usernameTaken(await this.suggestUsername(username));
      }
      throw error;
    }

    void this.emailVerification
      .issueAndSend(user.id, user.email)
      .catch((error: unknown) => {
        this.logger.error(
          'Falha ao enviar e-mail de verificação',
          error instanceof Error ? error.stack : String(error),
        );
      });

    const suggestion = suggestEmailDomainCorrection(email);
    return {
      user: toAuthUserView(user),
      requiresEmailVerification: true,
      ...(suggestion ? { suggestion } : {}),
    };
  }

  async login(input: LoginInput, meta: RequestMeta): Promise<AuthFlowResult> {
    const email = this.normalizeEmail(input.email);
    const user = await this.users.findByEmail(email);
    const passwordMatches = await this.passwords.verify(
      input.password,
      user?.password,
    );

    // Conta social não autentica por senha: responde igual a credencial errada
    // para não revelar por que o login falhou.
    if (!user || !passwordMatches || !isPasswordAccount(user)) {
      throw invalidCredentials();
    }

    if (user.suspendedAt) {
      throw accountSuspended();
    }

    if (!user.emailVerified) {
      throw emailNotVerified();
    }

    if (userNeedsProfileCompletion(user)) {
      return profileCompletionRequired(
        toAuthUserView(user),
        await this.profileCompletionTokens.issue(
          user.id,
          user.socialProvider || 'password',
        ),
      );
    }

    return this.issueReadySession(user, meta);
  }

  async googleTokenLogin(
    idToken: string | undefined,
    meta: RequestMeta,
  ): Promise<AuthFlowResult> {
    const identity = await this.googleTokens.verify(String(idToken || ''));
    const email = this.normalizeEmail(identity.email);

    let authUser = await this.users.findSocialAccount(
      GOOGLE_PROVIDER,
      identity.providerUserId,
    );

    if (!authUser) {
      const existingByEmail = await this.users.findByEmail(email);

      if (existingByEmail) {
        // Nunca vincula automaticamente o Google a uma conta existente.
        if (existingByEmail.googleId !== identity.providerUserId) {
          throw googleSignInRejected();
        }
        authUser = existingByEmail;
      }
    }

    let userId: string;

    if (!authUser) {
      const created = await this.users.create({
        email,
        password: UNUSABLE_PASSWORD,
        name: identity.name ?? undefined,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        socialProvider: GOOGLE_PROVIDER,
        socialProviderId: identity.providerUserId,
        googleId: identity.providerUserId,
      });
      userId = created.id;
    } else {
      const needsSync =
        !authUser.socialProviderId ||
        authUser.socialProvider !== GOOGLE_PROVIDER ||
        !authUser.emailVerified;

      if (needsSync) {
        authUser = await this.users.syncGoogleAccountFields(authUser.id, {
          emailVerifiedAt: authUser.emailVerifiedAt,
          socialProvider: GOOGLE_PROVIDER,
          socialProviderId:
            authUser.socialProviderId || identity.providerUserId,
          googleId: authUser.googleId || identity.providerUserId,
        });
      }
      userId = authUser.id;
    }

    const linked = await this.users.upsertSocialAccount(
      userId,
      GOOGLE_PROVIDER,
      identity.providerUserId,
    );

    if (!linked) {
      throw googleSignInRejected();
    }

    const user = await this.users.findAuthById(userId);
    if (!user) {
      throw unauthenticated();
    }

    if (user.suspendedAt) {
      throw accountSuspended();
    }

    if (userNeedsProfileCompletion(user)) {
      return profileCompletionRequired(
        toAuthUserView(user),
        await this.profileCompletionTokens.issue(user.id, GOOGLE_PROVIDER),
        {
          provider: GOOGLE_PROVIDER,
          email,
          name: identity.name,
          avatar: identity.avatar,
        },
      );
    }

    return this.issueReadySession(user, meta);
  }

  async completeProfile(
    body: CompleteProfileInput,
    meta: RequestMeta,
    authenticatedUserId?: string,
    completionTokenFromCookie?: string,
  ): Promise<IssuedSession> {
    const parsed = parseCompleteProfileInput(
      body,
      authenticatedUserId,
      completionTokenFromCookie,
    );

    const userId =
      parsed.mode === 'token'
        ? (await this.profileCompletionTokens.verify(parsed.completionToken))
            .userId
        : parsed.userId;

    const existing = await this.users.findById(userId);
    if (!existing) {
      throw unauthenticated();
    }

    if (await this.users.isUsernameTaken(parsed.username, userId)) {
      throw usernameTaken(
        await allocateUniqueUsername(parsed.username, (candidate) =>
          this.users.isUsernameTaken(candidate, userId),
        ),
      );
    }

    const updated = await this.users.completeProfile(userId, {
      ...(parsed.mode === 'authenticated' ? { name: parsed.displayName } : {}),
      username: parsed.username,
      birthDate: toBirthDateUtc(parsed.birthDate),
      ageVerified: true,
      termsAccepted: true,
    });

    return this.sessions.issue(updated, meta);
  }

  async refresh(
    rawRefreshToken: string | undefined,
    meta: RequestMeta,
  ): Promise<IssuedSession> {
    if (!rawRefreshToken) {
      throw invalidRefresh();
    }

    return this.sessions.rotate(rawRefreshToken, meta);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    await this.sessions.revoke(rawRefreshToken);
  }

  async me(userId: string): Promise<MeResult> {
    let user = await this.users.findById(userId);
    if (!user) {
      throw unauthenticated();
    }

    if (userNeedsProfileCompletion(user)) {
      return {
        user,
        requiresProfileCompletion: true,
        completionToken: await this.profileCompletionTokens.issue(
          user.id,
          user.socialProvider || 'session',
        ),
        completionPath: PROFILE_COMPLETION_PATH,
      };
    }

    if (!user.username) {
      user = await this.ensureUsername(user);
    }

    return {
      user,
      requiresProfileCompletion: false,
    };
  }

  private async issueReadySession(
    user: AuthUserView,
    meta: RequestMeta,
  ): Promise<IssuedSession> {
    const ready = user.username ? user : await this.ensureUsername(user);
    return this.sessions.issue(ready, meta);
  }

  private async ensureUsername(user: AuthUserView): Promise<AuthUserView> {
    const allocated = await this.suggestUsername(
      slugFromDisplayName(user.name),
      user.id,
    );
    return this.users.setUsername(user.id, allocated);
  }

  private suggestUsername(preferred: string, excludeUserId?: string) {
    return allocateUniqueUsername(preferred, (candidate) =>
      this.users.isUsernameTaken(candidate, excludeUserId),
    );
  }

  private isUsernameTakenError(error: unknown): boolean {
    return (
      error instanceof AuthException &&
      typeof error.getResponse() === 'object' &&
      error.getResponse() !== null &&
      (error.getResponse() as { code?: string }).code ===
        AUTH_ERROR.USERNAME_TAKEN
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase().slice(0, EMAIL_RULES.maxLength);
  }

  private normalizeName(name?: string | null): string | undefined {
    const trimmed = name?.trim();
    return trimmed ? trimmed : undefined;
  }
}
