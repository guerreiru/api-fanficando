const DOMAIN_TYPOS: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotnail.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
};

export function suggestEmailDomainCorrection(email: string): string | null {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }

  const domain = normalized.slice(atIndex + 1);
  const suggestion = DOMAIN_TYPOS[domain];
  if (!suggestion || suggestion === domain) {
    return null;
  }

  return suggestion;
}
