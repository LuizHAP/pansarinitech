import { connection } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_MS,
  assertAdminEnabled,
  credentialsMatch,
  getAdminCredentials,
  requireAdmin,
  signSession,
  verifySession,
} from './auth';

const { jar, cookieStore } = vi.hoisted(() => {
  const jar = new Map<string, string>();
  const cookieStore = {
    get: vi.fn((name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined)),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return { jar, cookieStore };
});

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));

const CREDENTIALS = { user: 'luiz', password: 'correct horse battery staple' };
const NOW = 1_800_000_000_000;

function enableAdmin() {
  vi.stubEnv('ADMIN_USER', CREDENTIALS.user);
  vi.stubEnv('ADMIN_PASSWORD', CREDENTIALS.password);
}

beforeEach(() => {
  jar.clear();
  vi.mocked(connection).mockClear();
  vi.stubEnv('ADMIN_USER', undefined);
  vi.stubEnv('ADMIN_PASSWORD', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('constants', () => {
  it('names the cookie and lasts 8 hours', () => {
    expect(ADMIN_SESSION_COOKIE).toBe('admin_session');
    expect(SESSION_TTL_MS).toBe(8 * 60 * 60 * 1000);
  });
});

describe('getAdminCredentials', () => {
  it('returns both values when set', () => {
    enableAdmin();
    expect(getAdminCredentials()).toEqual(CREDENTIALS);
  });

  it('keeps surrounding spaces in the password', () => {
    vi.stubEnv('ADMIN_USER', 'luiz');
    vi.stubEnv('ADMIN_PASSWORD', ' p ');
    expect(getAdminCredentials()).toEqual({ user: 'luiz', password: ' p ' });
  });

  it('returns null when either value is missing', () => {
    vi.stubEnv('ADMIN_USER', 'luiz');
    expect(getAdminCredentials()).toBeNull();
    vi.stubEnv('ADMIN_USER', undefined);
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    expect(getAdminCredentials()).toBeNull();
  });

  it('returns null when either value is empty', () => {
    vi.stubEnv('ADMIN_USER', '');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    expect(getAdminCredentials()).toBeNull();
    vi.stubEnv('ADMIN_USER', 'luiz');
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(getAdminCredentials()).toBeNull();
  });
});

describe('credentialsMatch', () => {
  it('matches equal strings only', () => {
    expect(credentialsMatch('secret', 'secret')).toBe(true);
    expect(credentialsMatch('secret', 'Secret')).toBe(false);
  });

  it('returns false for different lengths without throwing', () => {
    expect(credentialsMatch('a', 'abcdef')).toBe(false);
    expect(credentialsMatch('', 'x')).toBe(false);
  });
});

describe('signSession / verifySession', () => {
  const token = signSession(CREDENTIALS, NOW + 1000);
  const [expiry, signature] = token.split('.');

  it('signs <expiresAtMs>.<base64url> and accepts it before expiry', () => {
    expect(token).toMatch(/^\d+\.[A-Za-z0-9_-]+$/);
    expect(expiry).toBe(String(NOW + 1000));
    expect(verifySession(token, CREDENTIALS, NOW)).toBe(true);
  });

  it('rejects a flipped signature character', () => {
    const flipped = `${signature.slice(0, 5)}${signature[5] === 'A' ? 'B' : 'A'}${signature.slice(6)}`;
    expect(verifySession(`${expiry}.${flipped}`, CREDENTIALS, NOW)).toBe(false);
  });

  it('rejects a changed expiry with the old signature', () => {
    expect(verifySession(`${NOW + 999_999}.${signature}`, CREDENTIALS, NOW)).toBe(false);
  });

  it('rejects an expired token', () => {
    expect(verifySession(token, CREDENTIALS, NOW + 1000)).toBe(false);
    expect(verifySession(token, CREDENTIALS, NOW + 5000)).toBe(false);
  });

  it('rejects a token signed with another password or for another user', () => {
    const otherPassword = signSession({ ...CREDENTIALS, password: 'other' }, NOW + 1000);
    const otherUser = signSession({ ...CREDENTIALS, user: 'someone' }, NOW + 1000);
    expect(verifySession(otherPassword, CREDENTIALS, NOW)).toBe(false);
    expect(verifySession(otherUser, CREDENTIALS, NOW)).toBe(false);
  });

  it.each([undefined, '', 'abc', 'x.y', '.sig'])('rejects the malformed token %j', (value) => {
    expect(verifySession(value, CREDENTIALS, NOW)).toBe(false);
  });

  it('rejects a token with 3 parts', () => {
    expect(verifySession(`${token}.extra`, CREDENTIALS, NOW)).toBe(false);
  });

  it('defaults to the current time', () => {
    expect(verifySession(signSession(CREDENTIALS, Date.now() + 60_000), CREDENTIALS)).toBe(true);
    expect(verifySession(signSession(CREDENTIALS, Date.now() - 1), CREDENTIALS)).toBe(false);
  });
});

describe('assertAdminEnabled', () => {
  it('404s when the env is unset, after opting out of prerendering', async () => {
    await expect(assertAdminEnabled()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(connection).toHaveBeenCalledTimes(1);
  });

  it('awaits connection() before reading the env', async () => {
    vi.mocked(connection).mockRejectedValueOnce(new Error('connection first'));
    await expect(assertAdminEnabled()).rejects.toThrow('connection first');
  });

  it('returns the credentials when the env is set', async () => {
    enableAdmin();
    await expect(assertAdminEnabled()).resolves.toEqual(CREDENTIALS);
  });
});

describe('requireAdmin', () => {
  it('404s when the env is unset, even with a cookie', async () => {
    jar.set(ADMIN_SESSION_COOKIE, signSession(CREDENTIALS, Date.now() + 60_000));
    await expect(requireAdmin()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('redirects to the login without a cookie', async () => {
    enableAdmin();
    await expect(requireAdmin()).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(cookieStore.get).toHaveBeenCalledWith('admin_session');
  });

  it('redirects to the login with an expired cookie', async () => {
    enableAdmin();
    jar.set(ADMIN_SESSION_COOKIE, signSession(CREDENTIALS, Date.now() - 1000));
    await expect(requireAdmin()).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
  });

  it('redirects to the login with a cookie signed by another password', async () => {
    enableAdmin();
    jar.set(
      ADMIN_SESSION_COOKIE,
      signSession({ ...CREDENTIALS, password: 'old password' }, Date.now() + 60_000),
    );
    await expect(requireAdmin()).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
  });

  it('resolves with a valid cookie', async () => {
    enableAdmin();
    jar.set(ADMIN_SESSION_COOKIE, signSession(CREDENTIALS, Date.now() + 60_000));
    await expect(requireAdmin()).resolves.toBeUndefined();
  });
});
