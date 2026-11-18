import { describe, expect, it, vi } from 'vitest';
import { AUDIT_MAX_BYTES, AUDIT_MAX_REDIRECTS, analyzeHtml, auditWebsite } from './audit';

const GOOD_HTML = `<!doctype html><html><head><title>Padaria Boa</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Pães frescos">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC12345"></script>
<script>fbq('init','1')</script></head>
<body><h1>Padaria</h1><a href="https://wa.me/5511912345678">Zap</a>
<a href="https://instagram.com/padaria">ig</a><form action="/c"></form></body></html>`;

const resolver = async () => ['93.184.216.34'];

function html(body: string, init: ResponseInit = {}) {
  return new Response(body, { status: 200, headers: { 'content-type': 'text/html' }, ...init });
}

describe('analyzeHtml', () => {
  it('detects every signal on a complete page', () => {
    expect(analyzeHtml(GOOD_HTML)).toEqual({
      responsive: true,
      hasTitle: true,
      hasDescription: true,
      hasH1: true,
      hasWhatsapp: true,
      hasForm: true,
      hasAnalytics: true,
      hasPixel: true,
      instagram: true,
    });
  });

  it('reports nothing on an empty page', () => {
    expect(Object.values(analyzeHtml('<html></html>')).every((value) => value === false)).toBe(
      true,
    );
  });
});

describe('auditWebsite', () => {
  it('audits a reachable page and measures load time', async () => {
    let tick = 0;
    const fetchMock = vi.fn(async (_url: unknown, _init?: RequestInit) => html(GOOD_HTML));
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: fetchMock as never,
      resolver,
      now: () => {
        tick += 500;
        return tick;
      },
    });
    expect(audit).toMatchObject({
      reachable: true,
      https: true,
      statusCode: 200,
      loadTimeMs: 500,
      responsive: true,
      hasWhatsapp: true,
      finalUrl: 'https://padaria.com.br/',
    });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.redirect).toBe('manual');
    expect(init.credentials).toBe('omit');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('flags http-only sites', async () => {
    const audit = await auditWebsite('http://padaria.com.br', {
      fetch: (async () => html(GOOD_HTML)) as never,
      resolver,
    });
    expect(audit.https).toBe(false);
  });

  it('follows redirects and re-validates every hop', async () => {
    const resolveSpy = vi.fn(async (host: string) =>
      host === 'evil.example' ? ['10.0.0.1'] : ['93.184.216.34'],
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: 'https://www.padaria.com.br/' } }),
      )
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'https://evil.example/x' } }),
      );
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: fetchMock as never,
      resolver: resolveSpy,
    });
    expect(audit.reachable).toBe(false);
    expect(audit.error).toMatch(/não público/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(resolveSpy).toHaveBeenCalledWith('evil.example');
  });

  it('resolves relative redirects', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/home' } }))
      .mockResolvedValueOnce(html(GOOD_HTML));
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: fetchMock as never,
      resolver,
    });
    expect(audit.finalUrl).toBe('https://padaria.com.br/home');
  });

  it('stops after the redirect limit', async () => {
    const fetchMock = vi.fn(
      async () => new Response(null, { status: 302, headers: { location: '/loop' } }),
    );
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: fetchMock as never,
      resolver,
    });
    expect(audit.error).toMatch(/Redirecionamentos/);
    expect(fetchMock).toHaveBeenCalledTimes(AUDIT_MAX_REDIRECTS + 1);
  });

  it('refuses private targets without fetching', async () => {
    const fetchMock = vi.fn();
    const audit = await auditWebsite('http://169.254.169.254/', {
      fetch: fetchMock as never,
      resolver,
    });
    expect(audit.reachable).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports HTTP errors as unreachable', async () => {
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: (async () => new Response('x', { status: 503 })) as never,
      resolver,
    });
    expect(audit).toMatchObject({ reachable: false, statusCode: 503, error: 'Resposta HTTP 503.' });
  });

  it('caps the body it reads', async () => {
    const big = `${'a'.repeat(AUDIT_MAX_BYTES)}<meta name="viewport" content="x">`;
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: (async () => html(big)) as never,
      resolver,
    });
    expect(audit.reachable).toBe(true);
    expect(audit.responsive).toBe(false);
  });

  it('handles an empty body', async () => {
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: (async () => new Response(null, { status: 200 })) as never,
      resolver,
    });
    expect(audit).toMatchObject({ reachable: true, responsive: false });
  });

  it('times out when the request is aborted', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const pending = auditWebsite('https://padaria.com.br', { fetch: fetchMock as never, resolver });
    await vi.advanceTimersByTimeAsync(8000);
    await expect(pending).resolves.toMatchObject({ reachable: false, error: 'Tempo esgotado.' });
    vi.useRealTimers();
  });

  it('reports network failures', async () => {
    const audit = await auditWebsite('https://padaria.com.br', {
      fetch: (async () => {
        throw new Error('ECONNREFUSED');
      }) as never,
      resolver,
    });
    expect(audit.error).toBe('ECONNREFUSED');
  });
});
