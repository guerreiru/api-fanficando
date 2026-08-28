export function readCookie(
  cookies: Record<string, unknown> | undefined,
  name: string,
): string | undefined {
  const value = cookies?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
