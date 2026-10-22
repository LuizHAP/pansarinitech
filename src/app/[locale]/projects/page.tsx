import JsonLd, { buildBreadcrumbList } from '@/components/json-ld';
import { HERO_IMAGES } from '@/components/sections/featured-projects-teaser';
import { BrowserCard, SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { getProjects } from '@/lib/mdx/projects';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects' });
  return buildMetadata({
    locale,
    path: '/projects',
    title: t('title'),
    description: t('listingDescription'),
  });
}
// src/app/[locale]/projects/page.tsx — Phase 3 D-21, D-22
// Listing page — RSC. Stays ● SSG via setRequestLocale + frontmatter-only
// loader.getProjects(locale). Cards link via @/lib/i18n/navigation Link to
// preserve the locale prefix on the slug route.
export default async function ProjectsListingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const projects = await getProjects(locale);

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbList([
          { name: 'Home', path: '' },
          { name: t('projects.title'), path: '/projects' },
        ])}
      />
      <Section ariaLabelledBy="projects-heading" surface="ink" className="md:pt-24">
        <SectionHead
          as="h1"
          id="projects-heading"
          title={t('projects.title')}
          comment={t('site.pages.projectsCommand')}
        />
        <p className="mt-8 max-w-2xl text-[17px] leading-[1.55] text-ink-body md:text-lg">
          {t('projects.listingIntro')}
        </p>
        <ul className="mt-14 grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-x-7 gap-y-12">
          {projects.map((p, index) => (
            <li key={p.slug} className="flex flex-col">
              <BrowserCard
                href={`/projects/${p.slug}`}
                url={`pansarini.tech/projects/${p.slug}`}
                title={p.title}
                meta={`${p.role} · ${p.year}`}
                image={HERO_IMAGES[p.slug as keyof typeof HERO_IMAGES]}
                alt=""
                eager={index === 0}
                headingLevel="h2"
              />
              <p className="mt-3 text-[15px] leading-[1.5] text-ink-body">{p.blurb}</p>
              <p className="mt-3 font-mono text-xs text-ink-muted">
                {p.stack.slice(0, 5).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
