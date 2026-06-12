#!/usr/bin/env node
// scripts/generate-feed.mjs — Generate static RSS feeds at build time.
// Run before `next build` so feeds are served as static assets (SSG).
// This avoids the `[locale]` route tree being forced dynamic by route.ts.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://pansarini.tech';

const BLOG_DIR = join(process.cwd(), 'content', 'blog');
const FILE_PATTERN = /^([a-z0-9-]+)\.(en|pt)\.mdx$/;

function parseFrontmatter(raw) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(raw);
  if (!fm) return null;
  const [, text] = fm;
  const data = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!m) {
      i += 1;
      continue;
    }
    const [, key, rest] = m;
    const trimmed = rest.trim();
    if (trimmed === '') {
      const items = [];
      i += 1;
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, '').replace(/^"(.*)"$|^'(.*)'$/, '$1$2'));
        i += 1;
      }
      data[key] = items;
      continue;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1).trim();
      data[key] =
        inner === ''
          ? []
          : inner.split(',').map((v) => v.trim().replace(/^"(.*)"$|^'(.*)'$/, '$1$2'));
    } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      data[key] = Number(trimmed);
    } else if (trimmed === 'true' || trimmed === 'false') {
      data[key] = trimmed === 'true';
    } else {
      data[key] = trimmed.replace(/^"(.*)"$|^'(.*)'$/, '$1$2');
    }
    i += 1;
  }
  return data;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRss({ locale, posts }) {
  const language = locale === 'pt' ? 'pt-BR' : 'en';
  const feedTitle = 'Luiz Pansarini — Blog';
  const feedUrl = locale === 'pt' ? `${SITE_URL}/feed.pt.xml` : `${SITE_URL}/feed.xml`;
  const channelLink = `${SITE_URL}/blog`;
  const lastBuildDate = posts[0]?.date
    ? new Date(posts[0].date).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map(
      (p) => `    <item>
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

async function loadPosts(locale) {
  const entries = await readdir(BLOG_DIR);
  const posts = [];
  for (const filename of entries) {
    const match = FILE_PATTERN.exec(filename);
    if (!match) continue;
    const [, slug, fileLocale] = match;
    if (fileLocale !== locale) continue;
    const raw = await readFile(join(BLOG_DIR, filename), 'utf8');
    const fm = parseFrontmatter(raw);
    if (!fm || fm.draft) continue;
    posts.push({ title: fm.title, date: fm.date, excerpt: fm.excerpt, slug });
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts.slice(0, 20);
}

async function main() {
  try {
    const enPosts = await loadPosts('en');
    const ptPosts = await loadPosts('pt');

    await writeFile(
      join(process.cwd(), 'public', 'feed.xml'),
      generateRss({ locale: 'en', posts: enPosts }),
      'utf8',
    );
    console.log('Generated public/feed.xml');

    await writeFile(
      join(process.cwd(), 'public', 'feed.pt.xml'),
      generateRss({ locale: 'pt', posts: ptPosts }),
      'utf8',
    );
    console.log('Generated public/feed.pt.xml');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No blog directory found, skipping feed generation');
      return;
    }
    console.error('Feed generation failed:', err.message);
    process.exit(1);
  }
}

main();
