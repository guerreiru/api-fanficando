import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { parseDurationToMs } from './domain/auth.constants';
import { AuthCleanupService } from './application/auth-cleanup.service';
import { AuthService } from './application/auth.service';
import { EmailChangeService } from './application/email-change.service';
import { EmailVerificationService } from './application/email-verification.service';
import { PasswordResetService } from './application/password-reset.service';
import { PasswordService } from './application/password.service';
import { SessionService } from './application/session.service';
import { AuthUserRepository } from './infrastructure/auth-user.repository';
import { EmailChangeTokenRepository } from './infrastructure/email-change-token.repository';
import { EmailVerificationTokenRepository } from './infrastructure/email-verification-token.repository';
import { GoogleIdTokenService } from './infrastructure/google-id-token.service';
import { JwtAccessService } from './infrastructure/jwt-access.service';
import { PasswordResetTokenRepository } from './infrastructure/password-reset-token.repository';
import { ProfileCompletionTokenService } from './infrastructure/profile-completion-token.service';
import { RefreshTokenRepository } from './infrastructure/refresh-token.repository';
import { AuthController } from './presentation/auth.controller';
import { AuthGuard } from './presentation/guards/auth.guard';

@Global()
@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Math.floor(
            parseDurationToMs(
              config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
              15 * 60_000,
            ) / 1000,
          ),
          algorithm: 'HS256',
          issuer: config.get<string>('JWT_ISSUER', 'fanficando-api'),
          audience: config.get<string>('JWT_AUDIENCE', 'fanficando-app'),
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: config.get<string>('JWT_ISSUER', 'fanficando-api'),
          audience: config.get<string>('JWT_AUDIENCE', 'fanficando-app'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    PasswordResetService,
    EmailChangeService,
    PasswordService,
    SessionService,
    AuthCleanupService,
    AuthUserRepository,
    RefreshTokenRepository,
    EmailVerificationTokenRepository,
    PasswordResetTokenRepository,
    EmailChangeTokenRepository,
    JwtAccessService,
    GoogleIdTokenService,
    ProfileCompletionTokenService,
    AuthGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthGuard, JwtAccessService, EmailChangeService],
})
export class AuthModule {}
