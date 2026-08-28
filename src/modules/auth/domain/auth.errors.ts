import { HttpException, HttpStatus } from '@nestjs/common';
import { PLATFORM_MIN_AGE, PASSWORD_RULES } from './auth.constants';

export class AuthException extends HttpException {
  constructor(
    status: HttpStatus,
    error: string,
    code: string,
    extras: Record<string, unknown> = {},
  ) {
    super({ error, code, ...extras }, status);
  }
}

export const AUTH_ERROR = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  REGISTRATION_REJECTED: 'REGISTRATION_REJECTED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_REFRESH: 'INVALID_REFRESH',
  TERMS_NOT_ACCEPTED: 'TERMS_NOT_ACCEPTED',
  AGE_NOT_CONFIRMED: 'AGE_NOT_CONFIRMED',
  INVALID_BIRTH_DATE: 'INVALID_BIRTH_DATE',
  UNDERAGE: 'UNDERAGE',
  INVALID_GOOGLE_TOKEN: 'INVALID_GOOGLE_TOKEN',
  GOOGLE_NOT_CONFIGURED: 'GOOGLE_NOT_CONFIGURED',
  GOOGLE_SIGN_IN_REJECTED: 'GOOGLE_SIGN_IN_REJECTED',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  INVALID_USERNAME: 'INVALID_USERNAME',
  USERNAME_REQUIRED: 'USERNAME_REQUIRED',
  DISPLAY_NAME_REQUIRED: 'DISPLAY_NAME_REQUIRED',
  INVALID_PROFILE_COMPLETION: 'INVALID_PROFILE_COMPLETION',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  EMAIL_REQUIRED: 'EMAIL_REQUIRED',
  SOCIAL_ACCOUNT: 'SOCIAL_ACCOUNT',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  SAME_EMAIL: 'SAME_EMAIL',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
  INVALID_REQUIRED_AGE: 'INVALID_REQUIRED_AGE',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
} as const;

export function invalidCredentials(): AuthException {
  return new AuthException(
    HttpStatus.UNAUTHORIZED,
    'E-mail ou senha inválidos.',
    AUTH_ERROR.INVALID_CREDENTIALS,
  );
}

/**
 * Colisão de e-mail no cadastro. Mensagem e código são propositalmente
 * genéricos: qualquer resposta específica permitiria enumerar contas.
 */
export function registrationRejected(): AuthException {
  return new AuthException(
    HttpStatus.CONFLICT,
    'Não foi possível criar a conta com estes dados.',
    AUTH_ERROR.REGISTRATION_REJECTED,
  );
}

export function accountSuspended(): AuthException {
  return new AuthException(
    HttpStatus.FORBIDDEN,
    'Esta conta está suspensa.',
    AUTH_ERROR.ACCOUNT_SUSPENDED,
  );
}

export function unauthenticated(): AuthException {
  return new AuthException(
    HttpStatus.UNAUTHORIZED,
    'Usuário não autenticado.',
    AUTH_ERROR.UNAUTHENTICATED,
  );
}

export function invalidRefresh(): AuthException {
  return new AuthException(
    HttpStatus.UNAUTHORIZED,
    'Sessão inválida ou expirada.',
    AUTH_ERROR.INVALID_REFRESH,
  );
}

export function termsNotAccepted(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Você precisa aceitar os Termos de Uso e Política de Privacidade.',
    AUTH_ERROR.TERMS_NOT_ACCEPTED,
  );
}

export function ageNotConfirmed(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Confirmação da data de nascimento é obrigatória.',
    AUTH_ERROR.AGE_NOT_CONFIRMED,
  );
}

export function invalidBirthDate(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Data de nascimento inválida.',
    AUTH_ERROR.INVALID_BIRTH_DATE,
  );
}

export function underage(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    `É necessário ter pelo menos ${PLATFORM_MIN_AGE} anos para usar a plataforma.`,
    AUTH_ERROR.UNDERAGE,
  );
}

export function invalidGoogleToken(): AuthException {
  return new AuthException(
    HttpStatus.UNAUTHORIZED,
    'Token do Google inválido',
    AUTH_ERROR.INVALID_GOOGLE_TOKEN,
  );
}

export function googleNotConfigured(): AuthException {
  return new AuthException(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Login com Google indisponível no momento.',
    AUTH_ERROR.GOOGLE_NOT_CONFIGURED,
  );
}

/**
 * Resposta única para e-mail já cadastrado com senha e para conflito de conta
 * Google: dizer qual dos dois ocorreu revelaria a existência da conta.
 */
export function googleSignInRejected(): AuthException {
  return new AuthException(
    HttpStatus.CONFLICT,
    'Não foi possível entrar com este Google.',
    AUTH_ERROR.GOOGLE_SIGN_IN_REJECTED,
  );
}

export function usernameTaken(suggestion?: string): AuthException {
  return new AuthException(
    HttpStatus.CONFLICT,
    'Nome de usuário já está em uso.',
    AUTH_ERROR.USERNAME_TAKEN,
    suggestion ? { suggestion } : {},
  );
}

export function usernameRequired(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Escolha um nome de usuário.',
    AUTH_ERROR.USERNAME_REQUIRED,
  );
}

export function invalidUsername(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Username inválido. Use 3–50 caracteres: letras, números ou _ (deve começar com letra).',
    AUTH_ERROR.INVALID_USERNAME,
  );
}

export function displayNameRequired(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Nome de exibição é obrigatório.',
    AUTH_ERROR.DISPLAY_NAME_REQUIRED,
  );
}

export function invalidProfileCompletion(): AuthException {
  return new AuthException(
    HttpStatus.UNAUTHORIZED,
    'completionToken inválido ou expirado',
    AUTH_ERROR.INVALID_PROFILE_COMPLETION,
  );
}

export function emailNotVerified(): AuthException {
  return new AuthException(
    HttpStatus.FORBIDDEN,
    'Confirme seu e-mail antes de entrar.',
    AUTH_ERROR.EMAIL_NOT_VERIFIED,
  );
}

export function invalidToken(message: string): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    message,
    AUTH_ERROR.INVALID_TOKEN,
  );
}

export function tokenExpired(message: string): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    message,
    AUTH_ERROR.TOKEN_EXPIRED,
  );
}

export function emailRequired(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Informe seu e-mail ou faça login para reenviar a confirmação.',
    AUTH_ERROR.EMAIL_REQUIRED,
  );
}

export function socialAccount(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Contas vinculadas ao Google não podem alterar o e-mail por aqui.',
    AUTH_ERROR.SOCIAL_ACCOUNT,
  );
}

export function invalidPassword(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Senha atual incorreta.',
    AUTH_ERROR.INVALID_PASSWORD,
  );
}

export function sameEmail(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'Informe um e-mail diferente do atual.',
    AUTH_ERROR.SAME_EMAIL,
  );
}

export function emailInUse(): AuthException {
  return new AuthException(
    HttpStatus.CONFLICT,
    'Este e-mail já está em uso.',
    AUTH_ERROR.EMAIL_IN_USE,
  );
}

export function invalidRequiredAge(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    'requiredAge inválido',
    AUTH_ERROR.INVALID_REQUIRED_AGE,
  );
}

export function passwordTooShort(): AuthException {
  return new AuthException(
    HttpStatus.BAD_REQUEST,
    `A senha deve ter pelo menos ${PASSWORD_RULES.minLength} caracteres.`,
    AUTH_ERROR.WEAK_PASSWORD,
  );
}
