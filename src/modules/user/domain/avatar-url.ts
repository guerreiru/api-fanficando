import { AVATAR_RULES } from './user.constants';
import { invalidAvatarUrl } from './user.errors';

/** `*.host` casa qualquer subdomínio, mas nunca o apex. */
function hostAllowed(host: string, allowedHosts: readonly string[]): boolean {
  return allowedHosts.some((allowed) => {
    const pattern = allowed.trim().toLowerCase();
    if (!pattern) {
      return false;
    }
    if (pattern.startsWith('*.')) {
      return (
        host.endsWith(pattern.slice(1)) && host.length > pattern.length - 1
      );
    }
    return host === pattern;
  });
}

/**
 * O upload acontece fora da API: o cliente envia a imagem para a Cloudflare e
 * manda só a URL resultante. Por isso a validação é o único controle que
 * impede o campo de virar link arbitrário.
 *
 * String vazia e `null` removem o avatar.
 */
export function normalizeAvatarUrl(
  raw: unknown,
  allowedHosts: readonly string[],
): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw !== 'string') {
    throw invalidAvatarUrl();
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > AVATAR_RULES.maxLength) {
    throw invalidAvatarUrl();
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw invalidAvatarUrl();
  }

  if (url.protocol !== AVATAR_RULES.protocol) {
    throw invalidAvatarUrl();
  }

  // Credencial na URL é sinal de link forjado e vazaria em qualquer log.
  if (url.username || url.password) {
    throw invalidAvatarUrl();
  }

  if (!hostAllowed(url.hostname.toLowerCase(), allowedHosts)) {
    throw invalidAvatarUrl();
  }

  url.hash = '';
  return url.toString();
}
