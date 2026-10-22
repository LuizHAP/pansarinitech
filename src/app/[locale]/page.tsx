import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld';
import {
  About,
  BlogPreview,
  CareerTimeline,
  Contact,
  FeaturedProjectsTeaser,
  Hero,
  NowPreview,
  PersonalProjects,
  Skills,
} from '@/components/sections';
import { Marquee } from '@/components/site';
import type { Locale } from '@/i18n/routing';
import { buildHomeMetadata } from '@/lib/seo';
// setRequestLocale(locale) runs first so [locale] stays statically rendered.
// The command palette scrolls to these ids: #hero, #about, #projects, #skills, #career, #contact
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return buildHomeMetadata(locale, t);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'site.marquee' });

  return (
    <>
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Luiz Pansarini',
          url: SITE_URL,
          inLanguage: ['en', 'pt-BR'],
          publisher: AUTHOR_PERSON,
        }}
      />
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          ...AUTHOR_PERSON,
          url: SITE_URL,
        }}
      />
      <Hero />
      <Marquee words={t.raw('words') as string[]} label={t('label')} />
      <About />
      <FeaturedProjectsTeaser locale={locale} />
      <PersonalProjects />
      <Skills />
      <CareerTimeline />
      <NowPreview />
      <BlogPreview locale={locale} />
      <Contact />
    </>
  );
}
