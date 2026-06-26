// src/components/blog/post-card.tsx — Phase 4 BLOG-01
// Server component. Renders title (Link to /blog/[slug]) + ISO date (locale-aware
// via Phase 2 formatDate) + reading time (via t('readingTime', { minutes })) +
// excerpt + tag chips. Card uses theme tokens (bg-card / text-card-foreground)
// so axe-matrix contrast holds across Jedi + Sith palettes.
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
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
    <Link
      href={`/blog/${post.slug}`}
      className="block transition hover:-translate-y-0.5 hover:shadow-md"
      scroll={true}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
            {' · '}
            {t('readingTime', { minutes: post.readingTime.minutes })}
          </p>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
          {post.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
