import { Injectable } from '@nestjs/common';
import { PASSWORD_RULES } from '../../auth/domain/auth.constants';
import {
  invalidPassword,
  passwordTooShort,
  unauthenticated,
} from '../../auth/domain/auth.errors';
import { isPasswordAccount } from '../../auth/domain/password-account';
import { AuthUserRepository } from '../../auth/infrastructure/auth-user.repository';
import { PasswordService } from '../../auth/application/password.service';
import { assertUsernameConfirmation } from '../domain/account-deletion';
import {
  passwordTooLong,
  samePassword,
  socialAccountHasNoPassword,
} from '../domain/user.errors';
import { UserProfileRepository } from '../infrastructure/user-profile.repository';

export type DeleteAccountInput = {
  currentPassword?: unknown;
  confirmUsername?: unknown;
};

@Injectable()
export class AccountService {
  constructor(
    private readonly users: AuthUserRepository,
    private readonly profiles: UserProfileRepository,
    private readonly passwords: PasswordService,
  ) {}

  /**
   * Encerra todas as sessões: uma senha trocada por suspeita de invasão não
   * pode deixar a sessão do invasor de pé.
   */
  async changePassword(
    userId: string,
    currentPasswordRaw: string,
    newPasswordRaw: string,
  ) {
    const user = await this.users.findAuthById(userId);
    if (!user) {
      throw unauthenticated();
    }

    if (!isPasswordAccount(user)) {
      throw socialAccountHasNoPassword();
    }

    const newPassword = String(newPasswordRaw || '');
    if (newPassword.length < PASSWORD_RULES.minLength) {
      throw passwordTooShort();
    }
    if (newPassword.length > PASSWORD_RULES.maxLength) {
      throw passwordTooLong();
    }

    const currentPassword = String(currentPasswordRaw || '');
    if (!(await this.passwords.verify(currentPassword, user.password))) {
      throw invalidPassword();
    }

    if (currentPassword === newPassword) {
      throw samePassword();
    }

    await this.profiles.changePassword(
      userId,
      await this.passwords.hash(newPassword),
    );

    return {
      success: true as const,
      message: 'Senha alterada. Entre novamente para continuar.',
    };
  }

  /**
   * Exclusão é definitiva: o `ON DELETE` do schema apaga sessões, biblioteca e
   * comentários, e deixa as histórias sem autor (`author_name` preservado).
   */
  async deleteAccount(userId: string, input: DeleteAccountInput) {
    const user = await this.users.findAuthById(userId);
    if (!user) {
      throw unauthenticated();
    }

    if (isPasswordAccount(user)) {
      const currentPassword =
        typeof input.currentPassword === 'string' ? input.currentPassword : '';
      if (!(await this.passwords.verify(currentPassword, user.password))) {
        throw invalidPassword();
      }
    } else {
      assertUsernameConfirmation(user.username, input.confirmUsername);
    }

    await this.profiles.deleteAccount(userId);

    return {
      success: true as const,
      message: 'Conta excluída.',
    };
  }
}
