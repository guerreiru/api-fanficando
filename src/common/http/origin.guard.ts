import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Origem opaca: `Origin: null` (iframe sandbox, `data:` URL, redirect 307
 * cross-origin) e esquemas sem host. O navegador manda isso justamente nos
 * cenários de CSRF, então nunca pode cair no ramo "cliente não-browser".
 */
const OPAQUE_ORIGIN = Symbol('opaque-origin');

type RequestOrigin = string | typeof OPAQUE_ORIGIN | undefined;

function normalizeOrigin(value: string): RequestOrigin {
  if (value.trim().toLowerCase() === 'null') {
    return OPAQUE_ORIGIN;
  }

  try {
    const origin = new URL(value).origin.toLowerCase();
    return origin === 'null' ? OPAQUE_ORIGIN : origin;
  } catch {
    return undefined;
  }
}

/**
 * Defesa contra CSRF nos endpoints que autenticam só por cookie. CORS não
 * cobre esse caso: um <form> em outro site consegue fazer POST sem preflight,
 * e com COOKIE_SAMESITE=none o cookie viaja junto. Navegadores sempre mandam
 * `Origin` em requisição mutante, então recusar origem desconhecida ou opaca
 * basta; clientes não-browser (curl, app nativo) não mandam o header e passam.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(config: ConfigService) {
    this.allowedOrigins = new Set(
      (config.get<string[]>('ALLOWED_ORIGINS') ?? [])
        .map(normalizeOrigin)
        .filter((origin): origin is string => typeof origin === 'string'),
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

    if (this.allowedOrigins.size === 0) {
      return true;
    }

    const origin = this.requestOrigin(request);
    if (origin === OPAQUE_ORIGIN) {
      throw this.notAllowed();
    }

    if (!origin) {
      return true;
    }

    if (
      this.allowedOrigins.has(origin) ||
      origin === this.selfOrigin(request)
    ) {
      return true;
    }

    throw this.notAllowed();
  }

  private notAllowed(): ForbiddenException {
    return new ForbiddenException({
      error: 'Origem não permitida.',
      code: 'ORIGIN_NOT_ALLOWED',
    });
  }

  private requestOrigin(request: Request): RequestOrigin {
    const header = request.headers.origin;
    if (typeof header === 'string' && header) {
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
