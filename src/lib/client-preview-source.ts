import { type ClientPreview, getClientPreview } from '@/data/client-previews';
import { type GetBlobResult, get } from '@vercel/blob';
import { cache } from 'react';

const SLUG = /^[a-z0-9-]+$/;
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

export const findClientPreview = cache(async (slug: string): Promise<ClientPreview | undefined> => {
  const registered = getClientPreview(slug);
  if (registered) return registered;
  if (!isSafePreviewPath(slug, ['index.html'])) return undefined;

  try {
    const result = await get(`${slug}/index.html`, { access: 'private' });
    if (result?.statusCode !== 200) return undefined;
    const html = await new Response(result.stream).text();
    return { slug, ...parsePreviewMeta(html, slug) };
  } catch {
    // Without Blob credentials (CI, local dev without `vercel env pull`) the SDK throws,
    // and that has to read as a missing preview, not a 500.
    return undefined;
  }
});

function notFoundResponse(): Response {
  return new Response('Not found', { status: 404 });
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

  if (result.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: { ETag: result.blob.etag, 'Cache-Control': 'no-cache' },
    });
  }
  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'X-Content-Type-Options': 'nosniff',
      ETag: result.blob.etag,
      'Cache-Control': 'no-cache',
    },
  });
}
