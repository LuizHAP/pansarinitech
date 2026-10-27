import { describe, expect, it, vi } from 'vitest';
import { authorizeLeadsApi, jsonResponse, pdfResponse, readJsonBody } from './http';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));
vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn(), del: vi.fn() }));

const ENV = { LEADS_API_TOKEN: 'segredo-do-bot' } as unknown as NodeJS.ProcessEnv;

function request(headers: Record<string, string> = {}, body?: string): Request {
  return new Request('https://example.test/api/leads', {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body,
  });
}

describe('authorizeLeadsApi', () => {
  it.each([undefined, ''])('hides the API as 404 when the token is %j', async (token) => {
    const response = authorizeLeadsApi(request({ Authorization: 'Bearer segredo-do-bot' }), {
      LEADS_API_TOKEN: token,
    } as unknown as NodeJS.ProcessEnv);
    expect(response?.status).toBe(404);
    expect(await response?.json()).toEqual({ error: 'not_found' });
    expect(response?.headers.get('Cache-Control')).toBe('no-store');
  });

  it.each([
    ['no header', {}],
    ['another scheme', { Authorization: 'Basic segredo-do-bot' }],
    ['a wrong token', { Authorization: 'Bearer outro' }],
    ['an empty bearer', { Authorization: 'Bearer ' }],
  ])('answers 401 for %s', async (_case, headers) => {
    const response = authorizeLeadsApi(request(headers), ENV);
    expect(response?.status).toBe(401);
    expect(response?.headers.get('WWW-Authenticate')).toBe('Bearer');
    expect(response?.headers.get('Cache-Control')).toBe('no-store');
    expect(await response?.json()).toEqual({ error: 'unauthorized' });
  });

  it.each(['Bearer segredo-do-bot', 'bearer segredo-do-bot', 'BEARER  segredo-do-bot '])(
    'lets %j through',
    (header) => {
      expect(authorizeLeadsApi(request({ Authorization: header }), ENV)).toBeNull();
    },
  );

  it('reads process.env by default', () => {
    vi.stubEnv('LEADS_API_TOKEN', 'do-ambiente');
    expect(authorizeLeadsApi(request({ Authorization: 'Bearer do-ambiente' }))).toBeNull();
    vi.unstubAllEnvs();
  });
});

describe('jsonResponse', () => {
  it('serializes the body with no-store and extra headers', async () => {
    const response = jsonResponse({ ok: 1 }, 201, { 'X-Extra': 'sim' });
    expect(response.status).toBe(201);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Extra')).toBe('sim');
    expect(await response.json()).toEqual({ ok: 1 });
  });
});

describe('pdfResponse', () => {
  it('sends the PDF inline, private and nosniff', async () => {
    const response = pdfResponse(Buffer.from('%PDF-1.7'), 'proposta-estúdio.pdf');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe(
      `inline; filename="proposta-estudio.pdf"; filename*=UTF-8''proposta-est%C3%BAdio.pdf`,
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(await response.text()).toBe('%PDF-1.7');
  });
});

describe('readJsonBody', () => {
  it('parses a JSON body', async () => {
    await expect(readJsonBody(request({}, '{"a":[1,2]}'))).resolves.toEqual({
      ok: true,
      value: { a: [1, 2] },
    });
  });

  it('answers 413 from Content-Length before reading', async () => {
    const body = request({ 'Content-Length': '300000' }, '{}');
    const result = await readJsonBody(body);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(413);
    expect(await result.response.json()).toEqual({ error: 'payload_too_large' });
    expect(body.bodyUsed).toBe(false);
  });

  it('stops reading a chunked body without Content-Length once it passes the cap', async () => {
    let pulls = 0;
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(16));
      },
      cancel,
    });
    const chunked = new Request('https://example.test/api/leads', {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit);

    const result = await readJsonBody(chunked, 64);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(413);
    expect(cancel).toHaveBeenCalled();
    expect(pulls).toBeLessThan(10);
  });

  it('answers 400 when there is no body at all', async () => {
    const result = await readJsonBody(request());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
  });

  it('answers 413 when the body read is over the cap', async () => {
    const result = await readJsonBody(request({}, JSON.stringify({ a: 'é'.repeat(20) })), 32);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(413);
  });

  it('answers 400 for malformed JSON', async () => {
    const result = await readJsonBody(request({}, '{"a":'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    expect(result.response.headers.get('Cache-Control')).toBe('no-store');
    expect(await result.response.json()).toEqual({
      errors: [{ path: '', message: 'JSON inválido.' }],
    });
  });
});
