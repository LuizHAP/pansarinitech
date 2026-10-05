import { type ClientPreview, getClientPreview } from '@/data/client-previews';
import { type GetBlobResult, type ListBlobResultBlob, get, list } from '@vercel/blob';
import { addCacheTag } from '@vercel/functions';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

export const PREVIEW_CACHE_TAG = 'client-previews';

export type PreviewWarningCode =
  | 'invalid-slug'
  | 'missing-index'
  | 'missing-title'
  | 'absolute-asset-refs'
  | 'shadowed-by-repo';
export type PreviewWarning = { code: PreviewWarningCode; detail?: string };
export type PreviewFile = { path: string; size: number; uploadedAt: string };
export type IndexedPreview = ClientPreview & {
  hasIndex: boolean;
  files: PreviewFile[];
  fileCount: number;
  totalSize: number;
  updatedAt: string;
  warnings: PreviewWarning[];
};
export type PreviewIndex = { generatedAt: string; available: boolean; previews: IndexedPreview[] };

const SLUG = /^[a-z0-9-]+$/;
const ABSOLUTE_REF = /\b(?:src|href)\s*=\s*["']?(\/(?!\/)[^"'\s>]*)/gi;
const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const HTML_LANG = /<html\b[^>]*?\slang\s*=\s*["']?([^"'\s>]*)/i;
const ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;
const TITLE_SEPARATOR = / (?:\||–|—|-) /;
const NAMED_ENTITIES = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['nbsp', ' '],
]);

function decodeEntities(text: string): string {
  return text.replace(ENTITY, (match, name: string) => {
    if (name[0] !== '#') return NAMED_ENTITIES.get(name) ?? match;
    const isHex = name[1] === 'x' || name[1] === 'X';
    const codePoint = Number.parseInt(name.slice(isHex ? 2 : 1), isHex ? 16 : 10);
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
  });
}

export function isSafePreviewPath(slug: string, segments: readonly string[]): boolean {
  return (
    SLUG.test(slug) &&
    segments.length > 0 &&
    segments.every(
      (segment) =>
        segment !== '' &&
        segment !== '.' &&
        segment !== '..' &&
        !segment.includes('/') &&
        !segment.includes('\\'),
    )
  );
}

export function parsePreviewMeta(
  html: string,
  slug: string,
): Pick<ClientPreview, 'client' | 'locale'> {
  const title = decodeEntities(html.match(TITLE)?.[1] ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const client = title.split(TITLE_SEPARATOR)[0].trim() || slug;
  const lang = html.match(HTML_LANG)?.[1].toLowerCase();
  const locale = lang === undefined || lang.startsWith('pt') ? 'pt' : 'en';
  return { client, locale };
}

export function isPreviewSlug(slug: string): boolean {
  return SLUG.test(slug);
}

export function previewCacheTag(slug: string): string {
  return `client-preview:${slug}`;
}

async function readIndexHtml(slug: string): Promise<string> {
  const result = await get(`${slug}/index.html`, { access: 'private' });
  return result?.statusCode === 200 ? new Response(result.stream).text() : '';
}

function collectWarnings(
  slug: string,
  hasIndex: boolean,
  client: string,
  html: string,
): PreviewWarning[] {
  const warnings: PreviewWarning[] = [];
  if (!isPreviewSlug(slug)) warnings.push({ code: 'invalid-slug' });
  if (!hasIndex) warnings.push({ code: 'missing-index' });
  if (hasIndex && client === slug) warnings.push({ code: 'missing-title' });
  const absoluteRefs = [...new Set(Array.from(html.matchAll(ABSOLUTE_REF), (match) => match[1]))];
  if (absoluteRefs.length > 0) {
    warnings.push({ code: 'absolute-asset-refs', detail: absoluteRefs.slice(0, 3).join(', ') });
  }
  if (getClientPreview(slug)) warnings.push({ code: 'shadowed-by-repo' });
  return warnings;
}

async function listAllBlobs(): Promise<ListBlobResultBlob[]> {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await list({ mode: 'expanded', cursor });
    blobs.push(...page.blobs);
    cursor = page.cursor;
    hasMore = page.hasMore;
  }
  return blobs;
}

export async function buildPreviewIndex(): Promise<PreviewIndex> {
  try {
    const groups = new Map<string, { files: PreviewFile[]; updatedAt: string }>();
    for (const blob of await listAllBlobs()) {
      const separator = blob.pathname.indexOf('/');
      if (separator === -1) continue;
      const slug = blob.pathname.slice(0, separator);
      const path = blob.pathname.slice(separator + 1);
      const uploadedAt = blob.uploadedAt.toISOString();
      const group = groups.get(slug) ?? { files: [], updatedAt: uploadedAt };
      if (uploadedAt > group.updatedAt) group.updatedAt = uploadedAt;
      // The Blob dashboard's "create folder" stores a zero-byte blob ending in "/".
      if (path !== '' && !path.endsWith('/'))
        group.files.push({ path, size: blob.size, uploadedAt });
      groups.set(slug, group);
    }

    const previews = await Promise.all(
      Array.from(groups, async ([slug, { files, updatedAt }]): Promise<IndexedPreview> => {
        files.sort((a, b) => a.path.localeCompare(b.path));
        const hasIndex = files.some((file) => file.path === 'index.html');
        const html = hasIndex ? await readIndexHtml(slug) : '';
        const { client, locale } = parsePreviewMeta(html, slug);
        return {
          slug,
          client,
          locale,
          hasIndex,
          files,
          fileCount: files.length,
          totalSize: files.reduce((total, file) => total + file.size, 0),
          updatedAt,
          warnings: collectWarnings(slug, hasIndex, client, html),
        };
      }),
    );
    previews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { generatedAt: new Date().toISOString(), available: true, previews };
  } catch {
    // No Blob credentials (CI, local dev) has to read as "no Blob previews", not a 500.
    return { generatedAt: new Date().toISOString(), available: false, previews: [] };
  }
}

export const getPreviewIndex = unstable_cache(buildPreviewIndex, ['client-preview-index'], {
  tags: [PREVIEW_CACHE_TAG],
  revalidate: 300,
});

export const findClientPreview = cache(async (slug: string): Promise<ClientPreview | undefined> => {
  const registered = getClientPreview(slug);
  if (registered) return registered;
  if (!isSafePreviewPath(slug, ['index.html'])) return undefined;

  const indexed = (await getPreviewIndex()).previews.find(
    (preview) => preview.slug === slug && preview.hasIndex,
  );
  return indexed && { slug: indexed.slug, client: indexed.client, locale: indexed.locale };
});

const CDN_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=300, stale-while-revalidate=86400',
};

function notFoundResponse(): Response {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export async function servePreviewAsset(
  slug: string,
  segments: readonly string[],
  ifNoneMatch: string | null,
): Promise<Response> {
  if (!isSafePreviewPath(slug, segments)) return notFoundResponse();

  let result: GetBlobResult | null;
  try {
    result = await get(`${slug}/${segments.join('/')}`, {
      access: 'private',
      ifNoneMatch: ifNoneMatch ?? undefined,
    });
  } catch {
    return notFoundResponse();
  }
  if (!result) return notFoundResponse();

  await addCacheTag([PREVIEW_CACHE_TAG, previewCacheTag(slug)]);
  if (result.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: { ETag: result.blob.etag, ...CDN_CACHE_HEADERS },
    });
  }
  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'X-Content-Type-Options': 'nosniff',
      ETag: result.blob.etag,
      ...CDN_CACHE_HEADERS,
    },
  });
}
