import { randomUUID } from 'node:crypto';
import { FakeRedis } from '@/test/mocks/upstash-redis';
import { Redis } from '@upstash/redis';
import { del, list, put } from '@vercel/blob';
import { refresh } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_SESSION_COOKIE, SESSION_TTL_MS, signSession } from './auth';
import {
  type LeadFormState,
  type LeadRecordFormState,
  createLead,
  createLeadRecord,
  deleteLead,
  deleteLeadRecord,
  moveLead,
  updateLead,
} from './lead-actions';
import { type Lead, type LeadRecord, isLeadId } from './leads';

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
const RECORD_PREVIOUS: LeadRecordFormState = {
  errors: {},
  message: null,
  values: null,
  attempt: 2,
};

const RECORD_FORM = {
  kind: 'proposta',
  date: '2026-10-06',
  title: ' Proposta enviada ',
  link: 'docs.exemplo.com.br/proposta',
  body: ' Site institucional, R$ 2.500. ',
};

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

function form(fields: Record<string, string>, file?: File): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  if (file) data.set('file', file);
  return data;
}

function pdfFile(body = '%PDF-1.7\n1 0 obj\n', name = 'proposta.pdf'): File {
  return new File([new TextEncoder().encode(body)], name, { type: 'application/pdf' });
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
  cookieStore.set.mockClear();
  fake.reset();
  vi.mocked(Redis).mockReset();
  // biome-ignore lint/complexity/useArrowFunction: the store calls new Redis(), and an arrow function cannot be constructed.
  vi.mocked(Redis).mockImplementation(function () {
    return fake;
  } as never);
  vi.mocked(refresh).mockClear();
  vi.mocked(put).mockReset();
  vi.mocked(put).mockImplementation(async (pathname) => ({ pathname }) as never);
  vi.mocked(del).mockReset();
  vi.mocked(list).mockReset();
  vi.mocked(list).mockResolvedValue({ blobs: [], hasMore: false } as never);
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
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('renews the session', async () => {
    signIn();
    const stored = lead();
    await seed(stored);

    await expect(moveLead(stored.id, form({ stage: 'em-conversa' }))).resolves.toBeUndefined();

    expect(cookieStore.set).toHaveBeenCalledWith(
      ADMIN_SESSION_COOKIE,
      signSession(CREDENTIALS, Date.parse(NOW) + SESSION_TTL_MS),
      expect.objectContaining({ maxAge: SESSION_TTL_MS / 1000 }),
    );
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

  it('deletes every blob under the lead prefix after the Redis transaction', async () => {
    signIn();
    const removed = lead();
    await seed(removed);
    const files = [`_leads/${removed.id}/a.pdf`, `_leads/${removed.id}/b.pdf`];
    let leadGoneBeforeList = false;
    vi.mocked(list).mockImplementationOnce(async () => {
      leadGoneBeforeList = fake.record(`leads:lead:${removed.id}`) === undefined;
      return { blobs: files.map((pathname) => ({ pathname })), hasMore: false } as never;
    });

    await expect(deleteLead(removed.id)).rejects.toThrow(/^NEXT_REDIRECT \/admin\/leads$/);

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ prefix: `_leads/${removed.id}/` }));
    expect(del).toHaveBeenCalledWith(files);
    expect(leadGoneBeforeList).toBe(true);
  });

  it('still goes back to the board when Blob fails', async () => {
    signIn();
    const removed = lead();
    await seed(removed);
    vi.mocked(list).mockRejectedValueOnce(new Error('Blob down'));

    await expect(deleteLead(removed.id)).rejects.toThrow(/^NEXT_REDIRECT \/admin\/leads$/);
    expect(fake.record(`leads:lead:${removed.id}`)).toBeUndefined();
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

describe('createLeadRecord', () => {
  it('writes nothing without a session', async () => {
    const stored = lead();
    await seed(stored);

    await expect(createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM))).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/login$/,
    );
    expect(await fake.hgetall(`leads:records:${stored.id}`)).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each(['../x', randomUUID()])(
    'says the lead is gone for id %s and writes nothing',
    async (id) => {
      signIn();
      await seed(lead());
      const keysBefore = fake.keys();

      await expect(createLeadRecord(id, RECORD_PREVIOUS, form(RECORD_FORM))).resolves.toEqual({
        errors: {},
        message: MISSING,
        values: RECORD_FORM,
        attempt: 3,
      });
      expect(fake.keys()).toEqual(keysBefore);
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  it('returns pt-BR field errors with the typed values and writes nothing', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    const submitted = { ...RECORD_FORM, title: '', link: 'javascript:alert(1)' };

    await expect(createLeadRecord(stored.id, RECORD_PREVIOUS, form(submitted))).resolves.toEqual({
      errors: {
        title: 'Informe um título.',
        link: 'Informe um endereço válido, como exemplo.com.br.',
      },
      message: null,
      values: submitted,
      attempt: 3,
    });
    expect(await fake.hgetall(`leads:records:${stored.id}`)).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('reports Redis as unavailable without credentials', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    vi.stubEnv('KV_REST_API_URL', undefined);

    await expect(createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM))).resolves.toEqual({
      errors: {},
      message: UNAVAILABLE,
      values: RECORD_FORM,
      attempt: 3,
    });
    expect(await fake.hgetall(`leads:records:${stored.id}`)).toBeNull();
  });

  it('reports Redis as unavailable when the write fails', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    vi.spyOn(fake, 'hset').mockRejectedValueOnce(new Error('fetch failed'));

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM)),
    ).resolves.toMatchObject({ message: UNAVAILABLE, values: RECORD_FORM });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('stores the normalized record, refreshes and resets the form', async () => {
    signIn();
    const stored = lead();
    await seed(stored);

    await expect(createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM))).resolves.toEqual({
      errors: {},
      message: null,
      values: null,
      attempt: 3,
    });

    const hash = await fake.hgetall<Record<string, LeadRecord>>(`leads:records:${stored.id}`);
    const [[id, record]] = Object.entries(hash ?? {});
    expect(isLeadId(id)).toBe(true);
    expect(record).toEqual({
      id,
      kind: 'proposta',
      date: '2026-10-06',
      title: 'Proposta enviada',
      body: 'Site institucional, R$ 2.500.',
      link: 'https://docs.exemplo.com.br/proposta',
      attachment: null,
      createdAt: NOW,
    });
    expect(fake.record(`leads:lead:${stored.id}`)).toEqual(stored);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
  });

  it('uploads a PDF to the record path and stores the attachment', async () => {
    signIn();
    const stored = lead();
    await seed(stored);

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM, pdfFile())),
    ).resolves.toMatchObject({ errors: {}, message: null, values: null });

    const hash = await fake.hgetall<Record<string, LeadRecord>>(`leads:records:${stored.id}`);
    const [[id, record]] = Object.entries(hash ?? {});
    const pathname = `_leads/${stored.id}/${id}.pdf`;
    expect(record.attachment).toEqual({
      pathname,
      name: 'proposta.pdf',
      contentType: 'application/pdf',
      size: 17,
    });
    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith(pathname, Buffer.from('%PDF-1.7\n1 0 obj\n'), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/pdf',
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'a file over 4 MB',
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'grande.pdf'),
      'O PDF pode ter no máximo 4 MB.',
    ],
    ['a file that is not a PDF', pdfFile('GIF89a', 'foto.pdf'), 'Envie um arquivo PDF.'],
  ])('rejects %s next to the field errors and stores nothing', async (_case, file, error) => {
    signIn();
    const stored = lead();
    await seed(stored);
    const submitted = { ...RECORD_FORM, title: '' };
    const hset = vi.spyOn(fake, 'hset');

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(submitted, file)),
    ).resolves.toEqual({
      errors: { title: 'Informe um título.', file: error },
      message: null,
      values: submitted,
      attempt: 3,
    });
    expect(put).not.toHaveBeenCalled();
    expect(hset).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('writes nothing to Redis when the upload fails', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    vi.mocked(put).mockRejectedValueOnce(new Error('Blob down'));

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM, pdfFile())),
    ).resolves.toEqual({
      errors: { file: 'Escolha o PDF de novo antes de salvar.' },
      message: 'Não foi possível enviar o PDF. Tente de novo.',
      values: RECORD_FORM,
      attempt: 3,
    });
    expect(await fake.hgetall(`leads:records:${stored.id}`)).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('deletes the uploaded PDF when the Redis write fails', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    vi.spyOn(fake, 'hset').mockRejectedValueOnce(new Error('fetch failed'));

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM, pdfFile())),
    ).resolves.toMatchObject({ message: UNAVAILABLE });

    const [[pathname]] = vi.mocked(put).mock.calls;
    expect(pathname).toMatch(new RegExp(`^_leads/${stored.id}/[0-9a-f-]{36}\\.pdf$`));
    expect(del).toHaveBeenCalledWith(pathname);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('asks for the PDF again when the text fields are rejected', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    const submitted = { ...RECORD_FORM, title: '' };

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(submitted, pdfFile())),
    ).resolves.toMatchObject({
      errors: { title: 'Informe um título.', file: 'Escolha o PDF de novo antes de salvar.' },
    });
    expect(put).not.toHaveBeenCalled();
  });

  it('removes the record and the PDF when the lead is deleted mid-request', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    vi.mocked(put).mockImplementationOnce(async (pathname) => {
      await fake.del(`leads:lead:${stored.id}`);
      return { pathname } as never;
    });

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM, pdfFile())),
    ).resolves.toMatchObject({ message: 'Este lead não existe mais.' });

    expect(await fake.hgetall(`leads:records:${stored.id}`)).toBeNull();
    const [[pathname]] = vi.mocked(put).mock.calls;
    expect(del).toHaveBeenCalledWith(pathname);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('removes a record without a PDF when the lead is deleted mid-request', async () => {
    signIn();
    const stored = lead();
    await seed(stored);
    const hset = fake.hset.bind(fake);
    vi.spyOn(fake, 'hset').mockImplementationOnce(async (key, kv) => {
      await fake.del(`leads:lead:${stored.id}`);
      return hset(key, kv);
    });

    await expect(
      createLeadRecord(stored.id, RECORD_PREVIOUS, form(RECORD_FORM)),
    ).resolves.toMatchObject({ message: 'Este lead não existe mais.' });

    expect(await fake.hgetall(`leads:records:${stored.id}`)).toBeNull();
    expect(del).not.toHaveBeenCalled();
  });
});

describe('deleteLeadRecord', () => {
  async function seedWithRecords() {
    const stored = lead();
    await seed(stored);
    const removed: LeadRecord = {
      id: randomUUID(),
      kind: 'nota',
      date: '2026-10-05',
      title: 'Ligar de novo',
      body: 'Sem resposta.',
      link: null,
      createdAt: '2026-10-05T12:00:00.000Z',
    };
    const kept: LeadRecord = { ...removed, id: randomUUID(), title: 'Briefing' };
    await fake.hset(`leads:records:${stored.id}`, { [removed.id]: removed, [kept.id]: kept });
    return { stored, removed, kept };
  }

  it('removes nothing without a session', async () => {
    const { stored, removed, kept } = await seedWithRecords();

    await expect(deleteLeadRecord(stored.id, removed.id)).rejects.toThrow(
      /^NEXT_REDIRECT \/admin\/login$/,
    );
    expect(await fake.hgetall(`leads:records:${stored.id}`)).toEqual({
      [removed.id]: removed,
      [kept.id]: kept,
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each([
    ['lead id', true],
    ['record id', false],
  ])('ignores a %s outside the UUID format', async (_case, badLead) => {
    signIn();
    const { stored, removed, kept } = await seedWithRecords();

    await expect(
      deleteLeadRecord(badLead ? '../x' : stored.id, badLead ? removed.id : '../x'),
    ).resolves.toBeUndefined();

    expect(Redis).not.toHaveBeenCalled();
    expect(await fake.hgetall(`leads:records:${stored.id}`)).toEqual({
      [removed.id]: removed,
      [kept.id]: kept,
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('removes only that record and refreshes the page', async () => {
    signIn();
    const { stored, removed, kept } = await seedWithRecords();

    await expect(deleteLeadRecord(stored.id, removed.id)).resolves.toBeUndefined();

    expect(await fake.hgetall(`leads:records:${stored.id}`)).toEqual({ [kept.id]: kept });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(del).not.toHaveBeenCalled();
  });

  it('deletes the attachment blob after the record, and survives a Blob failure', async () => {
    signIn();
    const { stored, kept } = await seedWithRecords();
    const withFile: LeadRecord = {
      ...kept,
      id: randomUUID(),
      attachment: {
        pathname: `_leads/${stored.id}/file.pdf`,
        name: 'proposta.pdf',
        contentType: 'application/pdf',
        size: 10,
      },
    };
    await fake.hset(`leads:records:${stored.id}`, { [withFile.id]: withFile });
    let recordGoneBeforeDel = false;
    vi.mocked(del).mockImplementationOnce(async () => {
      recordGoneBeforeDel = (await fake.hget(`leads:records:${stored.id}`, withFile.id)) === null;
      throw new Error('Blob down');
    });

    await expect(deleteLeadRecord(stored.id, withFile.id)).resolves.toBeUndefined();

    expect(del).toHaveBeenCalledWith(`_leads/${stored.id}/file.pdf`);
    expect(recordGoneBeforeDel).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
