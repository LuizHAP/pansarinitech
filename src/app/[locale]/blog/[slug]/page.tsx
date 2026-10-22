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
import JsonLd, { AUTHOR_PERSON, SITE_URL, buildBreadcrumbList } from '@/components/json-ld';
import { sectionContainer } from '@/components/ui';
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
  const tSite = await getTranslations({ locale, namespace: 'site.pages' });
  const toc = extractToc(post.rawBody);

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbList([
          { name: 'Home', path: '' },
          { name: t('pageTitle'), path: '/blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <link rel="alternate" type="application/rss+xml" title="Blog (EN)" href="/feed.xml" />
      <link rel="alternate" type="application/rss+xml" title="Blog (PT)" href="/feed.pt.xml" />
      <article>
        <JsonLd
          schema={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt,
            author: AUTHOR_PERSON,
            publisher: AUTHOR_PERSON,
            datePublished: post.date,
            url: `${SITE_URL}/blog/${post.slug}`,
            inLanguage: locale === 'pt' ? 'pt-BR' : 'en',
            keywords: post.tags.join(', '),
            image: `${SITE_URL}/${locale}/blog/${post.slug}/opengraph-image`,
            wordCount: Math.round(post.readingTime.minutes * 200),
          }}
        />
        <header className="surface-ink">
          <div className={`${sectionContainer} pt-14 pb-16 md:pt-20 md:pb-24`}>
            <Link
              href="/blog"
              className="font-mono text-sm text-ink-muted underline decoration-signal-soft decoration-2 underline-offset-4 hover:text-paper"
            >
              {tSite('backToBlog')}
            </Link>
            <p className="mt-10 font-mono text-sm text-ink-muted">
              <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
              {' · '}
              {t('readingTime', { minutes: post.readingTime.minutes })}
            </p>
            <h1 className="mt-4 max-w-5xl font-display text-[clamp(40px,6vw,84px)] leading-[0.95] font-extrabold tracking-[-0.045em] text-balance [overflow-wrap:anywhere]">
              {post.title}
            </h1>
            {post.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px] text-ink-body">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <span className="text-signal-soft">#</span>
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        <div className="surface-paper">
          <div
            className={`${sectionContainer} py-16 md:py-24 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16`}
          >
            <div className="w-full max-w-3xl min-w-0">
              <TocMobile entries={toc} label={tToc('label')} />

              <div className="prose prose-neutral max-w-none prose-headings:scroll-mt-20 prose-headings:font-display prose-headings:text-foreground prose-h2:mt-12 prose-h2:pb-3 prose-h2:font-extrabold prose-h2:tracking-[-0.03em] prose-h2:border-b-2 prose-h2:border-foreground prose-h3:mt-8 prose-h3:font-bold prose-h3:tracking-[-0.02em] prose-p:text-pretty prose-a:text-primary prose-a:decoration-primary prose-a:font-normal prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-sm prose-code:font-mono prose-code:text-foreground">
                {post.content}
              </div>
            </div>

            <TocSidebar entries={toc} label={tToc('label')} />
          </div>
        </div>
      </article>
    </>
  );
}
