import { invalidateByTag } from '@vercel/functions';
import { updateTag } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, logout, purgePreview, refreshIndex } from './actions';
import { ADMIN_SESSION_COOKIE, SESSION_TTL_MS, signSession, verifySession } from './auth';

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
vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn() }));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn, updateTag: vi.fn() }));
vi.mock('@vercel/functions', () => ({ addCacheTag: vi.fn(), invalidateByTag: vi.fn() }));

const CREDENTIALS = { user: 'luiz', password: 'correct horse battery staple' };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

function signIn() {
  jar.set(ADMIN_SESSION_COOKIE, signSession(CREDENTIALS, Date.now() + 60_000));
}

beforeEach(() => {
  jar.clear();
  cookieStore.get.mockClear();
  cookieStore.set.mockClear();
  cookieStore.delete.mockClear();
  vi.mocked(updateTag).mockClear();
  vi.mocked(invalidateByTag).mockClear();
  vi.stubEnv('ADMIN_USER', CREDENTIALS.user);
  vi.stubEnv('ADMIN_PASSWORD', CREDENTIALS.password);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function expectSlowFailure(fields: FormData) {
  const started = performance.now();
  await expect(login({ error: null }, fields)).resolves.toEqual({
    error: 'Usuário ou senha inválidos.',
  });
  expect(performance.now() - started).toBeGreaterThanOrEqual(350);
  expect(cookieStore.set).not.toHaveBeenCalled();
}

describe('login', () => {
  it('rejects a wrong password with the generic error after a delay', async () => {
    await expectSlowFailure(form({ user: 'luiz', password: 'wrong' }));
  });

  it('rejects a wrong user with the right password the same way', async () => {
    await expectSlowFailure(form({ user: 'someone', password: CREDENTIALS.password }));
  });

  it('rejects missing fields the same way', async () => {
    await expectSlowFailure(new FormData());
  });

  it('sets an 8 h HttpOnly, SameSite=Strict, Path=/admin session and redirects to /admin', async () => {
    const before = Date.now();
    await expect(
      login({ error: null }, form({ user: 'luiz', password: CREDENTIALS.password })),
    ).rejects.toThrow(/^NEXT_REDIRECT \/admin$/);

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    expect(cookieStore.set).toHaveBeenCalledWith('admin_session', expect.any(String), {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/admin',
      maxAge: 28800,
    });
    const value = cookieStore.set.mock.calls[0][1] as string;
    expect(verifySession(value, CREDENTIALS)).toBe(true);
    const expiresAt = Number(value.split('.')[0]);
    expect(expiresAt).toBeGreaterThanOrEqual(before + SESSION_TTL_MS);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + SESSION_TTL_MS);
  });

  it('marks the cookie Secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(
      login({ error: null }, form({ user: 'luiz', password: CREDENTIALS.password })),
    ).rejects.toThrow(/^NEXT_REDIRECT \/admin$/);
    expect(cookieStore.set).toHaveBeenCalledWith(
      'admin_session',
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
  });

  it('404s when the env is unset', async () => {
    vi.stubEnv('ADMIN_PASSWORD', undefined);
    await expect(
      login({ error: null }, form({ user: 'luiz', password: CREDENTIALS.password })),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('redirects without deleting anything when there is no session', async () => {
    await expect(logout()).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it('deletes the Path=/admin cookie and redirects to the login', async () => {
    signIn();
    await expect(logout()).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: 'admin_session', path: '/admin' });
  });
});

describe('refreshIndex', () => {
  it('invalidates nothing without a session', async () => {
    await expect(refreshIndex()).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(updateTag).not.toHaveBeenCalled();
    expect(invalidateByTag).not.toHaveBeenCalled();
  });

  it('expires the cached index and the CDN copies with a session', async () => {
    signIn();
    await expect(refreshIndex()).resolves.toBeUndefined();
    expect(updateTag).toHaveBeenCalledWith('client-previews');
    expect(invalidateByTag).toHaveBeenCalledWith('client-previews');
  });
});

describe('purgePreview', () => {
  it('invalidates nothing without a session', async () => {
    await expect(purgePreview('acme')).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(updateTag).not.toHaveBeenCalled();
    expect(invalidateByTag).not.toHaveBeenCalled();
  });

  it("invalidates one site's CDN tag and the index with a session", async () => {
    signIn();
    await expect(purgePreview('acme')).resolves.toBeUndefined();
    expect(invalidateByTag).toHaveBeenCalledWith('client-preview:acme');
    expect(updateTag).toHaveBeenCalledWith('client-previews');
  });

  it('ignores a slug outside [a-z0-9-]', async () => {
    signIn();
    await expect(purgePreview('../x')).resolves.toBeUndefined();
    expect(invalidateByTag).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });
});
