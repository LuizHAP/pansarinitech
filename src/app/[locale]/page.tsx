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
import type { Locale } from '@/i18n/routing';
import { buildHomeMetadata } from '@/lib/seo';
// src/app/[locale]/page.tsx — Phase 2 Wave 2 home composition.
// D-24: setRequestLocale(locale) at the top so [locale] stays ● SSG.
//
// Anchor IDs across child sections (so a future Header nav can wire scroll links):
//   #about, #projects, #skills, #now (the preview), #contact
//
// Phase 4 SEO-01: generateMetadata via buildHomeMetadata (centralized in src/lib/seo.ts).
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

  return (
    <>
      <Hero />
      <About />
      <FeaturedProjectsTeaser locale={locale} />
      <PersonalProjects />
      <CareerTimeline />
      <Skills />
      <NowPreview />
      <BlogPreview locale={locale} />
      <Contact />
    </>
  );
}
