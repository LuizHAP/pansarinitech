import type { Locale } from '@/i18n/routing';
import { formatDate } from '@/lib/i18n/helpers';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';

type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  readingTime: { minutes: number };
};

export async function PostCard({ post, locale }: { post: Post; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'blog' });
  return (
    <article className="flex h-full flex-col gap-3 border-t-2 border-foreground pt-6">
      <p className="font-mono text-[13px] text-muted-foreground">
        <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
        {' · '}
        {t('readingTime', { minutes: post.readingTime.minutes })}
      </p>
      <h2 className="font-display text-[clamp(26px,3vw,32px)] leading-[1.1] font-bold tracking-[-0.03em] text-balance">
        <Link
          href={`/blog/${post.slug}`}
          className="underline-offset-4 hover:text-primary hover:underline"
        >
          {post.title}
        </Link>
      </h2>
      <p className="line-clamp-3 text-[17px] leading-[1.5] text-muted-foreground">{post.excerpt}</p>
      {post.tags.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 font-mono text-xs text-muted-foreground">
          {post.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
