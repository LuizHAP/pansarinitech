// src/lib/mdx/blog.ts — Phase 4 D-01, D-03, D-06
//
// Thin wrapper over createMdxLoader for blog posts. Single source of truth for
// blog draft gating per RESEARCH §12. NODE_ENV !== 'production' shows drafts
// (local dev). On Vercel preview AND production builds, NODE_ENV ===
// 'production' so drafts are hidden — intended (safer; no leak via shared
// preview URLs).
//
// T-04-03: getStaticParams in route handlers MUST derive paths from
// (await getPosts(locale)).map(p => p.slug), NOT from getAllPostSlugs(),
// otherwise drafts leak as 404-able routes in production builds.
import { join } from 'node:path';
import type { Locale } from '@/i18n/routing';
import { createMdxLoader } from './factory';
import { BlogFrontmatter } from './schema';

const loader = createMdxLoader({
  contentDir: join(process.cwd(), 'content', 'blog'),
  schema: BlogFrontmatter,
  kind: 'posts',
});

export const includeDrafts = process.env.NODE_ENV !== 'production';

export const getPosts = async (locale: Locale) => {
  const all = await loader.getAll(locale);
  const filtered = includeDrafts ? all : all.filter((p) => !p.draft);
  // Sort newest-first by ISO date (string compare safe with YYYY-MM-DD)
  return filtered.sort((a, b) => b.date.localeCompare(a.date));
};

export const getPost = async (slug: string, locale: Locale) => {
  const post = await loader.getOne(slug, locale);
  if (!post) return null;
  if (post.draft && !includeDrafts) return null;
  return post;
};

export const getAllPostSlugs = loader.getAllSlugs;
