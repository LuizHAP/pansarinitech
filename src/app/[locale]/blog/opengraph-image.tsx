// src/app/[locale]/blog/opengraph-image.tsx — Phase 4 SEO-02
// Blog listing OG. Reuses `blog.pageTitle` key (added in Plan 04-01).
import type { Locale } from '@/i18n/routing';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og';
import { getTranslations } from 'next-intl/server';

export const alt = 'Blog — Luiz Pansarini';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return renderOgImage({ title: t('pageTitle'), locale });
}
