// src/app/[locale]/blog/feed/route.ts — Phase 12 CASE-21, CASE-22, CASE-23
// RSS 2.0 route handler — generates XML dynamically at request time.
// Picks up new posts automatically without rebuild.
import { SITE_URL } from '@/components/json-ld';
import type { Locale } from '@/i18n/routing';
import { getPosts } from '@/lib/mdx/blog';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = await getPosts(locale as Locale);
  const feedPosts = posts.slice(0, 20);
  const xml = generateRss({ locale, posts: feedPosts });
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}

function generateRss({
  locale,
  posts,
}: {
  locale: string;
  posts: { title: string; date: string; excerpt: string; slug: string }[];
}): string {
  const language = locale === 'pt' ? 'pt-BR' : 'en';
  const feedTitle = 'Luiz Pansarini — Blog';
  const feedUrl = locale === 'pt' ? `${SITE_URL}/feed.pt.xml` : `${SITE_URL}/feed.xml`;
  const channelLink = `${SITE_URL}/blog`;
  const lastBuildDate = posts[0]?.date
    ? new Date(posts[0].date).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map(
      (p) =>
        `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.excerpt)}</description>
      <guid>${SITE_URL}/blog/${p.slug}</guid>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${channelLink}</link>
    <description>Principal Software Engineer — technical writing</description>
    <language>${language}</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
