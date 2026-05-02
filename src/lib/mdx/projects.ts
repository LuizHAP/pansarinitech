// src/lib/mdx/projects.ts — Phase 4 D-02
//
// Thin wrapper over createMdxLoader for Phase 3 case-study content. Public API
// matches the legacy loader.ts: getProjects / getProject / getAllSlugs.
import { join } from 'node:path';
import { createMdxLoader } from './factory';
import { ProjectFrontmatter } from './schema';

const loader = createMdxLoader({
  contentDir: join(process.cwd(), 'content', 'projects'),
  schema: ProjectFrontmatter,
  kind: 'projects',
});

// Featured first, then order asc, then slug asc — preserves the Phase 3
// listing-page contract exactly.
export const getProjects = async (
  locale: Parameters<typeof loader.getAll>[0],
): Promise<Awaited<ReturnType<typeof loader.getAll>>> => {
  const items = await loader.getAll(locale);
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.slug.localeCompare(b.slug);
  });
};

export const getProject = loader.getOne;
export const getAllSlugs = loader.getAllSlugs;
