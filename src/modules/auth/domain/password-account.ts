export function isPasswordAccount(user: {
  googleId?: string | null;
  socialProvider?: string | null;
}): boolean {
  return !user.googleId && !user.socialProvider;
}
