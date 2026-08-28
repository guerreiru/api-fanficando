import type { ExecutionContext } from '@nestjs/common';
import { OriginGuard } from './origin.guard';

describe('OriginGuard', () => {
  const allowed = ['https://fanficando.com', 'http://localhost:5173'];

  it('accepts a request from an allowed origin', () => {
    expect(
      guard(allowed).canActivate(
        context({ method: 'POST', origin: 'https://fanficando.com' }),
      ),
    ).toBe(true);
  });

  it('blocks a cross-site form POST from an unknown origin', () => {
    expect(() =>
      guard(allowed).canActivate(
        context({ method: 'POST', origin: 'https://evil.example' }),
      ),
    ).toThrow();
  });

  it('blocks the unknown origin declared only in the Referer', () => {
    expect(() =>
      guard(allowed).canActivate(
        context({
          method: 'POST',
          referer: 'https://evil.example/attack.html',
        }),
      ),
    ).toThrow();
  });

  it('blocks the opaque origin of a sandboxed iframe', () => {
    expect(() =>
      guard(allowed).canActivate(context({ method: 'POST', origin: 'null' })),
    ).toThrow();
  });

  it('does not let Origin: null fall back to the non-browser branch', () => {
    expect(() =>
      guard(allowed).canActivate(
        context({
          method: 'POST',
          origin: 'null',
          referer: 'https://fanficando.com/page',
        }),
      ),
    ).toThrow();
  });

  it('blocks an origin that parses without a host', () => {
    expect(() =>
      guard(allowed).canActivate(
        context({ method: 'POST', origin: 'data:text/html,<form>' }),
      ),
    ).toThrow();
  });

  it('ignores GET even from an unknown origin', () => {
    expect(
      guard(allowed).canActivate(
        context({ method: 'GET', origin: 'https://evil.example' }),
      ),
    ).toBe(true);
  });

  it('lets non-browser clients through when there is no Origin', () => {
    expect(guard(allowed).canActivate(context({ method: 'POST' }))).toBe(true);
  });

  it('accepts a request coming from the API host itself', () => {
    expect(
      guard(allowed).canActivate(
        context({
          method: 'POST',
          origin: 'http://api.fanficando.com',
          host: 'api.fanficando.com',
        }),
      ),
    ).toBe(true);
  });

  it('stays permissive when no origin list is configured', () => {
    expect(
      guard([]).canActivate(
        context({ method: 'POST', origin: 'https://evil.example' }),
      ),
    ).toBe(true);
  });

  function guard(origins: string[]) {
    return new OriginGuard({ get: () => origins } as never);
  }

  function context(options: {
    method: string;
    origin?: string;
    referer?: string;
    host?: string;
  }): ExecutionContext {
    const request = {
      method: options.method,
      protocol: 'http',
      headers: {
        origin: options.origin,
        referer: options.referer,
        host: options.host ?? 'api.test',
      },
    };

    return {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }
});
