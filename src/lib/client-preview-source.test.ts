import { type GetBlobResult, type ListBlobResultBlob, get, list } from '@vercel/blob';
import { addCacheTag } from '@vercel/functions';
import { unstable_cache } from 'next/cache';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PREVIEW_CACHE_TAG,
  buildPreviewIndex,
  findClientPreview,
  getPreviewIndex,
  isPreviewSlug,
  isSafePreviewPath,
  parsePreviewMeta,
  previewCacheTag,
  servePreviewAsset,
} from './client-preview-source';

vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn() }));
vi.mock('next/cache', () => ({ unstable_cache: vi.fn((fn) => vi.fn(fn)) }));
vi.mock('@vercel/functions', () => ({ addCacheTag: vi.fn() }));
vi.mock('@/data/client-previews', () => {
  const clientPreviews = [{ slug: 'repo-site', client: 'Repo Site', locale: 'pt' }];
  return {
    clientPreviews,
    getClientPreview: (slug: string) => clientPreviews.find((preview) => preview.slug === slug),
  };
});

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

function listed(
  pathname: string,
  size = 0,
  uploadedAt = '2026-10-01T00:00:00.000Z',
): ListBlobResultBlob {
  return {
    url: `https://store.private.blob.vercel-storage.com/${pathname}`,
    downloadUrl: `https://store.private.blob.vercel-storage.com/${pathname}?download=1`,
    pathname,
    size,
    uploadedAt: new Date(uploadedAt),
    etag: `"${pathname}"`,
  };
}

function listing(...blobs: ListBlobResultBlob[]) {
  vi.mocked(list).mockResolvedValue({ blobs, hasMore: false });
}

function serving(pages: Record<string, string>) {
  vi.mocked(get).mockImplementation(async (pathname: string) =>
    pathname in pages ? found(pages[pathname]) : null,
  );
}

beforeEach(() => {
  vi.mocked(get).mockReset();
  vi.mocked(list).mockReset();
  vi.mocked(addCacheTag).mockReset();
  vi.mocked(list).mockResolvedValue({ blobs: [], hasMore: false });
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

describe('isPreviewSlug', () => {
  it('accepts lowercase letters, digits and hyphens only', () => {
    expect(isPreviewSlug('acme-1')).toBe(true);
    expect(isPreviewSlug('Acme')).toBe(false);
    expect(isPreviewSlug('a_b')).toBe(false);
  });
});

describe('previewCacheTag', () => {
  it('scopes the cache tag to one slug', () => {
    expect(PREVIEW_CACHE_TAG).toBe('client-previews');
    expect(previewCacheTag('acme')).toBe('client-preview:acme');
  });
});

describe('getPreviewIndex', () => {
  it('caches the index for 5 minutes under the client-previews tag', () => {
    expect(unstable_cache).toHaveBeenCalledTimes(1);
    expect(unstable_cache).toHaveBeenCalledWith(buildPreviewIndex, ['client-preview-index'], {
      tags: ['client-previews'],
      revalidate: 300,
    });
  });
});

describe('buildPreviewIndex', () => {
  it('groups blobs by folder with sorted files, totals and meta from index.html', async () => {
    listing(
      listed('acme/index.html', 100, '2026-10-01T00:00:00.000Z'),
      listed('acme/css/style.css', 50, '2026-10-03T00:00:00.000Z'),
    );
    serving({ 'acme/index.html': '<html lang="en"><title>Acme | Home</title></html>' });

    const index = await buildPreviewIndex();

    expect(index.available).toBe(true);
    expect(index.previews).toEqual([
      {
        slug: 'acme',
        client: 'Acme',
        locale: 'en',
        hasIndex: true,
        disabled: false,
        files: [
          { path: 'css/style.css', size: 50, uploadedAt: '2026-10-03T00:00:00.000Z' },
          { path: 'index.html', size: 100, uploadedAt: '2026-10-01T00:00:00.000Z' },
        ],
        fileCount: 2,
        totalSize: 150,
        updatedAt: '2026-10-03T00:00:00.000Z',
        warnings: [],
      },
    ]);
    expect(get).toHaveBeenCalledWith('acme/index.html', { access: 'private' });
  });

  it('follows the list cursor until hasMore is false', async () => {
    vi.mocked(list)
      .mockResolvedValueOnce({
        blobs: [listed('paged/index.html', 10)],
        hasMore: true,
        cursor: 'c1',
      })
      .mockResolvedValueOnce({ blobs: [listed('paged/app.js', 20)], hasMore: false });
    serving({ 'paged/index.html': '<title>Paged</title>' });

    const index = await buildPreviewIndex();

    expect(list).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenNthCalledWith(1, { mode: 'expanded', cursor: undefined });
    expect(list).toHaveBeenNthCalledWith(2, { mode: 'expanded', cursor: 'c1' });
    expect(index.previews[0].files.map((file) => file.path)).toEqual(['app.js', 'index.html']);
    expect(index.previews[0].totalSize).toBe(30);
  });

  it('ignores root-level blobs and lists an empty folder without files or a Blob read', async () => {
    listing(listed('readme.txt', 5), listed('empty/', 0, '2026-10-02T00:00:00.000Z'));

    const index = await buildPreviewIndex();

    expect(index.previews).toEqual([
      {
        slug: 'empty',
        client: 'empty',
        locale: 'pt',
        hasIndex: false,
        disabled: false,
        files: [],
        fileCount: 0,
        totalSize: 0,
        updatedAt: '2026-10-02T00:00:00.000Z',
        warnings: [{ code: 'missing-index' }],
      },
    ]);
    expect(get).not.toHaveBeenCalled();
  });

  it('does not count a nested folder marker as a file', async () => {
    listing(listed('nested/index.html', 10), listed('nested/img/', 0));
    serving({ 'nested/index.html': '<title>Nested</title>' });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.files.map((file) => file.path)).toEqual(['index.html']);
    expect(preview.fileCount).toBe(1);
  });

  it('flags a folder with the .disabled marker without counting it as a file', async () => {
    listing(
      listed('off/index.html', 100, '2026-10-01T00:00:00.000Z'),
      listed('off/app.js', 50, '2026-10-02T00:00:00.000Z'),
      listed('off/.disabled', 8, '2026-10-05T00:00:00.000Z'),
    );
    serving({ 'off/index.html': '<title>Off | Home</title>' });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.disabled).toBe(true);
    expect(preview.files.map((file) => file.path)).toEqual(['app.js', 'index.html']);
    expect(preview.fileCount).toBe(2);
    expect(preview.totalSize).toBe(150);
    expect(preview.updatedAt).toBe('2026-10-02T00:00:00.000Z');
    expect(preview.hasIndex).toBe(true);
    expect(preview.client).toBe('Off');
    expect(preview.warnings).toEqual([]);
  });

  it('only treats .disabled at the folder root as the marker', async () => {
    listing(listed('nested-off/index.html', 10), listed('nested-off/img/.disabled', 3));
    serving({ 'nested-off/index.html': '<title>Nested Off</title>' });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.disabled).toBe(false);
    expect(preview.files.map((file) => file.path)).toEqual(['img/.disabled', 'index.html']);
    expect(preview.fileCount).toBe(2);
  });

  it('lists a folder holding only the marker as disabled, dated by the marker', async () => {
    listing(listed('only-marker/.disabled', 8, '2026-10-04T00:00:00.000Z'));

    const index = await buildPreviewIndex();

    expect(index.previews).toEqual([
      {
        slug: 'only-marker',
        client: 'only-marker',
        locale: 'pt',
        hasIndex: false,
        disabled: true,
        files: [],
        fileCount: 0,
        totalSize: 0,
        updatedAt: '2026-10-04T00:00:00.000Z',
        warnings: [{ code: 'missing-index' }],
      },
    ]);
    expect(get).not.toHaveBeenCalled();
  });

  it('warns about a folder name outside [a-z0-9-]', async () => {
    listing(listed('Bad_Slug/index.html', 10));
    serving({ 'Bad_Slug/index.html': '<title>Bad</title>' });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.warnings).toEqual([{ code: 'invalid-slug' }]);
  });

  it('warns about a folder named after an admin page', async () => {
    listing(
      listed('leads/index.html', 10),
      listed('login/index.html', 10),
      listed('acme-leads/index.html', 10),
    );
    serving({
      'leads/index.html': '<title>Leads</title>',
      'login/index.html': '<title>Login</title>',
      'acme-leads/index.html': '<title>Acme Leads</title>',
    });

    const previews = (await buildPreviewIndex()).previews;
    const warnings = Object.fromEntries(
      previews.map((preview) => [preview.slug, preview.warnings]),
    );

    expect(warnings).toEqual({
      leads: [{ code: 'reserved-slug' }],
      login: [{ code: 'reserved-slug' }],
      'acme-leads': [],
    });
  });

  it('warns when index.html has no title and the client fell back to the slug', async () => {
    listing(listed('untitled/index.html', 10));
    serving({ 'untitled/index.html': '<html lang="pt-BR"><head></head></html>' });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.client).toBe('untitled');
    expect(preview.warnings).toEqual([{ code: 'missing-title' }]);
  });

  it('reads an index.html that disappeared between list and get as empty', async () => {
    listing(listed('vanished/index.html', 10));
    vi.mocked(get).mockResolvedValue(null);

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.hasIndex).toBe(true);
    expect(preview.client).toBe('vanished');
    expect(preview.locale).toBe('pt');
    expect(preview.warnings).toEqual([{ code: 'missing-title' }]);
  });

  it('warns about root-absolute src and href values and ignores the rest', async () => {
    listing(listed('absolute/index.html', 10));
    serving({
      'absolute/index.html':
        '<title>Abs</title><script src="/app.js"></script><link href=\'/style.css\'>' +
        '<script src="//cdn.example.com/x.js"></script><a href="https://example.com">x</a>' +
        '<img src="img/a.png">',
    });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.warnings).toEqual([
      { code: 'absolute-asset-refs', detail: '/app.js, /style.css' },
    ]);
  });

  it('lists at most 3 unique absolute refs, unquoted ones included', async () => {
    listing(listed('many-refs/index.html', 10));
    serving({
      'many-refs/index.html':
        '<title>Many</title><img src=/a.png><img src="/a.png"><img src="/b.png">' +
        '<img src="/c.png"><img src="/d.png">',
    });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.warnings).toEqual([
      { code: 'absolute-asset-refs', detail: '/a.png, /b.png, /c.png' },
    ]);
  });

  it('warns when a repo preview with the same slug wins', async () => {
    listing(listed('repo-site/index.html', 10));
    serving({ 'repo-site/index.html': '<title>Outro</title>' });

    const [preview] = (await buildPreviewIndex()).previews;

    expect(preview.warnings).toEqual([{ code: 'shadowed-by-repo' }]);
  });

  it('sorts previews newest first', async () => {
    listing(
      listed('older/', 0, '2026-09-01T00:00:00.000Z'),
      listed('newest/', 0, '2026-10-04T00:00:00.000Z'),
      listed('middle/', 0, '2026-09-15T00:00:00.000Z'),
    );

    const index = await buildPreviewIndex();

    expect(index.previews.map((preview) => preview.slug)).toEqual(['newest', 'middle', 'older']);
  });

  it('is plain JSON with an ISO generatedAt', async () => {
    listing(listed('json/index.html', 10), listed('json/a.css', 5));
    serving({ 'json/index.html': '<title>Json</title>' });

    const index = await buildPreviewIndex();

    expect(new Date(index.generatedAt).toISOString()).toBe(index.generatedAt);
    expect(JSON.parse(JSON.stringify(index))).toStrictEqual(index);
  });

  it('returns an unavailable empty index when list throws', async () => {
    vi.mocked(list).mockRejectedValue(new Error('Vercel Blob: No blob credentials found.'));

    const index = await buildPreviewIndex();

    expect(index).toEqual({ generatedAt: expect.any(String), available: false, previews: [] });
    expect(new Date(index.generatedAt).toISOString()).toBe(index.generatedAt);
  });

  it('returns an unavailable empty index when get throws', async () => {
    listing(listed('get-throws/index.html', 10));
    vi.mocked(get).mockRejectedValue(new Error('Vercel Blob: service unavailable'));

    await expect(buildPreviewIndex()).resolves.toEqual({
      generatedAt: expect.any(String),
      available: false,
      previews: [],
    });
  });
});

describe('findClientPreview', () => {
  it('returns a registry preview without reading Blob', async () => {
    await expect(findClientPreview('repo-site')).resolves.toEqual({
      slug: 'repo-site',
      client: 'Repo Site',
      locale: 'pt',
    });
    expect(list).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects an invalid slug without listing Blob', async () => {
    await expect(findClientPreview('Bad_Slug')).resolves.toBeUndefined();
    expect(list).not.toHaveBeenCalled();
  });

  it('returns the preview from the cached index', async () => {
    const cachedIndex = vi.mocked(unstable_cache).mock.results[0].value as Mock;
    const callsBefore = cachedIndex.mock.calls.length;
    listing(listed('acme-blob/index.html', 10));
    serving({ 'acme-blob/index.html': '<html lang="en"><title>Acme | Home</title></html>' });

    await expect(findClientPreview('acme-blob')).resolves.toEqual({
      slug: 'acme-blob',
      client: 'Acme',
      locale: 'en',
    });
    expect(cachedIndex.mock.calls.length).toBe(callsBefore + 1);
    expect(getPreviewIndex).toBe(cachedIndex);
  });

  it('returns undefined for a folder without index.html', async () => {
    listing(listed('no-index/app.js', 10));
    await expect(findClientPreview('no-index')).resolves.toBeUndefined();
  });

  it('returns undefined for an unknown slug', async () => {
    listing(listed('someone-else/index.html', 10));
    serving({ 'someone-else/index.html': '<title>Other</title>' });
    await expect(findClientPreview('unknown-site')).resolves.toBeUndefined();
  });

  it('returns undefined for a disabled preview', async () => {
    listing(listed('off-site/index.html', 10), listed('off-site/.disabled', 8));
    serving({ 'off-site/index.html': '<title>Off Site | Home</title>' });
    await expect(findClientPreview('off-site')).resolves.toBeUndefined();
  });

  it('returns undefined instead of throwing when Blob has no credentials', async () => {
    vi.mocked(list).mockRejectedValue(new Error('Vercel Blob: No blob credentials found.'));
    await expect(findClientPreview('no-credentials')).resolves.toBeUndefined();
  });
});

function expectUncachedNotFound(response: Response) {
  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.get('Vercel-CDN-Cache-Control')).toBeNull();
  expect(addCacheTag).not.toHaveBeenCalled();
}

describe('servePreviewAsset', () => {
  it('returns an uncached 404 for an unsafe path without reading Blob', async () => {
    const response = await servePreviewAsset('acme', ['..', 'secret.txt'], null);
    expectUncachedNotFound(response);
    expect(get).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it('returns an uncached 404 for a disabled preview without reading the blob', async () => {
    listing(listed('off-asset/index.html', 10), listed('off-asset/.disabled', 8));
    vi.mocked(get).mockResolvedValue(found('<p>x</p>'));
    const cachedIndex = vi.mocked(unstable_cache).mock.results[0].value as Mock;
    const callsBefore = cachedIndex.mock.calls.length;

    expectUncachedNotFound(await servePreviewAsset('off-asset', ['index.html'], null));
    // The only Blob read is the index build's own index.html read.
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('off-asset/index.html', { access: 'private' });
    expect(cachedIndex.mock.calls.length).toBe(callsBefore + 1);
  });

  it('still serves a preview when another folder is disabled', async () => {
    listing(listed('other-off/.disabled', 8));
    vi.mocked(get).mockResolvedValue(found('ok', 'text/plain'));
    const response = await servePreviewAsset('still-on', ['index.html'], null);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('returns an uncached 404 when the blob does not exist', async () => {
    vi.mocked(get).mockResolvedValue(null);
    expectUncachedNotFound(await servePreviewAsset('asset-missing', ['index.html'], null));
  });

  it('returns an uncached 404 when Blob throws', async () => {
    vi.mocked(get).mockRejectedValue(new Error('Vercel Blob: No blob credentials found.'));
    expectUncachedNotFound(await servePreviewAsset('asset-throws', ['index.html'], null));
  });

  it('streams the blob with its content type, nosniff, ETag, CDN cache headers and tags', async () => {
    vi.mocked(get).mockResolvedValue(found('body { color: red; }', 'text/css', '"css-1"'));
    const response = await servePreviewAsset('asset-css', ['css', 'style.css'], null);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('body { color: red; }');
    expect(response.headers.get('Content-Type')).toBe('text/css');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('ETag')).toBe('"css-1"');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe(
      'max-age=300, stale-while-revalidate=86400',
    );
    expect(addCacheTag).toHaveBeenCalledTimes(1);
    expect(addCacheTag).toHaveBeenCalledWith(['client-previews', 'client-preview:asset-css']);
    expect(get).toHaveBeenCalledWith(
      'asset-css/css/style.css',
      expect.objectContaining({ access: 'private' }),
    );
  });

  it('forwards If-None-Match and answers a tagged 304 when the blob is unchanged', async () => {
    vi.mocked(get).mockResolvedValue(notModified('"abc"'));
    const response = await servePreviewAsset('asset-cached', ['style.css'], '"abc"');

    expect(get).toHaveBeenCalledWith(
      'asset-cached/style.css',
      expect.objectContaining({ access: 'private', ifNoneMatch: '"abc"' }),
    );
    expect(response.status).toBe(304);
    expect(response.headers.get('ETag')).toBe('"abc"');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toBe(
      'max-age=300, stale-while-revalidate=86400',
    );
    expect(addCacheTag).toHaveBeenCalledTimes(1);
    expect(addCacheTag).toHaveBeenCalledWith(['client-previews', 'client-preview:asset-cached']);
    expect(await response.text()).toBe('');
  });
});
