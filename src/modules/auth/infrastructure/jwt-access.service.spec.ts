import { JwtService } from '@nestjs/jwt';
import { AUTH_ERROR } from '../domain/auth.errors';
import { JwtAccessService } from './jwt-access.service';

const SECRET = 'unit-test-secret-with-enough-length';
const ISSUER = 'fanficando-api';
const AUDIENCE = 'fanficando-app';

describe('JwtAccessService', () => {
  const jwt = new JwtService({
    secret: SECRET,
    signOptions: {
      algorithm: 'HS256',
      expiresIn: 900,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
    verifyOptions: {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  });
  const service = new JwtAccessService(jwt);

  it('round-trips the user id of a freshly signed token', async () => {
    const token = await service.sign('user-1');
    await expect(service.verify(token)).resolves.toBe('user-1');
  });

  it('stamps issuer and audience', async () => {
    const payload = jwt.decode<{ iss: string; aud: string; typ: string }>(
      await service.sign('user-1'),
    );

    expect(payload).toMatchObject({
      iss: ISSUER,
      aud: AUDIENCE,
      typ: 'access',
    });
  });

  it('refuses a profile completion token', async () => {
    const token = jwt.sign({ sub: 'user-1', typ: 'profile_completion' });

    await expect(service.verify(token)).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('refuses a token without sub', async () => {
    const token = jwt.sign({ typ: 'access' });

    await expect(service.verify(token)).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('refuses a token signed with another secret', async () => {
    const foreign = new JwtService({ secret: 'another-secret-entirely' });
    const token = foreign.sign({ sub: 'user-1', typ: 'access' });

    await expect(service.verify(token)).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('refuses an unsigned (alg: none) token', async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: 'none', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: 'user-1', typ: 'access' }),
    ).toString('base64url');

    await expect(service.verify(`${header}.${payload}.`)).rejects.toMatchObject(
      {
        response: { code: AUTH_ERROR.UNAUTHENTICATED },
      },
    );
  });

  it('refuses an expired token', async () => {
    const token = jwt.sign(
      { sub: 'user-1', typ: 'access' },
      { expiresIn: '-1s' },
    );

    await expect(service.verify(token)).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('refuses a token issued for another audience', async () => {
    const token = jwt.sign(
      { sub: 'user-1', typ: 'access' },
      { audience: 'other-app' },
    );

    await expect(service.verify(token)).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });

  it('refuses a malformed token', async () => {
    await expect(service.verify('not-a-jwt')).rejects.toMatchObject({
      response: { code: AUTH_ERROR.UNAUTHENTICATED },
    });
  });
});
