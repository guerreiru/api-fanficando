import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createMailProvider } from './mail.provider';
import { MailService } from './mail.service';
import { MAIL_PROVIDER } from './mail.types';

@Module({
  providers: [
    {
      provide: MAIL_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createMailProvider(config),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
