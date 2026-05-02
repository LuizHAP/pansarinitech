import { type Locale, routing } from '@/i18n/routing';
// src/lib/seo.ts — Phase 4 D-28, D-29 (per RESEARCH §5)
//
// Centralized Next 16 Metadata API factory. Single source of truth for:
//   - canonical URL generation
//   - hreflang map (en + pt-BR + x-default)
//   - openGraph + twitter card metadata
//   - robots noindex on Vercel preview deploys (defense-in-depth alongside
//     Plan 04-03's robots.txt + X-Robots-Tag header)
//
// IMPORTANT: do NOT set openGraph.images here. Next 16 auto-injects image
// metadata from per-route opengraph-image.tsx files (added in Plan 04-02 +
// Plan 04-03). Setting openGraph.images explicitly would shadow those.
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pansarinitech.vercel.app';
const SITE_NAME = 'Luiz Pansarini';

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', pt: 'pt_BR' };
// Google's hreflang spec wants `pt-BR` (regional), NOT bare `pt`. T-04-06.
const HREFLANG: Record<Locale, string> = { en: 'en', pt: 'pt-BR' };

export type BuildMetadataInput = {
  locale: Locale;
  /** path AFTER the locale segment, e.g. "/blog/foo" or "" for home */
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
};

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    locale,
    path,
    title,
    description,
    type = 'website',
    publishedTime,
    modifiedTime,
    tags,
  } = input;

  const fullTitle = `${title} — ${SITE_NAME}`;
  const canonicalUrl = `${SITE_URL}/${locale}${path}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[HREFLANG[l]] = `${SITE_URL}/${l}${path}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`;

  // robots layer: per-page meta-tag noindex on Vercel preview deploys
  // (VERCEL_ENV defined but != 'production'). On local dev (VERCEL_ENV
  // undefined), rely on Plan 04-03's robots.txt + next.config.ts headers
  // (X-Robots-Tag) instead — local dev pages are still inspectable via the
  // standard meta-tag layer when explicitly previewing.
  const isVercelPreview =
    process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== 'production';

  const openGraph: NonNullable<Metadata['openGraph']> = {
    title: fullTitle,
    description,
    url: canonicalUrl,
    siteName: SITE_NAME,
    locale: OG_LOCALE[locale],
    type,
  };
  if (type === 'article') {
    if (publishedTime) (openGraph as { publishedTime?: string }).publishedTime = publishedTime;
    if (modifiedTime) (openGraph as { modifiedTime?: string }).modifiedTime = modifiedTime;
    if (tags) (openGraph as { tags?: string[] }).tags = tags;
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    alternates: { canonical: canonicalUrl, languages },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: isVercelPreview
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : undefined,
  };
}

/**
 * Convenience helper for the home route — keeps the per-route generateMetadata
 * call sites in [locale]/page.tsx terse.
 */
export function buildHomeMetadata(locale: Locale, t: (k: string) => string): Metadata {
  return buildMetadata({
    locale,
    path: '',
    title: t('home.brand'),
    description: t('seo.siteDescription'),
    type: 'website',
  });
}
