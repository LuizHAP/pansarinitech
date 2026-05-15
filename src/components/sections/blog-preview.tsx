import { PostCard } from '@/components/blog';
import { RevealGroup, RevealItem } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/lib/i18n/navigation';
import { getPosts } from '@/lib/mdx/blog';
import { getTranslations } from 'next-intl/server';

const MAX_POSTS = 3;

export async function BlogPreview({ locale }: { locale: Locale }) {
  const [posts, t] = await Promise.all([
    getPosts(locale),
    getTranslations({ locale, namespace: 'blogPreview' }),
  ]);

  const recent = posts.slice(0, MAX_POSTS);

  if (recent.length === 0) return null;

  return (
    <section
      id="blog"
      aria-labelledby="blog-preview-heading"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <h2 id="blog-preview-heading" className="text-2xl font-semibold tracking-tight">
        {t('title')}
      </h2>
      <RevealGroup stagger={0.06}>
        <ul className="mt-6 space-y-4">
          {recent.map((post) => (
            <li key={post.slug}>
              <RevealItem>
                <PostCard post={post} locale={locale} />
              </RevealItem>
            </li>
          ))}
        </ul>
      </RevealGroup>
      <p className="mt-6">
        <Link
          href="/blog"
          className="underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          {t('viewAll')}
        </Link>
      </p>
    </section>
  );
}
