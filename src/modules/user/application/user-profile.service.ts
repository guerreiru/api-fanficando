import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unauthenticated, usernameTaken } from '../../auth/domain/auth.errors';
import {
  allocateUniqueUsername,
  assertValidUsernameFormat,
} from '../../auth/domain/username';
import { AuthUserRepository } from '../../auth/infrastructure/auth-user.repository';
import { parseProfileUpdate } from '../domain/profile-update';
import { assertUsernameChangeAllowed } from '../domain/username-change';
import { profileNotFound, sameUsername } from '../domain/user.errors';
import {
  toOwnProfileView,
  toPublicProfileView,
  type OwnProfileSource,
} from '../domain/user.mapper';
import type {
  OwnProfileView,
  ProfileUpdateInput,
  PublicProfileView,
} from '../domain/user.types';
import { UserProfileRepository } from '../infrastructure/user-profile.repository';

@Injectable()
export class UserProfileService {
  constructor(
    private readonly profiles: UserProfileRepository,
    private readonly users: AuthUserRepository,
    private readonly config: ConfigService,
  ) {}

  async getOwnProfile(userId: string): Promise<OwnProfileView> {
    const profile = await this.profiles.findOwnProfile(userId);
    if (!profile) {
      throw unauthenticated();
    }

    return this.withStats(profile);
  }

  async updateProfile(
    userId: string,
    input: ProfileUpdateInput,
  ): Promise<OwnProfileView> {
    const patch = parseProfileUpdate(input, this.allowedAvatarHosts());
    const updated = await this.profiles.updateProfile(userId, patch);

    return this.withStats(updated);
  }

  async changeUsername(
    userId: string,
    rawUsername: unknown,
  ): Promise<OwnProfileView> {
    const username = assertValidUsernameFormat(rawUsername);

    const current = await this.profiles.findOwnProfile(userId);
    if (!current) {
      throw unauthenticated();
    }

    if (current.username === username) {
      throw sameUsername();
    }

    assertUsernameChangeAllowed(current.usernameChangedAt);

    if (await this.users.isUsernameTaken(username, userId)) {
      throw usernameTaken(
        await allocateUniqueUsername(username, (candidate) =>
          this.users.isUsernameTaken(candidate, userId),
        ),
      );
    }

    const updated = await this.profiles.updateUsername(userId, username);
    return this.withStats(updated);
  }

  async getPublicProfile(username: string): Promise<PublicProfileView> {
    const profile = await this.profiles.findPublicProfileByUsername(username);
    if (!profile) {
      throw profileNotFound();
    }

    const stats = await this.profiles.statsFor(profile.id);
    return toPublicProfileView(profile, stats);
  }

  private async withStats(profile: OwnProfileSource): Promise<OwnProfileView> {
    const stats = await this.profiles.statsFor(profile.id);
    return toOwnProfileView(profile, stats);
  }

  private allowedAvatarHosts(): string[] {
    return this.config.get<string[]>('AVATAR_ALLOWED_HOSTS') ?? [];
  }
}
