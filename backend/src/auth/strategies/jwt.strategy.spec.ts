import { jwtFromCookie } from './jwt.strategy';

describe('jwtFromCookie', () => {
  it('extracts the auth token from the http cookie', () => {
    expect(
      jwtFromCookie({
        cookies: {
          token: 'cookie-jwt',
        },
      } as any),
    ).toBe('cookie-jwt');
  });

  it('returns null when the token cookie is absent', () => {
    expect(jwtFromCookie({ cookies: {} } as any)).toBeNull();
  });
});
