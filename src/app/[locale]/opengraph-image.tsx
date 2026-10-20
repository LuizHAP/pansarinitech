// Stays on the Node.js runtime: renderOgImage reads the font subset with node:fs/promises.
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
