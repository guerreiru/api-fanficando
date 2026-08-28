import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AUTH_COOKIES } from '../../domain/auth.constants';
import {
  accountSuspended,
  emailNotVerified,
  unauthenticated,
} from '../../domain/auth.errors';
import { isPasswordAccount } from '../../domain/password-account';
import type { AuthenticatedUser } from '../../domain/auth.types';
import { AuthUserRepository } from '../../infrastructure/auth-user.repository';
import { JwtAccessService } from '../../infrastructure/jwt-access.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { readCookie } from '../read-cookie';

type AuthRequest = Request & {
  cookies?: Record<string, unknown>;
  user?: AuthenticatedUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAccess: JwtAccessService,
    private readonly users: AuthUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (isPublic) {
      await this.tryAttachUser(request);
      return true;
    }

    const token = this.readAccessToken(request);
    if (!token) {
      throw unauthenticated();
    }

    await this.attachUser(request, token);
    return true;
  }

  /**
   * Em rota pública nenhuma falha vira erro: um usuário suspenso (ou sem
   * e-mail confirmado) precisa continuar conseguindo chamar logout e login.
   */
  private async tryAttachUser(request: AuthRequest): Promise<void> {
    const token = this.readAccessToken(request);
    if (!token) {
      return;
    }

    try {
      await this.attachUser(request, token);
    } catch {
      request.user = undefined;
    }
  }

  private async attachUser(request: AuthRequest, token: string): Promise<void> {
    const userId = await this.jwtAccess.verify(token);
    const user = await this.users.findAuthContext(userId);

    if (!user) {
      throw unauthenticated();
    }

    if (user.suspendedAt) {
      throw accountSuspended();
    }

    if (!user.emailVerified && isPasswordAccount(user)) {
      throw emailNotVerified();
    }

    request.user = { id: user.id, isAdmin: user.isAdmin };
  }

  private readAccessToken(request: AuthRequest): string | undefined {
    const cookieToken = readCookie(request.cookies, AUTH_COOKIES.access);
    if (cookieToken) {
      return cookieToken;
    }

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }

    const bearer = header.slice('Bearer '.length).trim();
    return bearer || undefined;
  }
}
