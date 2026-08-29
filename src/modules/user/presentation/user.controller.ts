import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { EmailChangeService } from '../../auth/application/email-change.service';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import type { BaseCookieEnv } from '../../auth/presentation/auth.cookies';
import { clearAuthCookies } from '../../auth/presentation/auth.cookies';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { AccountService } from '../application/account.service';
import { UserProfileService } from '../application/user-profile.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UserController {
  private readonly cookies: BaseCookieEnv;

  constructor(
    private readonly profiles: UserProfileService,
    private readonly account: AccountService,
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
    };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return { user: await this.profiles.getOwnProfile(user.id) };
  }

  @Patch('me')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return { user: await this.profiles.updateProfile(user.id, body) };
  }

  @Patch('me/username')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changeUsername(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangeUsernameDto,
  ) {
    return { user: await this.profiles.changeUsername(user.id, body.username) };
  }

  @Post('me/change-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changeEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangeEmailDto,
  ) {
    return this.emailChange.requestChange(
      user.id,
      body.newEmail,
      body.currentPassword,
    );
  }

  /**
   * As sessões são revogadas no serviço; aqui os cookies saem do navegador
   * para o access token atual (JWT, sem revogação) não sobreviver à troca.
   */
  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.account.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );

    clearAuthCookies(response, this.cookies);
    return result;
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.account.deleteAccount(user.id, body);

    clearAuthCookies(response, this.cookies);
    return result;
  }

  // Declarada por último: `me` e `me/...` precisam casar antes do parâmetro.
  @Public()
  @Get(':username')
  async publicProfile(@Param('username') username: string) {
    return { user: await this.profiles.getPublicProfile(username) };
  }
}
