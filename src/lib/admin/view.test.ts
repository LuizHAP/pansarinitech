import type { IndexedPreview, PreviewIndex } from '@/lib/client-preview-source';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WARNING_MESSAGES,
  findAdminPreview,
  formatBytes,
  formatDateTime,
  listAdminPreviews,
  previewAssetHref,
  previewUrl,
  publicUrls,
} from './view';

vi.mock('@/data/client-previews', () => {
  const clientPreviews = [{ slug: 'repo-site', client: 'Repo Site', locale: 'pt' }];
  return {
    clientPreviews,
    getClientPreview: (slug: string) => clientPreviews.find((preview) => preview.slug === slug),
  };
});

function indexed(slug: string, overrides: Partial<IndexedPreview> = {}): IndexedPreview {
  return {
    slug,
    client: slug,
    locale: 'pt',
    hasIndex: true,
    disabled: false,
    files: [{ path: 'index.html', size: 10, uploadedAt: '2026-10-01T00:00:00.000Z' }],
    fileCount: 1,
    totalSize: 10,
    updatedAt: '2026-10-01T00:00:00.000Z',
    warnings: [],
    ...overrides,
  };
}

function index(...previews: IndexedPreview[]): PreviewIndex {
  return { generatedAt: '2026-10-05T00:00:00.000Z', available: true, previews };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('previewUrl', () => {
  it('defaults to the production domain', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    expect(previewUrl('acme')).toBe('https://pansarini.dev/preview/acme');
  });

  it('uses NEXT_PUBLIC_SITE_URL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://staging.example.com');
    expect(previewUrl('acme')).toBe('https://staging.example.com/preview/acme');
  });
});

describe('previewAssetHref', () => {
  it('encodes each path segment', () => {
    expect(previewAssetHref('acme', 'img/logo final.png')).toBe(
      '/client-previews/acme/img/logo%20final.png',
    );
  });
});

describe('formatBytes', () => {
  it('formats B, KB and MB in pt-BR', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('formatDateTime', () => {
  it('formats in pt-BR on São Paulo time whatever the server time zone', () => {
    vi.stubEnv('TZ', 'UTC');
    const formatted = formatDateTime('2026-10-05T17:30:00.000Z');
    expect(formatted).toContain('05/10/2026');
    expect(formatted).toContain('14:30');
  });
});

describe('listAdminPreviews', () => {
  it('lists the repo registry first, then every Blob preview, each with its public URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    const rows = listAdminPreviews(
      index(indexed('acme', { client: 'Acme' }), indexed('repo-site', { client: 'Outro' })),
    );

    expect(rows.map(({ slug, source }) => [slug, source])).toEqual([
      ['repo-site', 'repo'],
      ['acme', 'blob'],
      ['repo-site', 'blob'],
    ]);
    expect(rows[0]).toEqual({
      slug: 'repo-site',
      client: 'Repo Site',
      locale: 'pt',
      source: 'repo',
      url: 'https://pansarini.dev/preview/repo-site',
      hasIndex: true,
      disabled: false,
      files: [],
      fileCount: null,
      totalSize: null,
      updatedAt: null,
      warnings: [],
    });
    expect(rows[1]).toMatchObject({
      client: 'Acme',
      url: 'https://pansarini.dev/preview/acme',
      fileCount: 1,
      totalSize: 10,
      updatedAt: '2026-10-01T00:00:00.000Z',
    });
    expect(rows[2].url).toBe('https://pansarini.dev/preview/repo-site');
  });
});

describe('findAdminPreview', () => {
  it('prefers the Blob row when the slug is also in the repo', () => {
    const row = findAdminPreview(index(indexed('repo-site', { client: 'Outro' })), 'repo-site');
    expect(row?.source).toBe('blob');
    expect(row?.client).toBe('Outro');
  });

  it('falls back to the repo row', () => {
    expect(findAdminPreview(index(), 'repo-site')?.source).toBe('repo');
  });

  it('is undefined for an unknown slug', () => {
    expect(findAdminPreview(index(indexed('acme')), 'nope')).toBeUndefined();
  });
});

describe('publicUrls', () => {
  it('keeps URLs that resolve, once each, in list order', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    const rows = listAdminPreviews(
      index(
        indexed('acme'),
        indexed('repo-site'),
        indexed('no-index', { hasIndex: false }),
        indexed('Bad_Slug'),
        indexed('paused', { disabled: true }),
      ),
    );

    expect(publicUrls(rows)).toEqual([
      'https://pansarini.dev/preview/repo-site',
      'https://pansarini.dev/preview/acme',
    ]);
  });
});

describe('disabled previews', () => {
  it('keeps a disabled Blob row disabled and its repo twin public', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    const rows = listAdminPreviews(index(indexed('repo-site', { disabled: true })));

    expect(rows.map(({ source, disabled }) => [source, disabled])).toEqual([
      ['repo', false],
      ['blob', true],
    ]);
    expect(publicUrls(rows)).toEqual(['https://pansarini.dev/preview/repo-site']);
  });
});

describe('WARNING_MESSAGES', () => {
  it.each([
    'invalid-slug',
    'missing-index',
    'missing-title',
    'absolute-asset-refs',
    'shadowed-by-repo',
  ] as const)('has a Portuguese message for %s', (code) => {
    expect(WARNING_MESSAGES[code].length).toBeGreaterThan(10);
  });
});
