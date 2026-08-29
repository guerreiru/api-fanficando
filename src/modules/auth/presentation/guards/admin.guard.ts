import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { adminRequired, unauthenticated } from '../../domain/auth.errors';
import type { AuthenticatedUser } from '../../domain/auth.types';

/**
 * Roda depois do `AuthGuard` global, que já validou a sessão e recusou conta
 * suspensa, então aqui só resta checar o papel. Nunca usar em rota `@Public()`:
 * lá o usuário é opcional e um admin logado seria indistinguível de um visitante.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();

    if (!request.user?.id) {
      throw unauthenticated();
    }

    if (!request.user.isAdmin) {
      throw adminRequired();
    }

    return true;
  }
}
