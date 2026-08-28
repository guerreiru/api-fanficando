import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { unauthenticated } from '../domain/auth.errors';

type AccessPayload = {
  sub: string;
  typ: 'access';
};

@Injectable()
export class JwtAccessService {
  constructor(private readonly jwt: JwtService) {}

  sign(userId: string): Promise<string> {
    const payload: AccessPayload = { sub: userId, typ: 'access' };
    return this.jwt.signAsync(payload);
  }

  async verify(token: string): Promise<string> {
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      if (payload.typ !== 'access' || !payload.sub) {
        throw unauthenticated();
      }
      return payload.sub;
    } catch {
      throw unauthenticated();
    }
  }
}
