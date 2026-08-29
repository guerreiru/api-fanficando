jest.mock('../infrastructure/user-profile.repository', () => ({
  UserProfileRepository: class UserProfileRepository {},
}));
jest.mock('../../auth/infrastructure/auth-user.repository', () => ({
  AuthUserRepository: class AuthUserRepository {},
}));

import { AUTH_ERROR } from '../../auth/domain/auth.errors';
import { USERNAME_CHANGE_COOLDOWN_MS } from '../domain/user.constants';
import { USER_ERROR } from '../domain/user.errors';
import type { OwnProfileSource } from '../domain/user.mapper';
import { UserProfileService } from './user-profile.service';

describe('UserProfileService', () => {
  const profiles = {
    findOwnProfile: jest.fn(),
    findPublicProfileByUsername: jest.fn(),
    statsFor: jest.fn(),
    updateProfile: jest.fn(),
    updateUsername: jest.fn(),
  };
  const users = {
    isUsernameTaken: jest.fn(),
  };
  const config = {
    get: jest.fn(() => ['cdn.fanficando.com']),
  };

  const service = new UserProfileService(
    profiles as never,
    users as never,
    config as never,
  );

  const ownProfile = (overrides: Partial<OwnProfileSource> = {}) =>
    ({
      id: 'user-1',
      email: 'ana@test.com',
      name: 'Ana',
      username: 'ana',
      usernameChangedAt: null,
      birthDate: new Date('2000-05-04T00:00:00.000Z'),
      bio: null,
      avatarUrl: null,
      emailVerified: true,
      termsAccepted: true,
      ageVerified: true,
      emailNotifications: true,
      tourVersion: 0,
      authorVerified: false,
      authorFounder: false,
      founderRequestStatus: null,
      socialProvider: null,
      isAdmin: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) satisfies OwnProfileSource;

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockReturnValue(['cdn.fanficando.com']);
    profiles.statsFor.mockResolvedValue({
      stories: 2,
      followers: 7,
      following: 3,
    });
  });

  it('returns the own profile with stats and the birth date as ISO day', async () => {
    profiles.findOwnProfile.mockResolvedValue(ownProfile());

    await expect(service.getOwnProfile('user-1')).resolves.toMatchObject({
      email: 'ana@test.com',
      birthDate: '2000-05-04',
      usernameChangeAvailableAt: null,
      stats: { stories: 2, followers: 7, following: 3 },
    });
  });

  it('refuses to build a profile for a user that no longer exists', async () => {
    profiles.findOwnProfile.mockResolvedValue(null);

    await expect(service.getOwnProfile('user-1')).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('exposes when the username change opens again', async () => {
    const changedAt = new Date(Date.now() - 86_400_000);
    profiles.findOwnProfile.mockResolvedValue(
      ownProfile({ usernameChangedAt: changedAt }),
    );

    await expect(service.getOwnProfile('user-1')).resolves.toMatchObject({
      usernameChangeAvailableAt: new Date(
        changedAt.getTime() + USERNAME_CHANGE_COOLDOWN_MS,
      ).toISOString(),
    });
  });

  it('sends only the changed fields to the repository', async () => {
    profiles.updateProfile.mockResolvedValue(ownProfile({ bio: 'Oi' }));

    await service.updateProfile('user-1', { bio: '  Oi  ' });

    expect(profiles.updateProfile).toHaveBeenCalledWith('user-1', {
      bio: 'Oi',
    });
  });

  it('validates the avatar against the configured cdn hosts', async () => {
    await expect(
      service.updateProfile('user-1', {
        avatarUrl: 'https://evil.com/a.png',
      }),
    ).rejects.toMatchObject({
      response: { code: USER_ERROR.INVALID_AVATAR_URL },
    });
    expect(profiles.updateProfile).not.toHaveBeenCalled();
  });

  it('refuses a username equal to the current one', async () => {
    profiles.findOwnProfile.mockResolvedValue(ownProfile());

    await expect(service.changeUsername('user-1', 'ANA')).rejects.toMatchObject(
      { response: { code: USER_ERROR.SAME_USERNAME } },
    );
  });

  it('refuses a change inside the cooldown', async () => {
    profiles.findOwnProfile.mockResolvedValue(
      ownProfile({ usernameChangedAt: new Date(Date.now() - 86_400_000) }),
    );

    await expect(
      service.changeUsername('user-1', 'anamaria'),
    ).rejects.toMatchObject({
      response: { code: USER_ERROR.USERNAME_CHANGE_TOO_SOON },
    });
    expect(profiles.updateUsername).not.toHaveBeenCalled();
  });

  it('suggests an alternative when the username is taken', async () => {
    profiles.findOwnProfile.mockResolvedValue(ownProfile());
    users.isUsernameTaken
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await expect(
      service.changeUsername('user-1', 'anamaria'),
    ).rejects.toMatchObject({
      response: {
        code: AUTH_ERROR.USERNAME_TAKEN,
        suggestion: 'anamaria2',
      },
    });
  });

  it('rejects an invalid username format before touching the database', async () => {
    await expect(
      service.changeUsername('user-1', '1ana'),
    ).rejects.toMatchObject({
      response: { code: AUTH_ERROR.INVALID_USERNAME },
    });
    expect(profiles.findOwnProfile).not.toHaveBeenCalled();
  });

  it('changes the username when it is free', async () => {
    profiles.findOwnProfile.mockResolvedValue(ownProfile());
    users.isUsernameTaken.mockResolvedValue(false);
    profiles.updateUsername.mockResolvedValue(
      ownProfile({ username: 'anamaria', usernameChangedAt: new Date() }),
    );

    await expect(
      service.changeUsername('user-1', ' @AnaMaria '),
    ).resolves.toMatchObject({ username: 'anamaria' });
    expect(profiles.updateUsername).toHaveBeenCalledWith('user-1', 'anamaria');
  });

  it('hides private fields on the public profile', async () => {
    profiles.findPublicProfileByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'ana',
      name: 'Ana',
      bio: 'Oi',
      avatarUrl: null,
      authorVerified: false,
      authorFounder: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const profile = await service.getPublicProfile('ana');

    expect(profile).not.toHaveProperty('email');
    expect(profile).not.toHaveProperty('isAdmin');
    expect(profile.stats).toEqual({ stories: 2, followers: 7, following: 3 });
  });

  it('answers 404 for an unknown public profile', async () => {
    profiles.findPublicProfileByUsername.mockResolvedValue(null);

    await expect(service.getPublicProfile('ninguem')).rejects.toMatchObject({
      response: { code: USER_ERROR.PROFILE_NOT_FOUND },
    });
  });
});
