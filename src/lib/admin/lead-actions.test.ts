import { randomUUID } from 'node:crypto';
import { FakeRedis } from '@/test/mocks/upstash-redis';
import { Redis } from '@upstash/redis';
import { refresh } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_SESSION_COOKIE, signSession } from './auth';
import { type LeadFormState, createLead, deleteLead, moveLead, updateLead } from './lead-actions';
import { type Lead, isLeadId } from './leads';

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
vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
  updateTag: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('@vercel/functions', () => ({
  addCacheTag: vi.fn(),
  invalidateByTag: vi.fn(),
  dangerouslyDeleteByTag: vi.fn(),
}));
vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }));

const CREDENTIALS = { user: 'luiz', password: 'correct horse battery staple' };
const NOW = '2026-10-07T12:00:00.000Z';
const UNAVAILABLE = 'Não foi possível salvar: o Redis está indisponível.';
const MISSING = 'Este lead não existe mais.';
const PREVIOUS: LeadFormState = { errors: {}, message: null, values: null, attempt: 2 };

const FULL_FORM = {
  name: ' Padaria ',
  website: 'padaria.com.br',
  source: 'instagram',
  sourceUrl: '',
  whatsapp: '(11) 91234-5678',
  email: ' a@b.co ',
  phone: '(11) 3333-4444',
  instagram: '@padaria',
  previewSlug: 'acme',
  nextStep: ' Mandar a prévia ',
  dueDate: '2026-10-07',
  notes: ' Gosta de azul ',
  stage: '',
};

const NORMALIZED = {
  name: 'Padaria',
  website: 'https://padaria.com.br',
  source: 'instagram',
  sourceUrl: null,
  whatsapp: '5511912345678',
  email: 'a@b.co',
  phone: '(11) 3333-4444',
  instagram: 'padaria',
  previewSlug: 'acme',
  nextStep: 'Mandar a prévia',
  dueDate: '2026-10-07',
  notes: 'Gosta de azul',
};

const fake = new FakeRedis();

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

function signIn() {
  jar.set(ADMIN_SESSION_COOKIE, signSession(CREDENTIALS, Date.now() + 60_000));
}

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
  for (const item of leads) {
    await fake.set(`leads:lead:${item.id}`, item);
    await fake.zadd('leads:index', { score: Date.parse(item.createdAt), member: item.id });
  }
}

beforeEach(() => {
  jar.clear();
  fake.reset();
  vi.mocked(Redis).mockReset();
  // biome-ignore lint/complexity/useArrowFunction: the store calls new Redis(), and an arrow function cannot be constructed.
  vi.mocked(Redis).mockImplementation(function () {
    return fake;
  } as never);
  vi.mocked(refresh).mockClear();
  vi.stubEnv('ADMIN_USER', CREDENTIALS.user);
  vi.stubEnv('ADMIN_PASSWORD', CREDENTIALS.password);
  vi.stubEnv('KV_REST_API_URL', 'https://example-test.upstash.io');
  vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('createLead', () => {
  it('writes nothing without a session', async () => {
    await expect(createLead(PREVIOUS, form(FULL_FORM))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/login$/,
    );
    expect(fake.keys()).toEqual([]);
    expect(Redis).not.toHaveBeenCalled();
  });

  it('returns pt-BR field errors with the submitted values and writes nothing', async () => {
    signIn();
    const submitted = { ...FULL_FORM, name: '', email: 'x' };

    await expect(createLead(PREVIOUS, form(submitted))).resolves.toEqual({
      errors: { name: 'Informe o nome do negócio.', email: 'Informe um e-mail válido.' },
      message: null,
      values: submitted,
      attempt: 3,
    });
    expect(fake.keys()).toEqual([]);
  });

  it('stores the normalized lead with its first history entry and goes back to the board', async () => {
    signIn();

    await expect(createLead(PREVIOUS, form(FULL_FORM))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/leads$/,
    );

    const members = fake.members('leads:index');
    expect(members).toHaveLength(1);
    const [[id, score]] = members;
    expect(isLeadId(id)).toBe(true);
    expect(score).toBe(Date.parse(NOW));
    expect(fake.record(`leads:lead:${id}`)).toEqual({
      id,
      ...NORMALIZED,
      stage: 'prospectado',
      history: [{ stage: 'prospectado', at: NOW }],
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it('starts at the chosen stage', async () => {
    signIn();

    await expect(createLead(PREVIOUS, form({ ...FULL_FORM, stage: 'contatado' }))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/leads$/,
    );

    const [[id]] = fake.members('leads:index');
    expect(fake.record(`leads:lead:${id}`)).toMatchObject({
      stage: 'contatado',
      history: [{ stage: 'contatado', at: NOW }],
    });
  });

  it('rejects an unknown stage and writes nothing', async () => {
    signIn();
    const submitted = { ...FULL_FORM, stage: 'ganho' };

    await expect(createLead(PREVIOUS, form(submitted))).resolves.toEqual({
      errors: { stage: 'Escolha uma etapa da lista.' },
      message: null,
      values: submitted,
      attempt: 3,
    });
    expect(fake.keys()).toEqual([]);
  });

  it('reports Redis as unavailable without credentials', async () => {
    signIn();
    vi.stubEnv('KV_REST_API_URL', undefined);

    await expect(createLead(PREVIOUS, form(FULL_FORM))).resolves.toEqual({
      errors: {},
      message: UNAVAILABLE,
      values: FULL_FORM,
      attempt: 3,
    });
    expect(fake.keys()).toEqual([]);
  });

  it('reports Redis as unavailable when the write fails', async () => {
    signIn();
    fake.execError = new Error('fetch failed');

    await expect(createLead(PREVIOUS, form(FULL_FORM))).resolves.toEqual({
      errors: {},
      message: UNAVAILABLE,
      values: FULL_FORM,
      attempt: 3,
    });
    expect(fake.keys()).toEqual([]);
  });
});

describe('updateLead', () => {
  it('changes nothing without a session', async () => {
    const stored = lead();
    await seed(stored);

    await expect(updateLead(stored.id, PREVIOUS, form(FULL_FORM))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/login$/,
    );
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
  });

  it.each(['../x', randomUUID()])(
    'says the lead is gone for id %s and creates no record',
    async (id) => {
      signIn();
      await seed(lead());
      const keysBefore = fake.keys();

      await expect(updateLead(id, PREVIOUS, form(FULL_FORM))).resolves.toEqual({
        errors: {},
        message: MISSING,
        values: FULL_FORM,
        attempt: 3,
      });
      expect(fake.keys()).toEqual(keysBefore);
    },
  );

  it('returns field errors and leaves the record alone', async () => {
    signIn();
    const stored = lead();
    await seed(stored);

    const state = await updateLead(stored.id, PREVIOUS, form({ ...FULL_FORM, phone: '123' }));

    expect(state.errors).toEqual({ phone: 'Informe o telefone com DDD.' });
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
  });

  it('saves the new fields and keeps id, stage, history and createdAt', async () => {
    signIn();
    const stored = lead({
      stage: 'contatado',
      history: [
        { stage: 'prospectado', at: '2026-10-01T12:00:00.000Z' },
        { stage: 'contatado', at: '2026-10-03T12:00:00.000Z' },
      ],
    });
    await seed(stored);

    await expect(updateLead(stored.id, PREVIOUS, form(FULL_FORM))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/leads$/,
    );

    expect(fake.record(`leads:lead:${stored.id}`)).toEqual({
      ...NORMALIZED,
      id: stored.id,
      stage: 'contatado',
      history: stored.history,
      createdAt: stored.createdAt,
      updatedAt: NOW,
    });
  });

  it('reports Redis as unavailable when it cannot read or write', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    vi.spyOn(fake, 'set').mockRejectedValueOnce(new Error('fetch failed'));

    await expect(updateLead(stored.id, PREVIOUS, form(FULL_FORM))).resolves.toMatchObject({
      message: UNAVAILABLE,
    });
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);

    vi.stubEnv('KV_REST_API_TOKEN', undefined);
    await expect(updateLead(stored.id, PREVIOUS, form(FULL_FORM))).resolves.toMatchObject({
      message: UNAVAILABLE,
    });
  });
});

describe('moveLead', () => {
  it('changes nothing without a session', async () => {
    const stored = lead();
    await seed(stored);

    await expect(moveLead(stored.id, form({ stage: 'em-conversa' }))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/login$/,
    );
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('moves the lead, appends the stage change and refreshes the board', async () => {
    signIn();
    const stored = lead();
    await seed(stored);

    await expect(moveLead(stored.id, form({ stage: 'em-conversa' }))).resolves.toBeUndefined();

    expect(fake.record(`leads:lead:${stored.id}`)).toEqual({
      ...stored,
      stage: 'em-conversa',
      history: [...stored.history, { stage: 'em-conversa', at: NOW }],
      updatedAt: NOW,
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['its current stage', 'prospectado', true],
    ['an unknown stage', 'ganho', true],
    ['an id outside the UUID format', 'em-conversa', false],
    ['an unknown id', 'em-conversa', null],
  ])('changes nothing for %s', async (_case, stage, validId) => {
    signIn();
    const stored = lead();
    await seed(stored);
    const id = validId === true ? stored.id : validId === false ? '../x' : randomUUID();

    await expect(moveLead(id, form({ stage }))).resolves.toBeUndefined();

    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
    expect(fake.keys()).toEqual(['leads:index', `leads:lead:${stored.id}`]);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('changes nothing when the form has no stage', async () => {
    signIn();
    const stored = lead();
    await seed(stored);

    await expect(moveLead(stored.id, new FormData())).resolves.toBeUndefined();
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
  });
});

describe('deleteLead', () => {
  it('removes nothing without a session', async () => {
    const stored = lead();
    await seed(stored);

    await expect(deleteLead(stored.id)).rejects.toThrow(/^NEXT_REDIRECT \/admin\/login$/);
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
    expect(fake.members('leads:index')).toHaveLength(1);
  });

  it('removes the record and its index entry, then goes back to the board', async () => {
    signIn();
    const removed = lead();
    const kept = lead({ createdAt: '2026-10-02T00:00:00.000Z' });
    await seed(removed, kept);

    await expect(deleteLead(removed.id)).rejects.toThrow(/^NEXT_REDIRECT \/admin\/leads$/);

    expect(fake.record(`leads:lead:${removed.id}`)).toBeUndefined();
    expect(fake.record(`leads:lead:${kept.id}`)).toEqual(kept);
    expect(fake.members('leads:index')).toEqual([[kept.id, Date.parse(kept.createdAt)]]);
  });

  it('ignores an id outside the UUID format', async () => {
    signIn();
    const stored = lead();
    await seed(stored);

    await expect(deleteLead('../x')).resolves.toBeUndefined();
    expect(Redis).not.toHaveBeenCalled();
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
    expect(fake.members('leads:index')).toHaveLength(1);
  });
});
