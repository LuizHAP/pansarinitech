// src/app/[locale]/projects/[slug]/opengraph-image.tsx — Phase 4 SEO-02, SEO-03
// Per-project case-study OG. Title sourced from frontmatter via getProject;
// 404 if slug missing (defense-in-depth alongside the route's notFound()).
import type { Locale } from '@/i18n/routing';
import { getProject } from '@/lib/mdx/projects';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og';
import { notFound } from 'next/navigation';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const project = await getProject(slug, locale);
  if (!project) notFound();
  return renderOgImage({ title: project.title, locale });
}
