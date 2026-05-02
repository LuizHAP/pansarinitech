// src/app/[locale]/blog/[slug]/opengraph-image.tsx — Phase 4 SEO-02, SEO-03
// Per-post OG. Title sourced from frontmatter via getPost. Draft posts in
// production return null → notFound() (T-04-13: prevents draft titles leaking
// via /blog/<slug>/opengraph-image even if the slug is guessed).
import type { Locale } from '@/i18n/routing';
import { getPost } from '@/lib/mdx/blog';
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
  const post = await getPost(slug, locale);
  if (!post) notFound();
  return renderOgImage({ title: post.title, locale });
}
