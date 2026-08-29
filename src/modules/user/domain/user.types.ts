export type ProfileStats = {
  /** Histórias publicadas e visíveis. */
  stories: number;
  /** Quem segue este autor. */
  followers: number;
  /** Quem este usuário segue. */
  following: number;
};

export type OwnProfileView = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  usernameChangedAt: string | null;
  /** `null` quando a troca de username já está liberada. */
  usernameChangeAvailableAt: string | null;
  birthDate: string | null;
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
  stats: ProfileStats;
};

export type PublicProfileView = {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  authorVerified: boolean;
  authorFounder: boolean;
  createdAt: Date;
  stats: ProfileStats;
};

export type ProfileUpdateInput = {
  name?: unknown;
  bio?: unknown;
  avatarUrl?: unknown;
  emailNotifications?: unknown;
  tourVersion?: unknown;
};

/** Só as chaves presentes viram `UPDATE`; `null` limpa o campo. */
export type ProfileUpdatePatch = {
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  emailNotifications?: boolean;
  tourVersion?: number;
};
