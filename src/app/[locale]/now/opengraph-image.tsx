// src/app/[locale]/now/opengraph-image.tsx — Phase 4 SEO-02
// Now page OG. Reuses existing `now.title` key (Phase 2: "What I'm doing now"
// / "O que estou fazendo agora") — no new message key added.
import type { Locale } from '@/i18n/routing';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og';
import { getTranslations } from 'next-intl/server';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'now' });
  return renderOgImage({ title: t('title'), locale });
}
