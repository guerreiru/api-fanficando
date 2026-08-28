import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailChangeService } from '../../auth/application/email-change.service';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { ChangeEmailDto } from './dto/change-email.dto';

@Controller('users')
export class UserController {
  constructor(private readonly emailChange: EmailChangeService) {}

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
}
