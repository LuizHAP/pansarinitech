// src/app/[locale]/projects/opengraph-image.tsx — Phase 4 SEO-02
// Projects listing OG. Reuses existing `projects.title` key (Phase 3:
// "Projects" / "Projetos") — no new message key added.
import type { Locale } from '@/i18n/routing';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og';
import { getTranslations } from 'next-intl/server';

export const alt = 'Projects — Luiz Pansarini';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects' });
  return renderOgImage({ title: t('title'), locale });
}
