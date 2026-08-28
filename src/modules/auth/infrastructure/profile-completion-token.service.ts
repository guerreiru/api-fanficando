import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { parseDurationToMs } from '../domain/auth.constants';
import { AuthException, invalidProfileCompletion } from '../domain/auth.errors';

type ProfileCompletionPayload = {
  sub: string;
  typ: 'profile_completion';
  provider: string;
};

@Injectable()
export class ProfileCompletionTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  issue(userId: string, provider: string): Promise<string> {
    const payload: ProfileCompletionPayload = {
      sub: userId,
      typ: 'profile_completion',
      provider,
    };

    return this.jwt.signAsync(payload, {
      expiresIn: Math.floor(
        parseDurationToMs(
          this.config.get<string>('JWT_PROFILE_COMPLETION_EXPIRES_IN', '30m'),
          30 * 60_000,
        ) / 1000,
      ),
    });
  }

  async verify(token: string): Promise<{ userId: string; provider: string }> {
    try {
      const payload =
        await this.jwt.verifyAsync<ProfileCompletionPayload>(token);
      if (payload.typ !== 'profile_completion' || !payload.sub) {
        throw invalidProfileCompletion();
      }
      return { userId: payload.sub, provider: payload.provider };
    } catch (error) {
      if (error instanceof AuthException) {
        throw error;
      }
      throw invalidProfileCompletion();
    }
  }
}
