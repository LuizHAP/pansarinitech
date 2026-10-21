import { SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { formatDate } from '@/lib/i18n/helpers';
import { Link } from '@/lib/i18n/navigation';
import { getPosts } from '@/lib/mdx/blog';
import { getTranslations } from 'next-intl/server';

const MAX_POSTS = 3;

export async function BlogPreview({ locale }: { locale: Locale }) {
  const [posts, t] = await Promise.all([getPosts(locale), getTranslations({ locale })]);

  const recent = posts.slice(0, MAX_POSTS);

  if (recent.length === 0) return null;

  return (
    <Section
      id="blog"
      ariaLabelledBy="blog-preview-heading"
      surface="paper"
      className="pt-0 md:pt-0"
    >
      <SectionHead
        id="blog-preview-heading"
        title={t('blogPreview.title')}
        comment={t('site.sections.blogComment')}
      />
      <ul className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-x-12 gap-y-10">
        {recent.map((post) => (
          <li key={post.slug} className="flex flex-col gap-3 border-t-2 border-ink pt-6">
            <p className="font-mono text-[13px] text-muted-foreground">
              <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
              {' · '}
              {t('blog.readingTime', { minutes: post.readingTime.minutes })}
            </p>
            <h3 className="text-2xl leading-[1.15] font-bold tracking-[-0.02em]">
              <Link href={`/blog/${post.slug}`} className="hover:text-signal">
                {post.title}
              </Link>
            </h3>
            <p className="line-clamp-3 text-[17px] leading-[1.5] text-muted-foreground">
              {post.excerpt}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-10">
        <Link
          href="/blog"
          className="font-mono text-sm font-semibold underline decoration-signal decoration-2 underline-offset-4 hover:text-signal"
        >
          {t('blogPreview.viewAll')}
        </Link>
      </p>
    </Section>
  );
}
