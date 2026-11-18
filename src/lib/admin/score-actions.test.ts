import { randomUUID } from 'node:crypto';
import { FakeRedis } from '@/test/mocks/upstash-redis';
import { Redis } from '@upstash/redis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_SESSION_COOKIE, signSession } from './auth';
import type { Lead } from './leads';
import { scoreLeadAction, scoreLeadsAction } from './score-actions';

const { jar, cookieStore, analyze } = vi.hoisted(() => {
  const jar = new Map<string, string>();
  const cookieStore = {
    get: vi.fn((name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined)),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return { jar, cookieStore, analyze: vi.fn() };
});

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));
vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }));
vi.mock('@/lib/crm/scoring/analyze', () => ({ analyzeLead: analyze }));

const CREDENTIALS = { user: 'luiz', password: 'correct horse battery staple' };
const fake = new FakeRedis();
const SCORE = {
  value: 80,
  priority: 'alta',
  signals: { semSite: true },
  reasons: ['Sem site'],
  suggestedMessage: 'Oi',
  analyzedAt: '2026-11-18T12:00:00.000Z',
  engine: 'local',
};

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: randomUUID(),
    name: 'Oficina',
    website: null,
    source: 'google-maps',
    sourceUrl: null,
    whatsapp: null,
    email: null,
    phone: null,
    instagram: null,
    previewSlug: null,
    nextStep: null,
    dueDate: null,
    notes: null,
    stage: 'prospectado',
    history: [{ stage: 'prospectado', at: '2026-10-01T12:00:00.000Z' }],
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

async function seed(...leads: Lead[]) {
  for (const item of leads) await fake.set(`leads:lead:${item.id}`, item);
}

async function stored(id: string): Promise<Lead | null> {
  return fake.get<Lead>(`leads:lead:${id}`);
}

beforeEach(() => {
  jar.clear();
  fake.reset();
  analyze.mockReset();
  analyze.mockResolvedValue(SCORE);
  vi.mocked(Redis).mockReset();
  // biome-ignore lint/complexity/useArrowFunction: the store calls new Redis(), and an arrow function cannot be constructed.
  vi.mocked(Redis).mockImplementation(function () {
    return fake;
  } as never);
  vi.stubEnv('ADMIN_USER', CREDENTIALS.user);
  vi.stubEnv('ADMIN_PASSWORD', CREDENTIALS.password);
  vi.stubEnv('KV_REST_API_URL', 'https://example-test.upstash.io');
  vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
  jar.set(ADMIN_SESSION_COOKIE, signSession(CREDENTIALS, Date.now() + 60_000));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('scoreLeadAction', () => {
  it('requires a session and writes nothing without one', async () => {
    jar.clear();
    const item = lead();
    await seed(item);
    await expect(scoreLeadAction(item.id)).rejects.toThrow(/NEXT_REDIRECT \/admin\/login/);
    expect(analyze).not.toHaveBeenCalled();
    expect((await stored(item.id))?.extras).toBeUndefined();
  });

  it('stores the score in extras and leaves every other field untouched', async () => {
    const item = lead({ extras: { category: 'Oficina', city: 'Campinas' }, notes: 'ligar' });
    await seed(item);
    await expect(scoreLeadAction(item.id)).resolves.toEqual({
      id: item.id,
      ok: true,
      score: SCORE,
    });
    expect(await stored(item.id)).toEqual({
      ...item,
      extras: { category: 'Oficina', city: 'Campinas', score: SCORE },
    });
  });

  it('keeps edits made while the analysis ran', async () => {
    const item = lead();
    await seed(item);
    analyze.mockImplementation(async () => {
      await seed({ ...item, notes: 'editado no meio' });
      return SCORE;
    });
    await scoreLeadAction(item.id);
    expect((await stored(item.id))?.notes).toBe('editado no meio');
  });

  it('rejects malformed, missing and unavailable leads', async () => {
    await expect(scoreLeadAction('x')).resolves.toMatchObject({
      ok: false,
      error: 'Este lead não existe mais.',
    });
    await expect(scoreLeadAction(randomUUID())).resolves.toMatchObject({
      ok: false,
      error: 'Este lead não existe mais.',
    });
    vi.stubEnv('KV_REST_API_URL', '');
    await expect(scoreLeadAction(randomUUID())).resolves.toMatchObject({
      ok: false,
      error: 'O Redis está indisponível.',
    });
  });

  it('reports an analysis failure without writing', async () => {
    const item = lead();
    await seed(item);
    analyze.mockRejectedValue(new Error('boom'));
    await expect(scoreLeadAction(item.id)).resolves.toMatchObject({ ok: false });
    expect((await stored(item.id))?.extras).toBeUndefined();
  });

  it('reports a lead deleted during the analysis', async () => {
    const item = lead();
    await seed(item);
    analyze.mockImplementation(async () => {
      await fake.del(`leads:lead:${item.id}`);
      return SCORE;
    });
    await expect(scoreLeadAction(item.id)).resolves.toMatchObject({
      ok: false,
      error: 'Este lead não existe mais.',
    });
  });
});

describe('scoreLeadsAction', () => {
  it('caps the batch, returns the remainder and bounds concurrency to 3', async () => {
    const items = Array.from({ length: 12 }, () => lead());
    await seed(...items);
    let active = 0;
    let peak = 0;
    analyze.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return SCORE;
    });

    const ids = items.map((item) => item.id);
    const { results, remaining } = await scoreLeadsAction([...ids, ids[0] as string]);
    expect(results).toHaveLength(10);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.map((result) => result.id)).toEqual(ids.slice(0, 10));
    expect(remaining).toEqual(ids.slice(10));
    expect(peak).toBe(3);
    expect((await stored(ids[11] as string))?.extras).toBeUndefined();
  });

  it('keeps going when one lead fails', async () => {
    const [a, b] = [lead(), lead()];
    await seed(a, b);
    analyze.mockRejectedValueOnce(new Error('boom'));
    const { results } = await scoreLeadsAction([a.id, b.id]);
    expect(results.map((result) => result.ok)).toEqual([false, true]);
  });

  it('handles an empty list', async () => {
    await expect(scoreLeadsAction([])).resolves.toEqual({ results: [], remaining: [] });
  });
});
