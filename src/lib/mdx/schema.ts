// src/lib/mdx/schema.ts — Phase 3 D-04
// Zod schema for case-study frontmatter. Mirrors src/data/schemas.ts pattern (Phase 2).
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
export type Project = ProjectFrontmatter & { slug: string };
export type ProjectWithContent = Project & { content: ReactElement };
