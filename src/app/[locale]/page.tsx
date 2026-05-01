// src/app/[locale]/page.tsx — D-24 setRequestLocale; placeholder home (Phase 2 replaces with Hero)
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: 'en' | 'pt' }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 lg:py-24">
      <h1 className="text-3xl font-bold">{t('brand')}</h1>
      <p className="mt-4 text-muted-foreground">{t('placeholder')}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t('shellNote')}</p>
    </section>
  );
}
