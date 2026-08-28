import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_VERIFICATION_TTL_MS } from '../domain/auth.constants';
import { AuthUserRepository } from '../infrastructure/auth-user.repository';
import { EmailVerificationTokenRepository } from '../infrastructure/email-verification-token.repository';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';

const PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;
const REFRESH_TOKEN_RETENTION_MS = 24 * 60 * 60 * 1000;
const UNVERIFIED_MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export type PurgeSummary = {
  refreshTokens: number;
  unverifiedRegistrations: number;
  emailVerificationTokens: number;
};

/**
 * Varre o que só cresce: `refresh_tokens` acumula toda sessão já emitida,
 * `email_verification_tokens` todo pedido de confirmação, e `users` toda
 * tentativa de cadastro abandonada — inclusive a de quem cadastrou o e-mail
 * de outra pessoa só para bloquear a conta dela.
 */
@Injectable()
export class AuthCleanupService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(AuthCleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly users: AuthUserRepository,
    private readonly emailVerificationTokens: EmailVerificationTokenRepository,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (this.config.get<string>('NODE_ENV') === 'test') {
      return;
    }

    void this.purge();
    this.timer = setInterval(() => void this.purge(), PURGE_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async purge(): Promise<PurgeSummary> {
    const now = new Date();

    return {
      refreshTokens: await this.sweep('refresh tokens expirados', () =>
        this.refreshTokens.deleteExpiredBefore(
          new Date(now.getTime() - REFRESH_TOKEN_RETENTION_MS),
        ),
      ),
      unverifiedRegistrations: await this.sweep(
        'cadastros nunca confirmados',
        () =>
          this.users.deleteUnverifiedRegistrations({
            createdBefore: new Date(now.getTime() - EMAIL_VERIFICATION_TTL_MS),
            abandonedBefore: new Date(
              now.getTime() - UNVERIFIED_MAX_LIFETIME_MS,
            ),
            now,
          }),
      ),
      emailVerificationTokens: await this.sweep(
        'tokens de verificação expirados',
        () => this.emailVerificationTokens.deleteExpiredBefore(now),
      ),
    };
  }

  /** Cada varredura é independente: falha em uma não cancela as outras. */
  private async sweep(
    label: string,
    run: () => Promise<number>,
  ): Promise<number> {
    try {
      const removed = await run();

      if (removed > 0) {
        this.logger.log(`Removidos ${removed} ${label}`);
      }

      return removed;
    } catch (error) {
      this.logger.error(
        `Falha ao limpar ${label}`,
        error instanceof Error ? error.stack : String(error),
      );
      return 0;
    }
  }
}
