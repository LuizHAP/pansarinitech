import { PreviewViewer } from '@/components/preview/preview-viewer';
import { clientPreviews, getClientPreview } from '@/data/client-previews';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return clientPreviews.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const preview = getClientPreview(slug);
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
  const preview = getClientPreview(slug);
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
