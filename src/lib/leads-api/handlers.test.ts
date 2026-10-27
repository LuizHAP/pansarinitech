import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lead, LeadRecord } from '@/lib/admin/leads';
import { FULL_PROPOSAL_INPUT, MINIMAL_PROPOSAL_INPUT } from '@/lib/proposals/fixtures';
import { parseProposal } from '@/lib/proposals/schema';
import { proposalSummary } from '@/lib/proposals/summary';
import { FakeRedis } from '@/test/mocks/upstash-redis';
import { Redis } from '@upstash/redis';
import { del, put } from '@vercel/blob';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProposalApi, listLeadsApi, searchLeads } from './handlers';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));
vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }));

const TOKEN = 'segredo-do-bot';
const NOW = new Date('2026-10-26T15:00:00Z');
const ORIGIN = 'https://example.test';
const fake = new FakeRedis();

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: randomUUID(),
    name: 'Estúdio Exemplo de Pilates',
    website: null,
    source: 'instagram',
    sourceUrl: null,
    whatsapp: '5511912345678',
    email: null,
    phone: null,
    instagram: 'estudioexemplo',
    previewSlug: 'exemplo',
    nextStep: null,
    dueDate: null,
    notes: 'Nota interna',
    stage: 'em-conversa',
    history: [{ stage: 'em-conversa', at: '2026-10-20T12:00:00.000Z' }],
    createdAt: '2026-10-20T12:00:00.000Z',
    updatedAt: '2026-10-20T12:00:00.000Z',
    ...overrides,
  };
}

async function seed(...leads: Lead[]) {
  for (const item of leads) {
    await fake.set(`leads:lead:${item.id}`, item);
    await fake.zadd('leads:index', { score: Date.parse(item.createdAt), member: item.id });
  }
}

function getRequest(query = '', token: string | null = TOKEN): Request {
  return new Request(`${ORIGIN}/api/leads${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function postRequest(leadId: string, body: unknown, query = '', token: string | null = TOKEN) {
  return new Request(`${ORIGIN}/api/leads/${leadId}/proposals${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function storedRecords(leadId: string): Promise<LeadRecord[]> {
  return Object.values(
    (await fake.hgetall<Record<string, LeadRecord>>(`leads:records:${leadId}`)) ?? {},
  );
}

beforeEach(() => {
  fake.reset();
  vi.mocked(Redis).mockReset();
  // biome-ignore lint/complexity/useArrowFunction: the store calls new Redis(), and an arrow function cannot be constructed.
  vi.mocked(Redis).mockImplementation(function () {
    return fake;
  } as never);
  vi.mocked(put).mockReset();
  vi.mocked(put).mockImplementation(async (pathname) => ({ pathname }) as never);
  vi.mocked(del).mockReset();
  vi.stubEnv('LEADS_API_TOKEN', TOKEN);
  vi.stubEnv('KV_REST_API_URL', 'https://example-test.upstash.io');
  vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('searchLeads', () => {
  const leads = [
    lead({ name: 'Padaria' }),
    lead({ name: 'CAFÉ do Bairro' }),
    lead({ name: 'Café Central' }),
  ];

  it('matches case and accent insensitive substrings, sorted by name', () => {
    expect(searchLeads(leads, ' cafe ').map((item) => item.name)).toEqual([
      'Café Central',
      'CAFÉ do Bairro',
    ]);
    expect(searchLeads(leads, 'BAIRRO').map((item) => item.name)).toEqual(['CAFÉ do Bairro']);
  });

  it('returns every lead for an empty query', () => {
    expect(searchLeads(leads, '')).toHaveLength(3);
  });

  it('caps the result at 50 leads', () => {
    const many = Array.from({ length: 60 }, (_, index) => lead({ name: `Lead ${index}` }));
    expect(searchLeads(many, '')).toHaveLength(50);
  });

  it('exposes only id, name, stage, previewSlug and instagram', () => {
    const [item] = searchLeads([leads[0]], '');
    expect(item).toEqual({
      id: leads[0].id,
      name: 'Padaria',
      stage: 'em-conversa',
      previewSlug: 'exemplo',
      instagram: 'estudioexemplo',
    });
  });
});

describe('listLeadsApi', () => {
  it('searches the stored leads by q', async () => {
    await seed(lead({ name: 'Café Central' }), lead({ name: 'Padaria' }));

    const response = await listLeadsApi(getRequest('?q=cafe'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json();
    expect(body.leads.map((item: { name: string }) => item.name)).toEqual(['Café Central']);
  });

  it('lists every lead without q', async () => {
    await seed(lead({ name: 'Café Central' }), lead({ name: 'Padaria' }));
    const body = await (await listLeadsApi(getRequest())).json();
    expect(body.leads).toHaveLength(2);
  });

  it('answers 401 without the token and 404 when the API is off', async () => {
    expect((await listLeadsApi(getRequest('', null))).status).toBe(401);
    vi.stubEnv('LEADS_API_TOKEN', '');
    expect((await listLeadsApi(getRequest())).status).toBe(404);
    expect(Redis).not.toHaveBeenCalled();
  });

  it('answers 503 when Redis is unavailable', async () => {
    vi.stubEnv('KV_REST_API_URL', undefined);
    const response = await listLeadsApi(getRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'unavailable' });
  });
});

describe('createProposalApi', () => {
  it('renders, uploads and files the proposal as a record', { timeout: 60_000 }, async () => {
    const stored = lead();
    await seed(stored);

    const response = await createProposalApi(
      postRequest(stored.id, FULL_PROPOSAL_INPUT),
      stored.id,
      NOW,
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const [record] = await storedRecords(stored.id);
    expect(await response.json()).toEqual({
      record: { id: record.id, title: 'Proposta: Estúdio Exemplo de Pilates' },
      pdfUrl: `${ORIGIN}/admin/leads/${stored.id}/records/${record.id}/file`,
      leadUrl: `${ORIGIN}/admin/leads/${stored.id}`,
    });

    const pathname = `_leads/${stored.id}/${record.id}.pdf`;
    expect(put).toHaveBeenCalledTimes(1);
    const [putPath, bytes, options] = vi.mocked(put).mock.calls[0];
    expect(putPath).toBe(pathname);
    expect(
      Buffer.from(bytes as Buffer)
        .subarray(0, 5)
        .toString('latin1'),
    ).toBe('%PDF-');
    expect(options).toEqual({
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/pdf',
    });

    const parsed = parseProposal(FULL_PROPOSAL_INPUT, NOW);
    if (!parsed.ok) throw new Error('fixture must parse');
    expect(record).toEqual({
      id: record.id,
      kind: 'proposta',
      date: '2026-10-26',
      title: 'Proposta: Estúdio Exemplo de Pilates',
      body: proposalSummary(parsed.proposal),
      link: 'https://pansarini.dev/preview/exemplo',
      attachment: {
        pathname,
        name: 'proposta-estudio-exemplo-de-pilates-2026-10-26.pdf',
        contentType: 'application/pdf',
        size: (bytes as Buffer).length,
      },
      createdAt: NOW.toISOString(),
    });
  });

  it('uses the input title and a null link without previewUrl', { timeout: 60_000 }, async () => {
    const stored = lead();
    await seed(stored);

    const response = await createProposalApi(
      postRequest(stored.id, { ...MINIMAL_PROPOSAL_INPUT, title: 'Proposta revisada' }),
      stored.id,
      NOW,
    );

    expect(response.status).toBe(201);
    const [record] = await storedRecords(stored.id);
    expect(record).toMatchObject({ title: 'Proposta revisada', link: null });
  });

  it('returns the PDF and writes nothing on dryRun=1', { timeout: 60_000 }, async () => {
    const stored = lead();
    await seed(stored);
    const hset = vi.spyOn(fake, 'hset');

    const response = await createProposalApi(
      postRequest(stored.id, MINIMAL_PROPOSAL_INPUT, '?dryRun=1'),
      stored.id,
      NOW,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'filename="proposta-estudio-exemplo-de-pilates-2026-10-26.pdf"',
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    const pdf = Buffer.from(await response.arrayBuffer());
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(put).not.toHaveBeenCalled();
    expect(hset).not.toHaveBeenCalled();
  });

  it('answers 502 and stores no record when the upload fails', { timeout: 60_000 }, async () => {
    const stored = lead();
    await seed(stored);
    vi.mocked(put).mockRejectedValueOnce(new Error('Blob down'));

    const response = await createProposalApi(
      postRequest(stored.id, MINIMAL_PROPOSAL_INPUT),
      stored.id,
      NOW,
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'upload_failed' });
    expect(await storedRecords(stored.id)).toEqual([]);
  });

  it(
    'deletes the blob and answers 503 when the record write fails',
    { timeout: 60_000 },
    async () => {
      const stored = lead();
      await seed(stored);
      vi.spyOn(fake, 'hset').mockRejectedValueOnce(new Error('fetch failed'));

      const response = await createProposalApi(
        postRequest(stored.id, MINIMAL_PROPOSAL_INPUT),
        stored.id,
        NOW,
      );

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'unavailable' });
      const [[pathname]] = vi.mocked(put).mock.calls;
      expect(del).toHaveBeenCalledWith(pathname);
    },
  );

  it('answers 400 with dot paths and touches neither Redis nor Blob', async () => {
    const stored = lead();
    const response = await createProposalApi(
      postRequest(stored.id, { ...MINIMAL_PROPOSAL_INPUT, options: [] }),
      stored.id,
      NOW,
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({
      errors: [{ path: 'options', message: 'Inclua de 1 a 3 opções.' }],
    });
    expect(Redis).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('answers 400 for malformed JSON and 413 for an oversized body', async () => {
    const id = randomUUID();
    const malformed = await createProposalApi(postRequest(id, '{"clientName":'), id, NOW);
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ errors: [{ path: '', message: 'JSON inválido.' }] });

    const huge = JSON.stringify({ ...MINIMAL_PROPOSAL_INPUT, tagline: 'x'.repeat(300_000) });
    const tooLarge = await createProposalApi(postRequest(id, huge), id, NOW);
    expect(tooLarge.status).toBe(413);
    expect(await tooLarge.json()).toEqual({ error: 'payload_too_large' });
  });

  it.each([
    ['an id outside the UUID format', '../x'],
    ['an unknown lead', randomUUID()],
  ])('answers 404 lead_not_found for %s', async (_case, id) => {
    const response = await createProposalApi(postRequest(id, MINIMAL_PROPOSAL_INPUT), id, NOW);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'lead_not_found' });
    expect(put).not.toHaveBeenCalled();
  });

  it('answers 503 when Redis is unavailable', async () => {
    const id = randomUUID();
    vi.stubEnv('KV_REST_API_TOKEN', undefined);
    const response = await createProposalApi(postRequest(id, MINIMAL_PROPOSAL_INPUT), id, NOW);
    expect(response.status).toBe(503);
  });

  it('checks the token before reading the body', async () => {
    const id = randomUUID();
    const unauthorized = await createProposalApi(postRequest(id, '{', '', 'errado'), id, NOW);
    expect(unauthorized.status).toBe(401);

    vi.stubEnv('LEADS_API_TOKEN', undefined);
    const off = await createProposalApi(postRequest(id, MINIMAL_PROPOSAL_INPUT), id, NOW);
    expect(off.status).toBe(404);
    expect(await off.json()).toEqual({ error: 'not_found' });
  });

  it('defaults the record date to today', { timeout: 60_000 }, async () => {
    const stored = lead();
    await seed(stored);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    try {
      const response = await createProposalApi(
        postRequest(stored.id, MINIMAL_PROPOSAL_INPUT),
        stored.id,
      );
      expect(response.status).toBe(201);
    } finally {
      vi.useRealTimers();
    }
    const [record] = await storedRecords(stored.id);
    expect(record.date).toBe('2026-10-26');
    expect(record.createdAt).toBe(NOW.toISOString());
  });
});

describe('docs/leads-api.md', () => {
  it('ships an example payload that the schema accepts', () => {
    const doc = readFileSync(join(process.cwd(), 'docs', 'leads-api.md'), 'utf8');
    const block = doc.match(/```json\n([\s\S]*?)\n```/)?.[1];
    expect(block).toBeDefined();
    const result = parseProposal(JSON.parse(block ?? ''), NOW);
    expect(result.ok).toBe(true);
    expect(JSON.parse(block ?? '')).toEqual(FULL_PROPOSAL_INPUT);
  });
});
