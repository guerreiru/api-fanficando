import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/modules/app/app.module';
import { configureApp } from './../src/common/http/configure-app';
import { MailService } from './../src/modules/mail/mail.service';
import { PrismaService } from './../src/modules/prisma/prisma.service';

type SentMail = { to: string; token: string };

class MailServiceStub {
  readonly verification: SentMail[] = [];
  readonly passwordReset: SentMail[] = [];
  readonly emailChange: SentMail[] = [];

  sendVerificationEmail(payload: SentMail) {
    this.verification.push(payload);
    return Promise.resolve({ sent: true as const });
  }

  sendPasswordResetEmail(payload: SentMail) {
    this.passwordReset.push(payload);
    return Promise.resolve({ sent: true as const });
  }

  sendEmailChangeConfirmation(payload: SentMail) {
    this.emailChange.push(payload);
    return Promise.resolve({ sent: true as const });
  }
}

function cookiesOf(response: request.Response): string[] {
  const header = response.headers['set-cookie'];
  return Array.isArray(header) ? header : header ? [header] : [];
}

function cookieValue(cookies: string[], name: string): string | undefined {
  const entry = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  const value = entry?.split(';')[0]?.slice(name.length + 1);
  return value || undefined;
}

type AuthResponseBody = {
  code?: string;
  user?: { email?: string; username?: string };
};

function bodyOf(response: request.Response): AuthResponseBody {
  return response.body as AuthResponseBody;
}

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mail = new MailServiceStub();

  const email = `e2e-${randomUUID()}@fanficando.test`;
  const username = `e2e${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const password = 'SenhaForte123';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  async function register(overrides: Partial<{ username: string }> = {}) {
    return api()
      .post('/api/auth/register')
      .send({
        email,
        password,
        username: overrides.username ?? username,
        name: 'Pessoa E2E',
        termsAccepted: true,
        ageVerified: true,
        birthDate: '1995-03-10',
      });
  }

  /** O e-mail de verificação sai fora do ciclo da requisição. */
  async function waitForVerificationEmail(): Promise<SentMail> {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (mail.verification.length > 0) {
        return mail.verification[0];
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error('verification email was never sent');
  }

  it('registers without opening a session and sends the verification email', async () => {
    const response = await register();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      user: { email, username },
      requiresEmailVerification: true,
    });
    expect(cookiesOf(response)).toHaveLength(0);
    await expect(waitForVerificationEmail()).resolves.toMatchObject({
      to: email,
    });
  });

  it('answers a duplicated email with a generic rejection', async () => {
    const response = await register({ username: `${username}b` });

    expect(response.status).toBe(409);
    expect(bodyOf(response).code).toBe('REGISTRATION_REJECTED');
    expect(JSON.stringify(response.body)).not.toContain(email);
  });

  it('refuses login before the email is confirmed', async () => {
    const response = await api()
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.status).toBe(403);
    expect(bodyOf(response).code).toBe('EMAIL_NOT_VERIFIED');
    expect(cookiesOf(response)).toHaveLength(0);
  });

  it('stores the verification token only as a hash', async () => {
    const rawToken = mail.verification[0].token;
    const stored = await prisma.emailVerificationToken.findFirst({
      where: { user: { email } },
    });

    expect(stored).not.toBeNull();
    expect(stored?.tokenHash).not.toBe(rawToken);
    expect(stored?.tokenHash).toHaveLength(64);
  });

  it('confirms the email with the token from the message', async () => {
    const response = await api()
      .post('/api/auth/verify-email')
      .send({ token: mail.verification[0].token });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('answers resend the same way for unknown and already verified emails', async () => {
    const verified = await api()
      .post('/api/auth/resend-verification')
      .send({ email });
    const unknown = await api()
      .post('/api/auth/resend-verification')
      .send({ email: `ghost-${randomUUID()}@fanficando.test` });

    expect(verified.status).toBe(unknown.status);
    expect(verified.body).toEqual(unknown.body);
  });

  it('runs the full login → me → refresh → logout cycle on cookies', async () => {
    const login = await api().post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(bodyOf(login).user).toMatchObject({ email, username });
    expect(bodyOf(login)).not.toHaveProperty('accessToken');

    const loginCookies = cookiesOf(login);
    const accessCookie = loginCookies.find((cookie) =>
      cookie.startsWith('access_token='),
    );
    const refreshCookie = loginCookies.find((cookie) =>
      cookie.startsWith('refresh_token='),
    );

    expect(accessCookie).toMatch(/HttpOnly/i);
    expect(accessCookie).toMatch(/Path=\//);
    expect(accessCookie).toMatch(/SameSite=Lax/i);
    expect(refreshCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/Path=\/api\/auth/);

    const session = loginCookies.map((cookie) => cookie.split(';')[0]);

    const me = await api().get('/api/auth/me').set('Cookie', session);
    expect(me.status).toBe(200);
    expect(bodyOf(me).user).toMatchObject({ email, username });

    const refresh = await api()
      .post('/api/auth/refresh')
      .set('Cookie', session);
    expect(refresh.status).toBe(200);

    const rotated = cookieValue(cookiesOf(refresh), 'refresh_token');
    expect(rotated).toBeDefined();
    expect(rotated).not.toBe(cookieValue(loginCookies, 'refresh_token'));

    const replay = await api().post('/api/auth/refresh').set('Cookie', session);
    expect(replay.status).toBe(401);
    expect(bodyOf(replay).code).toBe('INVALID_REFRESH');

    const afterReplay = await api()
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${rotated}`]);
    expect(afterReplay.status).toBe(401);

    const logout = await api().post('/api/auth/logout').set('Cookie', session);
    expect(logout.status).toBe(200);
    expect(cookiesOf(logout).join(';')).toContain('access_token=;');
  });

  it('never turns two simultaneous refreshes into two live sessions', async () => {
    const login = await api().post('/api/auth/login').send({ email, password });
    const session = cookiesOf(login).map((cookie) => cookie.split(';')[0]);

    const [first, second] = await Promise.all([
      api().post('/api/auth/refresh').set('Cookie', session),
      api().post('/api/auth/refresh').set('Cookie', session),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 401]);

    // O vencedor da corrida também perde a sessão: do ponto de vista do
    // servidor, um refresh repetido é indistinguível de replay.
    const winner = first.status === 200 ? first : second;
    const rotated = cookieValue(cookiesOf(winner), 'refresh_token');
    const afterRace = await api()
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${rotated}`]);

    expect(afterRace.status).toBe(401);

    const live = await prisma.refreshToken.count({
      where: { user: { email }, revokedAt: null },
    });
    expect(live).toBe(0);
  });

  it('lets an unauthenticated visitor call logout', async () => {
    const response = await api().post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('rejects /me without a session', async () => {
    const response = await api().get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(bodyOf(response).code).toBe('UNAUTHENTICATED');
  });
});
