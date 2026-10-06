import { PreviewViewer } from '@/components/preview/preview-viewer';
import { clientPreviews } from '@/data/client-previews';
import { findClientPreview, getPreviewIndex, isPreviewSlug } from '@/lib/client-preview-source';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

// The page re-reads the cached Blob index (5 min, tag client-previews) at most once a minute.
export const revalidate = 60;

export async function generateStaticParams() {
  const { previews } = await getPreviewIndex();
  const slugs = new Set([
    ...clientPreviews.map(({ slug }) => slug),
    ...previews
      .filter((preview) => preview.hasIndex && !preview.disabled && isPreviewSlug(preview.slug))
      .map(({ slug }) => slug),
  ]);
  return Array.from(slugs, (slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const preview = await findClientPreview(slug);
  if (!preview) notFound();

  const t = await getTranslations({ locale: preview.locale, namespace: 'preview' });
  const title = t('metaTitle', { client: preview.client });
  const description = t('metaDescription', { client: preview.client });

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
    openGraph: { title, description, siteName: 'Luiz Pansarini', type: 'website' },
  };
}

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const preview = await findClientPreview(slug);
  if (!preview) notFound();

  setRequestLocale(preview.locale);
  const t = await getTranslations('preview');

  return (
    <PreviewViewer
      client={preview.client}
      src={`/client-previews/${preview.slug}/index.html`}
      labels={{
        preview: t('label'),
        brand: t('brandAriaLabel'),
        viewport: t('viewport'),
        desktop: t('desktop'),
        mobile: t('mobile'),
        frame: t('frameTitle', { client: preview.client }),
      }}
    />
  );
}
