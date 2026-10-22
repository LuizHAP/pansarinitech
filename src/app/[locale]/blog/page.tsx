// src/app/[locale]/blog/page.tsx — Phase 4 BLOG-01, BLOG-05, SEO-01
// Listing page — async RSC. Stays ● SSG via setRequestLocale + frontmatter-only
// loader.getPosts(locale). Cards link via @/lib/i18n/navigation Link to preserve
// the locale prefix on the slug route.
import { PostCard } from '@/components/blog';
import JsonLd, { buildBreadcrumbList } from '@/components/json-ld';
import { SectionHead } from '@/components/site';
import { Section, sectionContainer } from '@/components/ui';
import { type Locale, routing } from '@/i18n/routing';
import { getPosts } from '@/lib/mdx/blog';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  return buildMetadata({
    locale,
    path: '/blog',
    title: t('seoTitle'),
    description: t('listingIntro'),
  });
}

export default async function BlogListingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const posts = await getPosts(locale);

  return (
    <>
      <JsonLd
        schema={buildBreadcrumbList([
          { name: 'Home', path: '' },
          { name: t('blog.pageTitle'), path: '/blog' },
        ])}
      />
      <link rel="alternate" type="application/rss+xml" title="Blog (EN)" href="/feed.xml" />
      <link rel="alternate" type="application/rss+xml" title="Blog (PT)" href="/feed.pt.xml" />
      <Section ariaLabelledBy="blog-heading" surface="ink" className="pb-16 md:pt-24 md:pb-20">
        <SectionHead
          as="h1"
          id="blog-heading"
          title={t('blog.pageTitle')}
          comment={t('site.pages.blogCommand')}
        />
        <p className="mt-8 max-w-2xl text-[17px] leading-[1.55] text-ink-body md:text-lg">
          {t('blog.listingIntro')}
        </p>
      </Section>
      <div className="surface-paper">
        <div className={`${sectionContainer} py-16 md:py-24`}>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">{t('blog.noPosts')}</p>
          ) : (
            <ul className="grid gap-x-12 gap-y-12 md:grid-cols-2">
              {posts.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
