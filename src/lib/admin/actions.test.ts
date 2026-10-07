import { del, list, put } from '@vercel/blob';
import { dangerouslyDeleteByTag, invalidateByTag } from '@vercel/functions';
import { updateTag } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deletePreview,
  disablePreview,
  enablePreview,
  login,
  logout,
  purgePreview,
  refreshIndex,
} from './actions';
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
vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn, updateTag: vi.fn() }));
vi.mock('@vercel/functions', () => ({
  addCacheTag: vi.fn(),
  invalidateByTag: vi.fn(),
  dangerouslyDeleteByTag: vi.fn(),
}));

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
  vi.mocked(put).mockReset();
  vi.mocked(del).mockReset();
  vi.mocked(list).mockReset();
  vi.mocked(dangerouslyDeleteByTag).mockClear();
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

describe('disablePreview', () => {
  it('changes nothing without a session', async () => {
    await expect(disablePreview('acme')).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(put).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
    expect(dangerouslyDeleteByTag).not.toHaveBeenCalled();
    expect(invalidateByTag).not.toHaveBeenCalled();
  });

  it('writes the marker, expires the index and deletes the site from the CDN', async () => {
    signIn();
    await expect(disablePreview('acme')).resolves.toBeUndefined();
    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith('acme/.disabled', expect.stringMatching(/\S/), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    expect(updateTag).toHaveBeenCalledWith('client-previews');
    expect(dangerouslyDeleteByTag).toHaveBeenCalledTimes(1);
    expect(dangerouslyDeleteByTag).toHaveBeenCalledWith('client-preview:acme');
    expect(invalidateByTag).not.toHaveBeenCalled();
  });

  it('touches no cache when writing the marker fails', async () => {
    signIn();
    const failure = new Error('Vercel Blob: store unavailable');
    vi.mocked(put).mockRejectedValue(failure);
    await expect(disablePreview('acme')).rejects.toBe(failure);
    expect(updateTag).not.toHaveBeenCalled();
    expect(dangerouslyDeleteByTag).not.toHaveBeenCalled();
  });

  it('ignores a slug outside [a-z0-9-]', async () => {
    signIn();
    await expect(disablePreview('../x')).resolves.toBeUndefined();
    expect(put).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
    expect(dangerouslyDeleteByTag).not.toHaveBeenCalled();
  });
});

describe('enablePreview', () => {
  it('changes nothing without a session', async () => {
    await expect(enablePreview('acme')).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(del).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('deletes the marker and expires the index', async () => {
    signIn();
    await expect(enablePreview('acme')).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith('acme/.disabled');
    expect(updateTag).toHaveBeenCalledWith('client-previews');
    expect(dangerouslyDeleteByTag).not.toHaveBeenCalled();
    expect(invalidateByTag).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('ignores a slug outside [a-z0-9-]', async () => {
    signIn();
    await expect(enablePreview('Bad_Slug')).resolves.toBeUndefined();
    expect(del).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });
});

function blob(pathname: string) {
  const url = `https://store.private.blob.vercel-storage.com/${pathname}`;
  return {
    url,
    downloadUrl: `${url}?download=1`,
    pathname,
    size: 1,
    uploadedAt: new Date('2026-10-01T00:00:00.000Z'),
    etag: `"etag-${pathname}"`,
  };
}

function page(pathnames: string[], cursor?: string) {
  return { blobs: pathnames.map(blob), hasMore: cursor !== undefined, cursor };
}

function photos(count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `heris/img/photo-${String(i).padStart(3, '0')}.webp`,
  );
}

function deletedBatches(): string[][] {
  return vi.mocked(del).mock.calls.map(([batch]) => batch as string[]);
}

function expectCachesExpired() {
  expect(updateTag).toHaveBeenCalledTimes(1);
  expect(updateTag).toHaveBeenCalledWith('client-previews');
  expect(dangerouslyDeleteByTag).toHaveBeenCalledTimes(1);
  expect(dangerouslyDeleteByTag).toHaveBeenCalledWith('client-preview:heris');
}

describe('deletePreview', () => {
  it('deletes nothing without a session', async () => {
    await expect(deletePreview('heris', form({ confirmation: 'heris' }))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/login$/,
    );
    expect(list).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
    expect(dangerouslyDeleteByTag).not.toHaveBeenCalled();
  });

  it.each(['', 'heri', 'Heris', 'heris ', ' heris', 'heris/', 'heris-x'])(
    'deletes nothing when the confirmation is %j',
    async (value) => {
      signIn();
      await expect(deletePreview('heris', form({ confirmation: value }))).resolves.toBeUndefined();
      expect(list).not.toHaveBeenCalled();
      expect(del).not.toHaveBeenCalled();
      expect(updateTag).not.toHaveBeenCalled();
      expect(dangerouslyDeleteByTag).not.toHaveBeenCalled();
    },
  );

  it('deletes nothing without a confirmation field', async () => {
    signIn();
    await expect(deletePreview('heris', new FormData())).resolves.toBeUndefined();
    expect(list).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it('ignores a slug outside [a-z0-9-] even when the confirmation matches', async () => {
    signIn();
    await expect(deletePreview('../x', form({ confirmation: '../x' }))).resolves.toBeUndefined();
    expect(list).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('deletes every blob under <slug>/ across pages in batches, then expires the index and the CDN and goes back to the dashboard', async () => {
    signIn();
    const first = ['heris/index.html', ...photos(119)];
    const second = ['heris/', 'heris/.disabled', 'heris/css/style.css'];
    vi.mocked(list)
      .mockResolvedValueOnce(page(first, 'page-2'))
      .mockResolvedValueOnce(page(second));

    await expect(deletePreview('heris', form({ confirmation: 'heris' }))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin$/,
    );

    expect(list).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenNthCalledWith(1, {
      mode: 'expanded',
      prefix: 'heris/',
      cursor: undefined,
    });
    expect(list).toHaveBeenNthCalledWith(2, {
      mode: 'expanded',
      prefix: 'heris/',
      cursor: 'page-2',
    });
    expect(deletedBatches().map((batch) => batch.length)).toEqual([100, 23]);
    expect(deletedBatches().flat()).toEqual([...first, ...second]);
    expectCachesExpired();
    expect(invalidateByTag).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    const lastDelete = Math.max(...vi.mocked(del).mock.invocationCallOrder);
    expect(vi.mocked(updateTag).mock.invocationCallOrder[0]).toBeGreaterThan(lastDelete);
    expect(vi.mocked(dangerouslyDeleteByTag).mock.invocationCallOrder[0]).toBeGreaterThan(
      lastDelete,
    );
  });

  it('sends no delete when nothing is left under the prefix', async () => {
    signIn();
    vi.mocked(list).mockResolvedValueOnce(page([]));
    await expect(deletePreview('heris', form({ confirmation: 'heris' }))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin$/,
    );
    expect(del).not.toHaveBeenCalled();
    expectCachesExpired();
  });

  it('deletes nothing when listing fails midway, still expires the caches and sends the admin to the retry page', async () => {
    signIn();
    vi.mocked(list)
      .mockResolvedValueOnce(page(['heris/index.html', 'heris/css/style.css'], 'page-2'))
      .mockRejectedValueOnce(new Error('Vercel Blob: store unavailable'));
    await expect(deletePreview('heris', form({ confirmation: 'heris' }))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/heris\?delete=failed$/,
    );
    expect(del).not.toHaveBeenCalled();
    expectCachesExpired();
  });

  it('stops at the first failed batch, still expires the caches and sends the admin to the retry page', async () => {
    signIn();
    const pathnames = photos(250);
    vi.mocked(list).mockResolvedValueOnce(page(pathnames));
    vi.mocked(del)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Vercel Blob: store unavailable'));
    await expect(deletePreview('heris', form({ confirmation: 'heris' }))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/heris\?delete=failed$/,
    );
    expect(deletedBatches()).toEqual([pathnames.slice(0, 100), pathnames.slice(100, 200)]);
    expectCachesExpired();
  });
});
