import { CaseStudyHero } from '@/components/sections/case-study-hero';
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
  setRequestLocale(locale);

  const project = await getProject(slug, locale);
  if (!project) notFound();

  return (
    <article>
      <CaseStudyHero project={project} locale={locale} />
      <div className="prose prose-neutral mx-auto max-w-3xl px-4 py-8 dark:prose-invert">
        {project.content}
      </div>
    </article>
  );
}
