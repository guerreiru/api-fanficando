import { PROFILE_COMPLETION_PATH } from './auth.constants';
import type { AuthUserView, ProfileCompletionRequired } from './auth.types';

export function userNeedsProfileCompletion(user: {
  birthDate: string | Date | null;
  ageVerified: boolean;
}): boolean {
  return !user.birthDate || !user.ageVerified;
}

export function profileCompletionRequired(
  user: AuthUserView,
  completionToken: string,
  socialProfile?: ProfileCompletionRequired['socialProfile'],
): ProfileCompletionRequired {
  return {
    requiresProfileCompletion: true,
    completionToken,
    completionPath: PROFILE_COMPLETION_PATH,
    user,
    ...(socialProfile ? { socialProfile } : {}),
  };
}
