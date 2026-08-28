const PRODUCTION_SITE_URL = 'https://www.fanficando.com';

export function resolveFrontendBase(frontendUrl?: string): string {
  return String(frontendUrl || PRODUCTION_SITE_URL).replace(/\/$/, '');
}

export function resolveEmailLogoUrl(
  frontendUrl?: string,
  override?: string,
): string {
  const custom = String(override || '').trim();
  if (custom) {
    return custom;
  }

  const frontendBase = resolveFrontendBase(frontendUrl);
  if (
    frontendBase.includes('localhost') ||
    frontendBase.includes('127.0.0.1')
  ) {
    return `${PRODUCTION_SITE_URL}/logo.png`;
  }

  return `${frontendBase}/logo.png`;
}

export function resolveEmailSiteUrl(frontendUrl?: string): string {
  const frontendBase = resolveFrontendBase(frontendUrl);
  if (
    frontendBase.includes('localhost') ||
    frontendBase.includes('127.0.0.1')
  ) {
    return PRODUCTION_SITE_URL;
  }

  return frontendBase;
}

export function buildFrontendTokenUrl(
  frontendUrl: string | undefined,
  path: string,
  token: string,
): string {
  const base = resolveFrontendBase(frontendUrl);
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}
