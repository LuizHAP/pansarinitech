import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld';
import { CaseStudyHero } from '@/components/sections';
import { type Locale, routing } from '@/i18n/routing';
import { getAllSlugs, getProject } from '@/lib/mdx/projects';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
// src/app/[locale]/projects/[slug]/page.tsx — Phase 3 D-21, D-23
// Case study page — async RSC. Stays ● SSG via setRequestLocale +
// generateStaticParams enumerating all (locale, slug) combos.
import { notFound } from 'next/navigation';

// 3 slugs × 2 locales = 6 entries. All ● SSG.
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale)) return {};
  const project = await getProject(slug, locale);
  if (!project) return {};
  return buildMetadata({
    locale,
    path: `/projects/${slug}`,
    title: project.title,
    description: project.blurb,
    type: 'article',
    tags: project.stack,
  });
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const project = await getProject(slug, locale);
  if (!project) notFound();

  return (
    <article>
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: project.title,
          description: project.blurb,
          author: AUTHOR_PERSON,
          publisher: AUTHOR_PERSON,
          datePublished: `${project.year}-01-01`,
          url: `${SITE_URL}/projects/${slug}`,
          inLanguage: locale === 'pt' ? 'pt-BR' : 'en',
          keywords: project.stack.join(', '),
          image: /^https?:\/\//.test(project.heroImage)
            ? project.heroImage
            : `${SITE_URL}/${project.heroImage.replace(/^\.?\//, '')}`,
          wordCount: Math.round(project.readingTime.minutes * 200),
        }}
      />
      <CaseStudyHero project={project} locale={locale} />
      <div className="prose prose-neutral mx-auto max-w-3xl px-4 py-8 dark:prose-invert prose-headings:scroll-mt-20 prose-h2:mt-10 prose-h2:pb-3 prose-h2:font-semibold prose-h2:tracking-tight prose-h2:border-b prose-h2:border-border prose-h3:mt-8 prose-h3:font-semibold prose-h3:tracking-tight prose-a:text-primary prose-a:decoration-primary prose-a:font-normal prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-sm prose-code:font-mono prose-code:text-foreground">
        {project.content}
      </div>
    </article>
  );
}
