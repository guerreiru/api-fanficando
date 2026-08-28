import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from '../application/auth.service';
import { EmailChangeService } from '../application/email-change.service';
import { EmailVerificationService } from '../application/email-verification.service';
import { PasswordResetService } from '../application/password-reset.service';
import { AUTH_COOKIES } from '../domain/auth.constants';
import type {
  AuthFlowResult,
  AuthenticatedUser,
  IssuedSession,
} from '../domain/auth.types';
import { isIssuedSession } from '../domain/auth.types';
import { invalidRequiredAge } from '../domain/auth.errors';
import { resolveVisitorAckTierFromInput } from '../domain/visitor-age';
import { CurrentUser } from './decorators/current-user.decorator';
import { OptionalCurrentUser } from './decorators/optional-current-user.decorator';
import { Public } from './decorators/public.decorator';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { EmailBodyDto } from './dto/email-body.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenBodyDto } from './dto/token-body.dto';
import { VisitorAgeAckDto } from './dto/visitor-age-ack.dto';
import type { CookieEnv } from './auth.cookies';
import {
  clearAuthCookies,
  clearProfileCompletionCookie,
  setAuthCookies,
  setProfileCompletionCookie,
  setVisitorAgeAckCookie,
} from './auth.cookies';
import { readCookie } from './read-cookie';

type CookieRequest = Request & { cookies?: Record<string, unknown> };

@Controller('auth')
export class AuthController {
  private readonly cookies: CookieEnv;

  constructor(
    private readonly auth: AuthService,
    private readonly emailVerification: EmailVerificationService,
    private readonly passwordReset: PasswordResetService,
    private readonly emailChange: EmailChangeService,
    config: ConfigService,
  ) {
    this.cookies = {
      COOKIE_SECURE: config.get<boolean>('COOKIE_SECURE', false),
      COOKIE_SAMESITE: config.get<'lax' | 'strict' | 'none'>(
        'COOKIE_SAMESITE',
        'lax',
      ),
      COOKIE_DOMAIN: config.get<string>('COOKIE_DOMAIN') || undefined,
      JWT_PROFILE_COMPLETION_EXPIRES_IN: config.get<string>(
        'JWT_PROFILE_COMPLETION_EXPIRES_IN',
        '30m',
      ),
      AGE_ACK_SECRET: config.getOrThrow<string>('AGE_ACK_SECRET'),
      COOKIE_AGE_ACK_MAX_AGE_MS: config.get<number>(
        'COOKIE_AGE_ACK_MAX_AGE_MS',
        180 * 24 * 60 * 60 * 1000,
      ),
    };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: RegisterDto) {
    const result = await this.auth.register({
      email: body.email,
      password: body.password,
      name: body.name,
      username: body.username,
      termsAccepted: body.termsAccepted,
      ageVerified: body.ageVerified,
      birthDate: body.birthDate,
    });

    return {
      user: result.user,
      requiresEmailVerification: true,
      message: 'Enviamos um link de confirmação para o seu e-mail.',
      ...(result.suggestion ? { suggestion: result.suggestion } : {}),
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(
    @Body() body: LoginDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(
      { email: body.email, password: body.password },
      this.meta(request),
    );

    return this.respondAuthFlow(
      response,
      result,
      'Perfil incompleto: complete sua data de nascimento para continuar',
    );
  }

  @Public()
  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async googleTokenLogin(
    @Body() body: GoogleTokenDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.googleTokenLogin(
      body.idToken || body.credential,
      this.meta(request),
    );

    const payload = this.respondAuthFlow(
      response,
      result,
      'Perfil incompleto: data de nascimento obrigatória',
    );

    if (isIssuedSession(result)) {
      return {
        message: 'Login Google realizado com sucesso',
        ...payload,
      };
    }

    return payload;
  }

  @Public()
  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async completeProfile(
    @Body() body: CompleteProfileDto,
    @OptionalCurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.completeProfile(
      body,
      this.meta(request),
      user?.id,
      readCookie(request.cookies, AUTH_COOKIES.profileCompletion),
    );

    this.setSessionCookies(response, session);
    return {
      success: true,
      message: 'Perfil completado com sucesso',
      user: session.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.refresh(
      readCookie(request.cookies, AUTH_COOKIES.refresh),
      this.meta(request),
    );

    this.setSessionCookies(response, session);
    return { user: session.user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(readCookie(request.cookies, AUTH_COOKIES.refresh));
    clearAuthCookies(response, this.cookieEnv());
    clearProfileCompletionCookie(response, this.cookieEnv());
    return { ok: true };
  }

  @Public()
  @Post('visitor-age-ack')
  @HttpCode(HttpStatus.OK)
  acknowledgeVisitorAge(
    @Body() body: VisitorAgeAckDto,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tier = resolveVisitorAckTierFromInput(body.requiredAge);
    if (!tier) {
      throw invalidRequiredAge();
    }

    setVisitorAgeAckCookie(response, request.cookies, tier, this.cookieEnv());
    return { success: true, requiredAge: tier };
  }

  @Public()
  @Get('verify-email')
  previewVerifyEmail(@Query('token') token?: string) {
    return this.emailVerification.preview(token);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  confirmVerifyEmail(
    @Body() body: TokenBodyDto,
    @Query('token') token?: string,
  ) {
    return this.emailVerification.confirm(body.token || token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resendVerification(
    @OptionalCurrentUser() user: AuthenticatedUser | undefined,
    @Body() body: EmailBodyDto,
  ) {
    return this.emailVerification.resend(user?.id, body.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(@Body() body: EmailBodyDto) {
    return this.passwordReset.requestReset(body.email);
  }

  @Public()
  @Get('reset-password')
  previewResetPassword(@Query('token') token?: string) {
    return this.passwordReset.preview(token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  confirmResetPassword(
    @Body() body: ResetPasswordDto,
    @Query('token') token?: string,
  ) {
    return this.passwordReset.resetPassword(body.token || token, body.password);
  }

  @Public()
  @Get('confirm-email-change')
  previewEmailChange(@Query('token') token?: string) {
    return this.emailChange.preview(token);
  }

  @Public()
  @Post('confirm-email-change')
  @HttpCode(HttpStatus.OK)
  confirmEmailChange(
    @Body() body: TokenBodyDto,
    @Query('token') token?: string,
  ) {
    return this.emailChange.confirm(body.token || token);
  }

  @Get('me')
  async me(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.me(user.id);

    if (session.requiresProfileCompletion) {
      setProfileCompletionCookie(
        response,
        session.completionToken,
        this.cookieEnv(),
      );
      return {
        user: session.user,
        requiresProfileCompletion: true,
        completionPath: session.completionPath,
      };
    }

    clearProfileCompletionCookie(response, this.cookieEnv());
    return {
      user: session.user,
      requiresProfileCompletion: false,
    };
  }

  private respondAuthFlow(
    response: Response,
    result: AuthFlowResult,
    incompleteMessage: string,
  ) {
    if (!isIssuedSession(result)) {
      clearAuthCookies(response, this.cookieEnv());
      setProfileCompletionCookie(
        response,
        result.completionToken,
        this.cookieEnv(),
      );
      return {
        message: incompleteMessage,
        requiresProfileCompletion: true,
        completionPath: result.completionPath,
        user: result.user,
        ...(result.socialProfile
          ? { socialProfile: result.socialProfile }
          : {}),
      };
    }

    this.setSessionCookies(response, result);
    return { user: result.user };
  }

  private setSessionCookies(response: Response, session: IssuedSession) {
    clearProfileCompletionCookie(response, this.cookieEnv());
    setAuthCookies(response, session, this.cookieEnv());
  }

  private meta(request: CookieRequest) {
    return {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
  }

  private cookieEnv(): CookieEnv {
    return this.cookies;
  }
}
