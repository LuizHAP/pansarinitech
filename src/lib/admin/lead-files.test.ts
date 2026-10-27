import { randomUUID } from 'node:crypto';
import { FakeRedis } from '@/test/mocks/upstash-redis';
import { Redis } from '@upstash/redis';
import { del, get, list, put } from '@vercel/blob';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signSession } from './auth';
import {
  MAX_RECORD_PDF_BYTES,
  contentDisposition,
  deleteLeadFiles,
  deleteRecordFile,
  isPdfBytes,
  leadFilesPrefix,
  readPdfUpload,
  recordFilePath,
  safeAttachmentName,
  serveRecordFile,
  uploadRecordPdf,
} from './lead-files';
import type { LeadRecord } from './leads';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));
vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }));

const CREDENTIALS = { user: 'luiz', password: 'correct horse battery staple' };
const fake = new FakeRedis();

function pdfFile(body = '%PDF-1.7\n1 0 obj\n', name = 'proposta.pdf'): File {
  return new File([new TextEncoder().encode(body)], name, { type: 'application/pdf' });
}

function record(leadId: string, overrides: Partial<LeadRecord> = {}): LeadRecord {
  const id = randomUUID();
  return {
    id,
    kind: 'proposta',
    date: '2026-10-26',
    title: 'Proposta',
    body: 'Opções.',
    link: null,
    createdAt: '2026-10-26T12:00:00.000Z',
    attachment: {
      pathname: recordFilePath(leadId, id),
      name: 'Proposta Estúdio "Exemplo".pdf',
      contentType: 'application/pdf',
      size: 1234,
    },
    ...overrides,
  };
}

function session(offsetMs = 60_000): string {
  return signSession(CREDENTIALS, Date.now() + offsetMs);
}

function blobStream(text: string): ReadableStream<Uint8Array> {
  return new Response(text).body as ReadableStream<Uint8Array>;
}

beforeEach(() => {
  fake.reset();
  vi.mocked(Redis).mockReset();
  // biome-ignore lint/complexity/useArrowFunction: the store calls new Redis(), and an arrow function cannot be constructed.
  vi.mocked(Redis).mockImplementation(function () {
    return fake;
  } as never);
  vi.mocked(get).mockReset();
  vi.mocked(list).mockReset();
  vi.mocked(put).mockReset();
  vi.mocked(del).mockReset();
  vi.stubEnv('ADMIN_USER', CREDENTIALS.user);
  vi.stubEnv('ADMIN_PASSWORD', CREDENTIALS.password);
  vi.stubEnv('KV_REST_API_URL', 'https://example-test.upstash.io');
  vi.stubEnv('KV_REST_API_TOKEN', 'test-token');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('paths', () => {
  it('keeps every lead file under _leads/<leadId>/', () => {
    expect(leadFilesPrefix('abc')).toBe('_leads/abc/');
    expect(recordFilePath('abc', 'def')).toBe('_leads/abc/def.pdf');
  });
});

describe('isPdfBytes', () => {
  it('checks the %PDF- magic bytes', () => {
    expect(isPdfBytes(new TextEncoder().encode('%PDF-1.4'))).toBe(true);
    expect(isPdfBytes(new TextEncoder().encode('%PDF'))).toBe(false);
    expect(isPdfBytes(new TextEncoder().encode('GIF89a'))).toBe(false);
  });
});

describe('safeAttachmentName', () => {
  it.each([
    ['proposta.pdf', 'proposta.pdf'],
    ['C:\\Users\\x\\proposta final.PDF', 'proposta final.pdf'],
    ['../../etc/passwd', 'passwd.pdf'],
    ['a"b\r\nc.pdf', 'abc.pdf'],
    ['  muitos   espaços  .pdf', 'muitos espaços.pdf'],
    ['', 'documento.pdf'],
    ['"\r\n', 'documento.pdf'],
    ['.pdf', 'documento.pdf'],
  ])('turns %j into %j', (raw, expected) => {
    expect(safeAttachmentName(raw, 'documento.pdf')).toBe(expected);
  });

  it('caps the name at 120 characters with the .pdf suffix', () => {
    const name = safeAttachmentName(`${'a'.repeat(200)}.pdf`, 'documento.pdf');
    expect(name).toHaveLength(120);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('never splits an emoji at the cap, so the header can still encode it', () => {
    const name = safeAttachmentName(`${'a'.repeat(115)}😀😀.pdf`, 'documento.pdf');
    expect(name).toBe(`${'a'.repeat(115)}😀.pdf`);
    expect(() => contentDisposition(name)).not.toThrow();
  });
});

describe('contentDisposition', () => {
  it('sends an ASCII fallback and the UTF-8 name', () => {
    expect(contentDisposition('Proposta Estúdio (1).pdf')).toBe(
      `inline; filename="Proposta Estudio (1).pdf"; filename*=UTF-8''Proposta%20Est%C3%BAdio%20%281%29.pdf`,
    );
  });

  it('strips quotes, backslashes and line breaks', () => {
    expect(contentDisposition('a"b\\c\r\nd 東.pdf')).toBe(
      `inline; filename="abcd _.pdf"; filename*=UTF-8''abcd%20%E6%9D%B1.pdf`,
    );
  });
});

describe('readPdfUpload', () => {
  it.each([
    ['null', null],
    ['a string', 'proposta.pdf'],
    ['an empty file input', new File([], '')],
  ])('treats %s as no upload', async (_case, value) => {
    await expect(readPdfUpload(value)).resolves.toEqual({ ok: true, upload: null });
  });

  it('rejects a file over 4 MB without reading it', async () => {
    const file = new File([new Uint8Array(MAX_RECORD_PDF_BYTES + 1)], 'grande.pdf');
    const arrayBuffer = vi.spyOn(file, 'arrayBuffer');
    await expect(readPdfUpload(file)).resolves.toEqual({
      ok: false,
      error: 'O PDF pode ter no máximo 4 MB.',
    });
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it.each([
    ['a GIF', pdfFile('GIF89a...', 'foto.pdf')],
    ['a 3-byte file', pdfFile('%PD', 'curto.pdf')],
    ['a named empty file', new File([], 'vazio.pdf')],
  ])('rejects %s', async (_case, file) => {
    await expect(readPdfUpload(file)).resolves.toEqual({
      ok: false,
      error: 'Envie um arquivo PDF.',
    });
  });

  it('accepts a PDF up to exactly 4 MB with a sanitized name', async () => {
    const result = await readPdfUpload(pdfFile('%PDF-1.7\n', 'C:\\docs\\Proposta "final"'));
    expect(result).toEqual({
      ok: true,
      upload: {
        bytes: Buffer.from('%PDF-1.7\n'),
        name: 'Proposta final.pdf',
        size: 9,
      },
    });

    const limit = new Uint8Array(MAX_RECORD_PDF_BYTES);
    limit.set(new TextEncoder().encode('%PDF-'));
    const full = await readPdfUpload(new File([limit], 'limite.pdf'));
    expect(full.ok && full.upload?.size).toBe(MAX_RECORD_PDF_BYTES);
  });
});

describe('uploadRecordPdf', () => {
  it('puts the PDF at the record path without a random suffix or overwrite', async () => {
    const leadId = randomUUID();
    const recordId = randomUUID();
    const bytes = Buffer.from('%PDF-1.7');
    vi.mocked(put).mockResolvedValue({ pathname: recordFilePath(leadId, recordId) } as never);

    await expect(
      uploadRecordPdf(leadId, recordId, { bytes, name: 'proposta.pdf', size: 8 }),
    ).resolves.toEqual({
      pathname: `_leads/${leadId}/${recordId}.pdf`,
      name: 'proposta.pdf',
      contentType: 'application/pdf',
      size: 8,
    });
    expect(put).toHaveBeenCalledWith(`_leads/${leadId}/${recordId}.pdf`, bytes, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/pdf',
    });
  });

  it('lets a Blob failure reach the caller', async () => {
    vi.mocked(put).mockRejectedValue(new Error('Blob down'));
    await expect(
      uploadRecordPdf(randomUUID(), randomUUID(), {
        bytes: Buffer.from('%PDF-'),
        name: 'a.pdf',
        size: 5,
      }),
    ).rejects.toThrow('Blob down');
  });
});

describe('deleteRecordFile', () => {
  it('deletes the blob and swallows failures', async () => {
    await deleteRecordFile('_leads/a/b.pdf');
    expect(del).toHaveBeenCalledWith('_leads/a/b.pdf');

    vi.mocked(del).mockRejectedValueOnce(new Error('Blob down'));
    await expect(deleteRecordFile('_leads/a/b.pdf')).resolves.toBeUndefined();
  });
});

describe('deleteLeadFiles', () => {
  function page(count: number, offset: number, cursor?: string) {
    return {
      blobs: Array.from({ length: count }, (_, index) => ({
        pathname: `_leads/x/${offset + index}.pdf`,
      })),
      cursor,
      hasMore: cursor !== undefined,
    } as never;
  }

  it('pages through the prefix and deletes in batches of 100', async () => {
    const leadId = randomUUID();
    vi.mocked(list)
      .mockResolvedValueOnce(page(150, 0, 'next'))
      .mockResolvedValueOnce(page(60, 150));

    await deleteLeadFiles(leadId);

    expect(list).toHaveBeenNthCalledWith(1, {
      mode: 'expanded',
      prefix: `_leads/${leadId}/`,
      cursor: undefined,
    });
    expect(list).toHaveBeenNthCalledWith(2, {
      mode: 'expanded',
      prefix: `_leads/${leadId}/`,
      cursor: 'next',
    });
    expect(vi.mocked(del).mock.calls.map(([batch]) => batch.length)).toEqual([100, 100, 10]);
    expect(vi.mocked(del).mock.calls[2][0]).toContain('_leads/x/209.pdf');
  });

  it('deletes nothing when the lead has no files', async () => {
    vi.mocked(list).mockResolvedValueOnce(page(0, 0));
    await deleteLeadFiles(randomUUID());
    expect(del).not.toHaveBeenCalled();
  });

  it('swallows list and del failures and keeps deleting the other batches', async () => {
    vi.mocked(list).mockRejectedValueOnce(new Error('Blob down'));
    await expect(deleteLeadFiles(randomUUID())).resolves.toBeUndefined();
    expect(del).not.toHaveBeenCalled();

    vi.mocked(list).mockResolvedValueOnce(page(150, 0));
    vi.mocked(del).mockRejectedValueOnce(new Error('Blob down'));
    await expect(deleteLeadFiles(randomUUID())).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledTimes(2);
  });

  it('still deletes the pages listed before a later page fails', async () => {
    vi.mocked(list)
      .mockResolvedValueOnce(page(3, 0, 'next'))
      .mockRejectedValueOnce(new Error('Blob down'));
    await deleteLeadFiles(randomUUID());
    expect(del).toHaveBeenCalledWith(['_leads/x/0.pdf', '_leads/x/1.pdf', '_leads/x/2.pdf']);
  });
});

describe('serveRecordFile', () => {
  async function seeded() {
    const leadId = randomUUID();
    const stored = record(leadId);
    await fake.hset(`leads:records:${leadId}`, { [stored.id]: stored });
    return { leadId, stored };
  }

  async function expectNotFound(response: Response) {
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toBe('Not found');
  }

  it('streams the PDF inline with private, no-store and nosniff', async () => {
    const { leadId, stored } = await seeded();
    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: blobStream('%PDF-1.7 body'),
      blob: { contentType: 'application/octet-stream' },
    } as never);

    const response = await serveRecordFile(leadId, stored.id, session());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      `inline; filename="Proposta Estudio Exemplo.pdf"; filename*=UTF-8''Proposta%20Est%C3%BAdio%20Exemplo.pdf`,
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(await response.text()).toBe('%PDF-1.7 body');
    expect(get).toHaveBeenCalledWith(stored.attachment?.pathname, { access: 'private' });
  });

  it.each([
    ['a missing cookie', () => undefined],
    ['a bad signature', () => `${Date.now() + 60_000}.forged`],
    ['an expired session', () => session(-1)],
  ])('answers 404 for %s', async (_case, token) => {
    const { leadId, stored } = await seeded();
    await expectNotFound(await serveRecordFile(leadId, stored.id, token()));
    expect(get).not.toHaveBeenCalled();
  });

  it('answers 404 when the admin is not configured', async () => {
    const { leadId, stored } = await seeded();
    const token = session();
    vi.stubEnv('ADMIN_PASSWORD', undefined);
    await expectNotFound(await serveRecordFile(leadId, stored.id, token));
  });

  it('answers 404 for ids outside the UUID format', async () => {
    const { leadId, stored } = await seeded();
    await expectNotFound(await serveRecordFile('../x', stored.id, session()));
    await expectNotFound(await serveRecordFile(leadId, '../x', session()));
    expect(Redis).not.toHaveBeenCalled();
  });

  it('answers 404 for a missing record or a record without attachment', async () => {
    const { leadId } = await seeded();
    await expectNotFound(await serveRecordFile(leadId, randomUUID(), session()));

    const plain = record(leadId, { attachment: undefined });
    const nulled = record(leadId, { attachment: null });
    await fake.hset(`leads:records:${leadId}`, { [plain.id]: plain, [nulled.id]: nulled });
    await expectNotFound(await serveRecordFile(leadId, plain.id, session()));
    await expectNotFound(await serveRecordFile(leadId, nulled.id, session()));
    expect(get).not.toHaveBeenCalled();
  });

  it('answers 404 for an attachment stored outside the lead prefix', async () => {
    const leadId = randomUUID();
    const stored = record(leadId);
    const outside = {
      ...stored,
      attachment: { ...stored.attachment, pathname: 'acme/index.html' },
    } as LeadRecord;
    await fake.hset(`leads:records:${leadId}`, { [stored.id]: outside });

    await expectNotFound(await serveRecordFile(leadId, stored.id, session()));
    expect(get).not.toHaveBeenCalled();
  });

  it('answers 404 when the blob is gone or Blob fails', async () => {
    const { leadId, stored } = await seeded();
    vi.mocked(get).mockResolvedValueOnce(null);
    await expectNotFound(await serveRecordFile(leadId, stored.id, session()));

    vi.mocked(get).mockRejectedValueOnce(new Error('Blob down'));
    await expectNotFound(await serveRecordFile(leadId, stored.id, session()));
  });

  it('answers 503 when Redis is unavailable', async () => {
    const { leadId, stored } = await seeded();
    vi.spyOn(fake, 'hget').mockRejectedValueOnce(new Error('fetch failed'));

    const response = await serveRecordFile(leadId, stored.id, session());

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
