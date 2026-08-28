import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * Defesa contra CSRF nos endpoints que autenticam só por cookie. CORS não
 * cobre esse caso: um <form> em outro site consegue fazer POST sem preflight,
 * e com COOKIE_SAMESITE=none o cookie viaja junto. Navegadores sempre mandam
 * `Origin` em requisição mutante, então recusar origem desconhecida basta;
 * clientes não-browser (curl, app nativo) não mandam o header e passam.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(config: ConfigService) {
    this.allowedOrigins = new Set(
      (config.get<string[]>('ALLOWED_ORIGINS') ?? [])
        .map(normalizeOrigin)
        .filter((origin): origin is string => Boolean(origin)),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const origin = this.requestOrigin(request);
    if (!origin || this.allowedOrigins.size === 0) {
      return true;
    }

    if (
      this.allowedOrigins.has(origin) ||
      origin === this.selfOrigin(request)
    ) {
      return true;
    }

    throw new ForbiddenException({
      error: 'Origem não permitida.',
      code: 'ORIGIN_NOT_ALLOWED',
    });
  }

  private requestOrigin(request: Request): string | undefined {
    const header = request.headers.origin;
    if (typeof header === 'string' && header && header !== 'null') {
      return normalizeOrigin(header);
    }

    const referer = request.headers.referer;
    return typeof referer === 'string' && referer
      ? normalizeOrigin(referer)
      : undefined;
  }

  private selfOrigin(request: Request): string | undefined {
    const host = request.headers.host;
    return host ? `${request.protocol}://${host}`.toLowerCase() : undefined;
  }
}
