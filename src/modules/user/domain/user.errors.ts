import { HttpException, HttpStatus } from '@nestjs/common';
import { AUTH_ERROR } from '../../auth/domain/auth.errors';
import { PASSWORD_RULES } from '../../auth/domain/auth.constants';
import { BIO_RULES, USERNAME_CHANGE_COOLDOWN_DAYS } from './user.constants';

export class UserException extends HttpException {
  constructor(
    status: HttpStatus,
    error: string,
    code: string,
    extras: Record<string, unknown> = {},
  ) {
    super({ error, code, ...extras }, status);
  }
}

export const USER_ERROR = {
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  NOTHING_TO_UPDATE: 'NOTHING_TO_UPDATE',
  INVALID_NAME: 'INVALID_NAME',
  INVALID_BIO: 'INVALID_BIO',
  INVALID_AVATAR_URL: 'INVALID_AVATAR_URL',
  INVALID_PROFILE_FIELD: 'INVALID_PROFILE_FIELD',
  SAME_USERNAME: 'SAME_USERNAME',
  USERNAME_CHANGE_TOO_SOON: 'USERNAME_CHANGE_TOO_SOON',
  INVALID_CONFIRMATION: 'INVALID_CONFIRMATION',
  SAME_PASSWORD: 'SAME_PASSWORD',
} as const;

export function profileNotFound(): UserException {
  return new UserException(
    HttpStatus.NOT_FOUND,
    'Perfil não encontrado.',
    USER_ERROR.PROFILE_NOT_FOUND,
  );
}

export function nothingToUpdate(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    'Nenhum campo para atualizar.',
    USER_ERROR.NOTHING_TO_UPDATE,
  );
}

export function invalidName(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    'Nome inválido.',
    USER_ERROR.INVALID_NAME,
  );
}

export function invalidBio(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    `A bio deve ter no máximo ${BIO_RULES.maxLength} caracteres.`,
    USER_ERROR.INVALID_BIO,
  );
}

/**
 * A API só guarda a URL do avatar. Aceitar host arbitrário faria cada perfil
 * visitado vazar o IP do leitor para um terceiro escolhido pelo dono da conta.
 */
export function invalidAvatarUrl(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    'A imagem do avatar precisa estar hospedada no CDN da Fanficando.',
    USER_ERROR.INVALID_AVATAR_URL,
  );
}

export function invalidProfileField(field: string): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    `Valor inválido para ${field}.`,
    USER_ERROR.INVALID_PROFILE_FIELD,
    { field },
  );
}

export function sameUsername(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    'Informe um nome de usuário diferente do atual.',
    USER_ERROR.SAME_USERNAME,
  );
}

export function usernameChangeTooSoon(availableAt: Date): UserException {
  return new UserException(
    HttpStatus.CONFLICT,
    `Você só pode trocar o nome de usuário a cada ${USERNAME_CHANGE_COOLDOWN_DAYS} dias.`,
    USER_ERROR.USERNAME_CHANGE_TOO_SOON,
    { availableAt: availableAt.toISOString() },
  );
}

export function invalidConfirmation(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    'Confirmação inválida.',
    USER_ERROR.INVALID_CONFIRMATION,
  );
}

/** Mesmo código do auth: o front trata conta social num único lugar. */
export function socialAccountHasNoPassword(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    'Contas vinculadas ao Google não têm senha para alterar.',
    AUTH_ERROR.SOCIAL_ACCOUNT,
  );
}

export function passwordTooLong(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    `A senha deve ter no máximo ${PASSWORD_RULES.maxLength} caracteres.`,
    AUTH_ERROR.WEAK_PASSWORD,
  );
}

export function samePassword(): UserException {
  return new UserException(
    HttpStatus.BAD_REQUEST,
    'A nova senha deve ser diferente da atual.',
    USER_ERROR.SAME_PASSWORD,
  );
}
