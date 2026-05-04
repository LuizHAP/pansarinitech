// src/app/[locale]/blog/[slug]/page.tsx — Phase 4 BLOG-02, BLOG-03, BLOG-05, SEO-01
// Async RSC. Stays ● SSG via setRequestLocale + generateStaticParams.
//
// generateStaticParams sources slugs from getPosts('en') (which applies the
// NODE_ENV draft filter), NOT getAllPostSlugs — Pitfall #11 (T-04-12).
// Three-layer draft defense: (1) generateStaticParams omits drafts, (2) getPost
// returns null for drafts in production → notFound(), (3) per-route OG image
// also calls getPost → 404.
//
// TOC components render only when extractToc returns ≥1 entry (default
// threshold 1000 words; CONTEXT D-07).
import { TocMobile, TocSidebar } from '@/components/blog';
import { type Locale, routing } from '@/i18n/routing';
import { formatDate } from '@/lib/i18n/helpers';
import { Link } from '@/lib/i18n/navigation';
import { getPost, getPosts } from '@/lib/mdx/blog';
import { extractToc } from '@/lib/mdx/toc';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  // T-04-12: derive from getPosts (draft filter applied), NOT getAllPostSlugs.
  const publishedSlugs = (await getPosts('en')).map((p) => p.slug);
  return routing.locales.flatMap((locale) => publishedSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale)) return {};
  const post = await getPost(slug, locale);
  if (!post) return {};
  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.title,
    description: post.excerpt,
    type: 'article',
    publishedTime: post.date,
    tags: post.tags,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const post = await getPost(slug, locale);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });
  const tToc = await getTranslations({ locale, namespace: 'mdx.toc' });
  const toc = extractToc(post.rawBody);

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
      <div className="min-w-0">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground decoration-primary hover:underline"
        >
          {t('cta.backToBlog')}
        </Link>
        <header className="mt-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{post.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
            {' · '}
            {t('readingTime', { minutes: post.readingTime.minutes })}
          </p>
          {post.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag} className="text-xs text-muted-foreground">
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        <TocMobile entries={toc} label={tToc('label')} />

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">{post.content}</div>
      </div>

      <TocSidebar entries={toc} label={tToc('label')} />
    </article>
  );
}
