// src/lib/mdx/schema.ts — Phase 3 D-04 + Phase 4 D-04
// Zod schemas for case-study + blog frontmatter. Mirrors src/data/schemas.ts pattern (Phase 2).
import type { ReactElement } from 'react';
import { z } from 'zod';

export const ProjectFrontmatter = z.object({
  title: z.string().min(1),
  role: z.string().min(1),
  year: z.number().int().min(2018).max(2030),
  stack: z.array(z.string().min(1)).min(1),
  blurb: z.string().min(20).max(280),
  heroImage: z.string().min(1),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(true),
  order: z.number().int().min(1).default(99),
});

export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatter>;
export type Project = ProjectFrontmatter & { slug: string; readingTime: { minutes: number } };
export type ProjectWithContent = Project & { content: ReactElement; rawBody: string };

// Phase 4 D-04 — Blog post frontmatter. ISO-8601 date (YYYY-MM-DD), short excerpt
// for list/cards/OG, optional draft flag (gated by NODE_ENV in src/lib/mdx/blog.ts).
export const BlogFrontmatter = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  excerpt: z.string().min(40).max(280),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

export type BlogFrontmatter = z.infer<typeof BlogFrontmatter>;
export type Post = BlogFrontmatter & { slug: string; readingTime: { minutes: number } };
export type PostWithContent = Post & { content: ReactElement; rawBody: string };
