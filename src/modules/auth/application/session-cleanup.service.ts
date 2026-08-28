import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';

const PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * `refresh_tokens` só cresce: sem isso a tabela acumula toda sessão já emitida.
 */
@Injectable()
export class SessionCleanupService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SessionCleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
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

  async purge(): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - RETENTION_MS);
      const removed = await this.refreshTokens.deleteExpiredBefore(cutoff);

      if (removed > 0) {
        this.logger.log(`Removidos ${removed} refresh tokens expirados`);
      }

      return removed;
    } catch (error) {
      this.logger.error(
        'Falha ao limpar refresh tokens expirados',
        error instanceof Error ? error.stack : String(error),
      );
      return 0;
    }
  }
}
