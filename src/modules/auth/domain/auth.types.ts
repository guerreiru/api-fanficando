export type AuthUserView = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  emailVerified: boolean;
  termsAccepted: boolean;
  birthDate: string | null;
  ageVerified: boolean;
  avatarUrl: string | null;
  socialProvider: string | null;
  isAdmin: boolean;
  createdAt: Date;
};

export type AuthenticatedUser = {
  id: string;
  isAdmin: boolean;
};

export type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

export type IssuedSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenMaxAgeMs: number;
  refreshTokenMaxAgeMs: number;
  user: AuthUserView;
};

/**
 * O cadastro por senha não abre sessão: a conta só é utilizável depois de
 * confirmar o e-mail.
 */
export type RegisterResult = {
  user: AuthUserView;
  requiresEmailVerification: true;
  suggestion?: string;
};

export type SocialProfileView = {
  provider: string;
  email: string;
  name: string | null;
  avatar: string | null;
};

export type ProfileCompletionRequired = {
  requiresProfileCompletion: true;
  completionToken: string;
  completionPath: string;
  user: AuthUserView;
  socialProfile?: SocialProfileView;
};

export type AuthFlowResult = IssuedSession | ProfileCompletionRequired;

export type MeResult =
  | {
      user: AuthUserView;
      requiresProfileCompletion: false;
    }
  | {
      user: AuthUserView;
      requiresProfileCompletion: true;
      completionToken: string;
      completionPath: string;
    };

export function isIssuedSession(
  result: AuthFlowResult,
): result is IssuedSession {
  return 'accessToken' in result;
}
