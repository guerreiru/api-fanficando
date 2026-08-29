import { formatBirthDate } from '../../auth/domain/birth-date';
import { usernameChangeAvailableAt } from './username-change';
import type {
  OwnProfileView,
  ProfileStats,
  PublicProfileView,
} from './user.types';

export type OwnProfileSource = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  usernameChangedAt: Date | null;
  birthDate: Date | null;
  bio: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  termsAccepted: boolean;
  ageVerified: boolean;
  emailNotifications: boolean;
  tourVersion: number;
  authorVerified: boolean;
  authorFounder: boolean;
  founderRequestStatus: string | null;
  socialProvider: string | null;
  isAdmin: boolean;
  createdAt: Date;
};

export type PublicProfileSource = {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  authorVerified: boolean;
  authorFounder: boolean;
  createdAt: Date;
};

export function toOwnProfileView(
  user: OwnProfileSource,
  stats: ProfileStats,
  now: Date = new Date(),
): OwnProfileView {
  const availableAt = usernameChangeAvailableAt(user.usernameChangedAt, now);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    usernameChangedAt: user.usernameChangedAt?.toISOString() ?? null,
    usernameChangeAvailableAt: availableAt?.toISOString() ?? null,
    birthDate: formatBirthDate(user.birthDate),
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    termsAccepted: user.termsAccepted,
    ageVerified: user.ageVerified,
    emailNotifications: user.emailNotifications,
    tourVersion: user.tourVersion,
    authorVerified: user.authorVerified,
    authorFounder: user.authorFounder,
    founderRequestStatus: user.founderRequestStatus,
    socialProvider: user.socialProvider,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    stats,
  };
}

export function toPublicProfileView(
  user: PublicProfileSource,
  stats: ProfileStats,
): PublicProfileView {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    authorVerified: user.authorVerified,
    authorFounder: user.authorFounder,
    createdAt: user.createdAt,
    stats,
  };
}
