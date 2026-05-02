import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';
// src/components/sections/featured-projects-teaser.tsx — RSC
// Phase 2 placeholder: 3 cards (title + role + year only). Phase 3 fills with MDX
// case studies. Section copy explains the deferral so visitors know why the cards are
// thin. id="projects" for future header nav anchor.
import { useLocale, useTranslations } from 'next-intl';

type Teaser = {
  id: string;
  title: { en: string; pt: string };
  role: { en: string; pt: string };
  year: string;
};

const teasers: Teaser[] = [
  {
    id: 'machinery-partner-ecommerce',
    title: {
      en: 'Heavy machinery e-commerce',
      pt: 'E-commerce de máquinas pesadas',
    },
    role: {
      en: 'Machinery Partner · Principal Engineer',
      pt: 'Machinery Partner · Principal Engineer',
    },
    year: '2024–present',
  },
  {
    id: 'no-code-migration',
    title: {
      en: 'No-code → Next.js migration',
      pt: 'Migração de no-code para Next.js',
    },
    role: {
      en: 'Machinery Partner · Tech Lead',
      pt: 'Machinery Partner · Tech Lead',
    },
    year: '2025',
  },
  {
    id: 'magalu-superapp',
    title: {
      en: 'Magazine Luiza Superapp',
      pt: 'Superapp Magazine Luiza',
    },
    role: {
      en: 'Luizalabs · Senior Engineer',
      pt: 'Luizalabs · Senior Engineer',
    },
    year: '2021–2023',
  },
];

export function FeaturedProjectsTeaser() {
  const locale = useLocale() as Locale;
  const tSec = useTranslations('sections');

  return (
    <section
      id="projects"
      aria-labelledby="featured-projects-heading"
      className="mx-auto max-w-5xl px-4 py-12"
    >
      <h2 id="featured-projects-heading" className="text-2xl font-semibold tracking-tight">
        {tSec('featuredProjects')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{tSec('featuredProjectsTeaserNote')}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teasers.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-base">{p.title[locale]}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.role[locale]}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tSec('featuredProjectsCardYear')}: {p.year}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
