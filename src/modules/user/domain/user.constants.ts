export const BIO_RULES = {
  maxLength: 500,
} as const;

export const AVATAR_RULES = {
  maxLength: 512,
  protocol: 'https:',
} as const;

/** O front usa isto para saber se precisa reexibir o tour. */
export const TOUR_RULES = {
  maxVersion: 9999,
} as const;

/**
 * @username é a identidade pública (perfil, menções, links). Troca livre
 * permitiria sequestrar o histórico de outra pessoa liberando o antigo.
 */
export const USERNAME_CHANGE_COOLDOWN_DAYS = 30;
export const USERNAME_CHANGE_COOLDOWN_MS =
  USERNAME_CHANGE_COOLDOWN_DAYS * 86_400_000;
