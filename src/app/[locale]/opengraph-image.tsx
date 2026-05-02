// src/app/[locale]/opengraph-image.tsx — Phase 4 SEO-02, SEO-03 (home OG)
// Per-route OG file. Node.js runtime (default) — renderOgImage reads the Geist
// Bold subset via node:fs/promises. Reuses existing `home.brand` message key.
import type { Locale } from '@/i18n/routing';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og';
import { getTranslations } from 'next-intl/server';

export const alt = 'Luiz Pansarini — Principal Software Engineer';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return renderOgImage({ title: t('home.brand'), locale });
}
