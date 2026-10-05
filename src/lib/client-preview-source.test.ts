import { type GetBlobResult, get } from '@vercel/blob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findClientPreview,
  isSafePreviewPath,
  parsePreviewMeta,
  servePreviewAsset,
} from './client-preview-source';

vi.mock('@vercel/blob', () => ({ get: vi.fn() }));

const blobBase = {
  url: 'https://store.private.blob.vercel-storage.com/x',
  downloadUrl: 'https://store.private.blob.vercel-storage.com/x?download=1',
  pathname: 'x',
  contentDisposition: 'inline',
  cacheControl: 'public, max-age=60',
  uploadedAt: new Date('2026-10-05T00:00:00Z'),
};

function found(body: string, contentType = 'text/html', etag = '"etag-1"'): GetBlobResult {
  return {
    statusCode: 200,
    stream: new Response(body).body,
    headers: new Headers(),
    blob: { ...blobBase, etag, contentType, size: body.length },
  } as unknown as GetBlobResult;
}

function notModified(etag: string): GetBlobResult {
  return {
    statusCode: 304,
    stream: null,
    headers: new Headers(),
    blob: { ...blobBase, etag, contentType: null, size: null },
  } as unknown as GetBlobResult;
}

beforeEach(() => {
  vi.mocked(get).mockReset();
});

describe('parsePreviewMeta', () => {
  it('reads the client name and Portuguese from the Héris page', () => {
    const html =
      '<!doctype html><html lang="pt-BR" class="scroll-smooth"><head><title>Héris Clínica Médica | Atendimento Humanizado em Jundiaí</title></head></html>';
    expect(parsePreviewMeta(html, 'heris')).toEqual({
      client: 'Héris Clínica Médica',
      locale: 'pt',
    });
  });

  it('decodes &amp;, splits on an en dash and reads English', () => {
    const html = '<html lang="en-US"><head><title>Acme &amp; Co – Home</title></head></html>';
    expect(parsePreviewMeta(html, 'acme')).toEqual({ client: 'Acme & Co', locale: 'en' });
  });

  it('splits on an em dash', () => {
    expect(parsePreviewMeta('<title>Studio Norte — Portfolio</title>', 'x').client).toBe(
      'Studio Norte',
    );
  });

  it('splits on a spaced hyphen', () => {
    expect(parsePreviewMeta('<title>Loja Sul - Início</title>', 'x').client).toBe('Loja Sul');
  });

  it('uses the first separator in the text when several appear', () => {
    expect(parsePreviewMeta('<title>A - B | C</title>', 'x').client).toBe('A');
    expect(parsePreviewMeta('<title>A | B – C</title>', 'x').client).toBe('A');
  });

  it('keeps a hyphen without surrounding spaces', () => {
    expect(parsePreviewMeta('<title>Coca-Cola | Loja</title>', 'x').client).toBe('Coca-Cola');
  });

  it('decodes decimal entities', () => {
    expect(parsePreviewMeta('<title>Caf&#233; Bom</title>', 'x').client).toBe('Café Bom');
  });

  it('decodes hex and named entities and leaves unknown or out-of-range ones as they are', () => {
    const html =
      '<title>&lt;Dev&gt; &quot;Q&quot; &apos;A&apos;&nbsp;&#x41;&#X42; &copy; &#9999999;</title>';
    expect(parsePreviewMeta(html, 'x').client).toBe(`<Dev> "Q" 'A' AB &copy; &#9999999;`);
  });

  it('collapses a title spread over several lines', () => {
    const html = '<TITLE data-x="1">\n  Padaria   Central\n  | Jundiaí\n</TITLE>';
    expect(parsePreviewMeta(html, 'x').client).toBe('Padaria Central');
  });

  it('falls back to the slug without a title', () => {
    expect(parsePreviewMeta('<html lang="pt"><head></head></html>', 'padaria').client).toBe(
      'padaria',
    );
  });

  it('falls back to the slug when the title is only whitespace', () => {
    expect(parsePreviewMeta('<title> \n </title>', 'padaria').client).toBe('padaria');
  });

  it('defaults to Portuguese without a lang attribute', () => {
    expect(parsePreviewMeta('<html class="a"><title>X</title></html>', 'x').locale).toBe('pt');
  });

  it('reads any non-Portuguese lang as English', () => {
    expect(parsePreviewMeta("<html lang='es'><title>X</title></html>", 'x').locale).toBe('en');
  });

  it('reads lang case-insensitively, unquoted included', () => {
    expect(parsePreviewMeta('<HTML LANG=PT><title>X</title></HTML>', 'x').locale).toBe('pt');
  });
});

describe('isSafePreviewPath', () => {
  it('accepts a slug with a file or a nested file', () => {
    expect(isSafePreviewPath('acme', ['index.html'])).toBe(true);
    expect(isSafePreviewPath('acme', ['img', 'logo.png'])).toBe(true);
  });

  it.each(['Acme', 'acme_1', '', '../x'])('rejects the slug %j', (slug) => {
    expect(isSafePreviewPath(slug, ['index.html'])).toBe(false);
  });

  it.each([[[]], [['']], [['.']], [['..']], [['img', '..', 'x']], [['a\\b']], [['a/b']]])(
    'rejects the segments %j',
    (segments) => {
      expect(isSafePreviewPath('acme', segments)).toBe(false);
    },
  );
});

describe('findClientPreview', () => {
  it('returns a registry preview without reading Blob', async () => {
    await expect(findClientPreview('exemplo')).resolves.toEqual({
      slug: 'exemplo',
      client: 'Cliente Exemplo',
      locale: 'pt',
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects an invalid slug without reading Blob', async () => {
    await expect(findClientPreview('Bad_Slug')).resolves.toBeUndefined();
    expect(get).not.toHaveBeenCalled();
  });

  it('returns undefined when the Blob index.html does not exist', async () => {
    vi.mocked(get).mockResolvedValue(null);
    await expect(findClientPreview('missing-site')).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledWith('missing-site/index.html', { access: 'private' });
  });

  it('returns undefined instead of throwing when Blob has no credentials', async () => {
    vi.mocked(get).mockRejectedValue(new Error('Vercel Blob: No blob credentials found.'));
    await expect(findClientPreview('no-credentials')).resolves.toBeUndefined();
  });

  it('builds the preview from the uploaded index.html', async () => {
    vi.mocked(get).mockResolvedValue(found('<html lang="en"><title>Acme | Home</title></html>'));
    await expect(findClientPreview('acme-blob')).resolves.toEqual({
      slug: 'acme-blob',
      client: 'Acme',
      locale: 'en',
    });
  });
});

describe('servePreviewAsset', () => {
  it('returns 404 for an unsafe path without reading Blob', async () => {
    const response = await servePreviewAsset('acme', ['..', 'secret.txt'], null);
    expect(response.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 404 when the blob does not exist', async () => {
    vi.mocked(get).mockResolvedValue(null);
    const response = await servePreviewAsset('asset-missing', ['index.html'], null);
    expect(response.status).toBe(404);
  });

  it('returns 404 when Blob throws', async () => {
    vi.mocked(get).mockRejectedValue(new Error('Vercel Blob: No blob credentials found.'));
    const response = await servePreviewAsset('asset-throws', ['index.html'], null);
    expect(response.status).toBe(404);
  });

  it('streams the blob with its content type, nosniff, ETag and no-cache', async () => {
    vi.mocked(get).mockResolvedValue(found('body { color: red; }', 'text/css', '"css-1"'));
    const response = await servePreviewAsset('asset-css', ['css', 'style.css'], null);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('body { color: red; }');
    expect(response.headers.get('Content-Type')).toBe('text/css');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('ETag')).toBe('"css-1"');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(get).toHaveBeenCalledWith(
      'asset-css/css/style.css',
      expect.objectContaining({ access: 'private' }),
    );
  });

  it('forwards If-None-Match and answers 304 when the blob is unchanged', async () => {
    vi.mocked(get).mockResolvedValue(notModified('"abc"'));
    const response = await servePreviewAsset('asset-cached', ['style.css'], '"abc"');

    expect(get).toHaveBeenCalledWith(
      'asset-cached/style.css',
      expect.objectContaining({ access: 'private', ifNoneMatch: '"abc"' }),
    );
    expect(response.status).toBe(304);
    expect(response.headers.get('ETag')).toBe('"abc"');
    expect(await response.text()).toBe('');
  });
});
