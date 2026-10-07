import { randomUUID } from 'node:crypto';
import { FakeRedis } from '@/test/mocks/upstash-redis';
import { Redis } from '@upstash/redis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEADS_INDEX_KEY,
  findLead,
  getLeadsRedis,
  insertLead,
  leadKey,
  listLeads,
  removeLead,
  saveLead,
} from './lead-store';
import type { Lead } from './leads';

vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }));

const fake = new FakeRedis();

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: randomUUID(),
    name: 'Padaria',
    website: 'https://padaria.com.br',
    source: 'instagram',
    sourceUrl: null,
    whatsapp: '5511912345678',
    email: null,
    phone: '(11) 3333-4444',
    instagram: 'padaria',
    previewSlug: null,
    nextStep: 'Mandar a prévia',
    dueDate: '2026-10-08',
    notes: null,
    stage: 'prospectado',
    history: [{ stage: 'prospectado', at: '2026-10-01T12:00:00.000Z' }],
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

async function seed(...leads: Lead[]) {
  for (const item of leads) {
    await fake.set(`leads:lead:${item.id}`, item);
    await fake.zadd('leads:index', { score: Date.parse(item.createdAt), member: item.id });
  }
}

beforeEach(() => {
  fake.reset();
  vi.mocked(Redis).mockReset();
  // biome-ignore lint/complexity/useArrowFunction: the store calls new Redis(), and an arrow function cannot be constructed.
  vi.mocked(Redis).mockImplementation(function () {
    return fake;
  } as never);
  vi.stubEnv('KV_REST_API_URL', 'https://example-test.upstash.io');
  vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-10-07T12:00:00.000Z');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('keys', () => {
  it('namespaces records and the index under leads:', () => {
    expect(LEADS_INDEX_KEY).toBe('leads:index');
    expect(leadKey('abc')).toBe('leads:lead:abc');
  });
});

describe('getLeadsRedis', () => {
  it('is null without the URL or the token, and builds no client', () => {
    vi.stubEnv('KV_REST_API_URL', undefined);
    expect(getLeadsRedis()).toBeNull();
    vi.stubEnv('KV_REST_API_URL', 'https://example-test.upstash.io');
    vi.stubEnv('KV_REST_API_TOKEN', undefined);
    expect(getLeadsRedis()).toBeNull();
    expect(Redis).not.toHaveBeenCalled();
  });

  it('builds the client from the KV REST URL and token', () => {
    expect(getLeadsRedis()).toBe(fake);
    expect(Redis).toHaveBeenCalledTimes(1);
    expect(Redis).toHaveBeenCalledWith({
      url: 'https://example-test.upstash.io',
      token: 'test-token',
    });
  });

  it('ignores the UPSTASH_REDIS_REST_* names', () => {
    vi.stubEnv('KV_REST_API_URL', undefined);
    vi.stubEnv('KV_REST_API_TOKEN', undefined);
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example-test.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    expect(getLeadsRedis()).toBeNull();
    expect(Redis).not.toHaveBeenCalled();
  });
});

describe('listLeads', () => {
  it('is unavailable without credentials', async () => {
    vi.stubEnv('KV_REST_API_TOKEN', undefined);
    await expect(listLeads()).resolves.toEqual({ available: false, leads: [] });
  });

  it('is available and empty with an empty index, without calling mget', async () => {
    await expect(listLeads()).resolves.toEqual({ available: true, leads: [] });
  });

  it('returns the records in index-score order', async () => {
    const newer = lead({ name: 'Newer', createdAt: '2026-10-05T00:00:00.000Z' });
    const older = lead({ name: 'Older', createdAt: '2026-10-02T00:00:00.000Z' });
    await seed(newer, older);

    await expect(listLeads()).resolves.toEqual({ available: true, leads: [older, newer] });
  });

  it('skips an index id whose record is gone', async () => {
    const kept = lead();
    await seed(kept);
    await fake.zadd('leads:index', { score: 1, member: randomUUID() });

    await expect(listLeads()).resolves.toEqual({ available: true, leads: [kept] });
  });

  it('is unavailable when Redis fails', async () => {
    await seed(lead());
    vi.spyOn(fake, 'zrange').mockRejectedValueOnce(new Error('WRONGPASS invalid token'));

    await expect(listLeads()).resolves.toEqual({ available: false, leads: [] });
  });
});

describe('findLead', () => {
  it('returns a seeded lead and null for an unknown id', async () => {
    const stored = lead();
    await seed(stored);

    await expect(findLead(stored.id)).resolves.toEqual({ available: true, lead: stored });
    await expect(findLead(randomUUID())).resolves.toEqual({ available: true, lead: null });
  });

  it('is unavailable without credentials or when get fails', async () => {
    const stored = lead();
    await seed(stored);
    vi.spyOn(fake, 'get').mockRejectedValueOnce(new Error('fetch failed'));
    await expect(findLead(stored.id)).resolves.toEqual({ available: false, lead: null });

    vi.stubEnv('KV_REST_API_URL', undefined);
    await expect(findLead(stored.id)).resolves.toEqual({ available: false, lead: null });
  });
});

describe('insertLead', () => {
  it('writes the record and indexes it by createdAt', async () => {
    const created = lead({ createdAt: '2026-10-03T08:15:00.000Z' });

    await insertLead(created);

    expect(fake.record(`leads:lead:${created.id}`)).toEqual(created);
    expect(fake.members('leads:index')).toEqual([[created.id, Date.parse(created.createdAt)]]);
  });

  it('rejects without credentials and writes nothing', async () => {
    vi.stubEnv('KV_REST_API_URL', undefined);
    await expect(insertLead(lead())).rejects.toThrow('Redis indisponível');
    expect(fake.keys()).toEqual([]);
  });
});

describe('saveLead', () => {
  it('overwrites the record and leaves the index alone', async () => {
    const stored = lead();
    await seed(stored);
    const indexBefore = fake.members('leads:index');

    await saveLead({ ...stored, name: 'Padaria Nova', stage: 'contatado' });

    expect(fake.record(`leads:lead:${stored.id}`)).toEqual({
      ...stored,
      name: 'Padaria Nova',
      stage: 'contatado',
    });
    expect(fake.members('leads:index')).toEqual(indexBefore);
  });

  it('rejects without credentials', async () => {
    vi.stubEnv('KV_REST_API_TOKEN', undefined);
    await expect(saveLead(lead())).rejects.toThrow('Redis indisponível');
    expect(fake.keys()).toEqual([]);
  });
});

describe('removeLead', () => {
  it('removes the record and its index entry only', async () => {
    const removed = lead();
    const kept = lead({ createdAt: '2026-10-03T00:00:00.000Z' });
    await seed(removed, kept);

    await removeLead(removed.id);

    expect(fake.record(`leads:lead:${removed.id}`)).toBeUndefined();
    expect(fake.record(`leads:lead:${kept.id}`)).toEqual(kept);
    expect(fake.members('leads:index')).toEqual([[kept.id, Date.parse(kept.createdAt)]]);
  });

  it('rejects without credentials and removes nothing', async () => {
    const stored = lead();
    await seed(stored);
    vi.stubEnv('KV_REST_API_URL', undefined);

    await expect(removeLead(stored.id)).rejects.toThrow('Redis indisponível');
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
  });
});
