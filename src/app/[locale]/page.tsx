import { About } from '@/components/sections/about';
import { CareerTimeline } from '@/components/sections/career-timeline';
import { Contact } from '@/components/sections/contact';
import { FeaturedProjectsTeaser } from '@/components/sections/featured-projects-teaser';
import { Hero } from '@/components/sections/hero';
import { NowPreview } from '@/components/sections/now-preview';
import { Skills } from '@/components/sections/skills';
import type { Locale } from '@/i18n/routing';
// src/app/[locale]/page.tsx — Phase 2 Wave 2 home composition.
// D-24: setRequestLocale(locale) at the top so [locale] stays ● SSG.
//
// Anchor IDs across child sections (so a future Header nav can wire scroll links):
//   #about, #projects, #skills, #now (the preview), #contact
import { setRequestLocale } from 'next-intl/server';

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
      <CareerTimeline />
      <Skills />
      <NowPreview />
      <Contact />
    </>
  );
}
