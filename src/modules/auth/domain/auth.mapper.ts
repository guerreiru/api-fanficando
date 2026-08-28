import { formatBirthDate } from './birth-date';
import type { AuthUserView } from './auth.types';

export type AuthUserViewSource = Omit<
  AuthUserView,
  'birthDate' | 'socialProvider'
> & {
  birthDate: Date | string | null;
  socialProvider?: string | null;
};

export function toAuthUserView(user: AuthUserViewSource): AuthUserView {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    emailVerified: user.emailVerified,
    termsAccepted: user.termsAccepted,
    birthDate: formatBirthDate(user.birthDate),
    ageVerified: user.ageVerified,
    avatarUrl: user.avatarUrl,
    socialProvider: user.socialProvider ?? null,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}
