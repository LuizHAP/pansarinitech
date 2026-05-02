// src/app/[locale]/blog/page.tsx — Phase 4 BLOG-01, BLOG-05, SEO-01
// Listing page — async RSC. Stays ● SSG via setRequestLocale + frontmatter-only
// loader.getPosts(locale). Cards link via @/lib/i18n/navigation Link to preserve
// the locale prefix on the slug route.
import { PostCard } from '@/components/blog/post-card';
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
    title: t('pageTitle'),
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

  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = await getPosts(locale);

  return (
    <section aria-labelledby="blog-heading" className="mx-auto max-w-3xl px-4 py-12">
      <h1 id="blog-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('pageTitle')}
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">{t('listingIntro')}</p>
      <ul className="mt-8 space-y-6">
        {posts.length === 0 ? (
          <li className="text-muted-foreground">{t('noPosts')}</li>
        ) : (
          posts.map((p) => (
            <li key={p.slug}>
              <PostCard post={p} locale={locale} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
