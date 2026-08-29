import { Module } from '@nestjs/common';
import { AccountService } from './application/account.service';
import { UserProfileService } from './application/user-profile.service';
import { UserProfileRepository } from './infrastructure/user-profile.repository';
import { UserController } from './presentation/user.controller';

@Module({
  controllers: [UserController],
  providers: [UserProfileService, AccountService, UserProfileRepository],
  exports: [UserProfileService],
})
export class UserModule {}
