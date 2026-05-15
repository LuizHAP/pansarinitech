// src/lib/seo.test.ts — Phase 01 Plan 03 (100% coverage on Next 16 Metadata factory)
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildHomeMetadata, buildMetadata } from './seo';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('buildMetadata() — VERCEL_ENV / robots branches', () => {
  it('returns robots: undefined on production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const meta = buildMetadata({ locale: 'en', path: '', title: 'T', description: 'D' });
    expect(meta.robots).toBeUndefined();
  });

  it('returns noindex on preview deploy', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const meta = buildMetadata({ locale: 'en', path: '', title: 'T', description: 'D' });
    expect(meta.robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });

  it('returns noindex when VERCEL_ENV is defined but not "production" (e.g. development)', () => {
    vi.stubEnv('VERCEL_ENV', 'development');
    const meta = buildMetadata({ locale: 'en', path: '', title: 'T', description: 'D' });
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });

  describe('with VERCEL_ENV undefined', () => {
    let saved: string | undefined;
    beforeAll(() => {
      saved = process.env.VERCEL_ENV;
      // biome-ignore lint/performance/noDelete: process.env keys must be removed with delete; assignment of undefined stringifies to "undefined"
      delete process.env.VERCEL_ENV;
    });
    afterEach(() => {
      // outer afterEach resets stubs; this inner block manages real env around its describe
      if (saved === undefined) {
        // biome-ignore lint/performance/noDelete: process.env keys must be removed with delete; assignment of undefined stringifies to "undefined"
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = saved;
      }
    });
    it('returns robots: undefined when VERCEL_ENV is unset (local dev pre-Vercel)', () => {
      // ensure no stub from outer suite leaks in
      vi.unstubAllEnvs();
      // biome-ignore lint/performance/noDelete: process.env keys must be removed with delete; assignment of undefined stringifies to "undefined"
      delete process.env.VERCEL_ENV;
      const meta = buildMetadata({ locale: 'en', path: '', title: 'T', description: 'D' });
      expect(meta.robots).toBeUndefined();
    });
  });
});

describe('buildMetadata() — type / openGraph article branches', () => {
  it("default type is 'website' and excludes article-only fields", () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const meta = buildMetadata({ locale: 'en', path: '', title: 'T', description: 'D' });
    expect((meta.openGraph as Record<string, unknown>).type).toBe('website');
    expect((meta.openGraph as Record<string, unknown>).publishedTime).toBeUndefined();
    expect((meta.openGraph as Record<string, unknown>).modifiedTime).toBeUndefined();
    expect((meta.openGraph as Record<string, unknown>).tags).toBeUndefined();
  });

  it("type='article' with all three optional fields populates openGraph", () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const meta = buildMetadata({
      locale: 'en',
      path: '/blog/x',
      title: 'T',
      description: 'D',
      type: 'article',
      publishedTime: '2026-05-01T00:00:00Z',
      modifiedTime: '2026-05-02T00:00:00Z',
      tags: ['a', 'b'],
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.type).toBe('article');
    expect(og.publishedTime).toBe('2026-05-01T00:00:00Z');
    expect(og.modifiedTime).toBe('2026-05-02T00:00:00Z');
    expect(og.tags).toEqual(['a', 'b']);
  });

  it("type='article' with no optional fields omits them all", () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const meta = buildMetadata({
      locale: 'en',
      path: '/blog/x',
      title: 'T',
      description: 'D',
      type: 'article',
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.publishedTime).toBeUndefined();
    expect(og.modifiedTime).toBeUndefined();
    expect(og.tags).toBeUndefined();
  });

  it("type='article' with only publishedTime exercises mixed if-branches", () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const meta = buildMetadata({
      locale: 'en',
      path: '/blog/x',
      title: 'T',
      description: 'D',
      type: 'article',
      publishedTime: '2026-05-01T00:00:00Z',
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.publishedTime).toBe('2026-05-01T00:00:00Z');
    expect(og.modifiedTime).toBeUndefined();
    expect(og.tags).toBeUndefined();
  });
});

describe('buildMetadata() — locale + canonical URLs (localePrefix:never)', () => {
  it("locale='en' -> openGraph.locale 'en_US' and locale-free canonical URL", () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const meta = buildMetadata({ locale: 'en', path: '/blog/foo', title: 'T', description: 'D' });
    expect(meta.openGraph?.locale).toBe('en_US');
    // No hreflang languages map — both locales share the same URL with localePrefix:never
    expect(meta.alternates?.languages).toBeUndefined();
    expect(meta.alternates?.canonical).toContain('/blog/foo');
    expect(meta.alternates?.canonical).not.toContain('/en/');
  });

  it("locale='pt' -> openGraph.locale 'pt_BR' and locale-free canonical, no languages map", () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const meta = buildMetadata({ locale: 'pt', path: '', title: 'T', description: 'D' });
    expect(meta.openGraph?.locale).toBe('pt_BR');
    expect(meta.alternates?.languages).toBeUndefined();
    // home path '' normalises to '/'
    expect(meta.alternates?.canonical).toMatch(/\/$/);
  });
});

describe('buildHomeMetadata()', () => {
  it('passes both translation keys through the t() function', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const t = (k: string) => `X:${k}`;
    const meta = buildHomeMetadata('en', t);
    expect(meta.title).toContain('X:seo.homeTitle');
    expect(meta.description).toBe('X:seo.siteDescription');
  });
});
