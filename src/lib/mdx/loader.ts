// src/lib/mdx/loader.ts — Phase 3 D-04, D-05, D-17
//
// Phase 3 v1 uses next-mdx-remote@^6. Repo archived 2026-04-09 but 6.0.0 final
// stable shipped 2026-02-12. 12-month migration target = Fumadocs MDX (CLAUDE.md).
// DO NOT import from 'next-mdx-remote' root — use the '/rsc' subpath.
// DO NOT call serialize() — that's the Pages Router path.
//
// Public surface:
//   - getAllSlugs(): string[]                  — locale-agnostic; one entry per slug
//   - getProjects(locale): Project[]           — frontmatter only (listing page); featured-first, then order asc
//   - getProject(slug, locale): ProjectWithContent | null  — full MDX compile (case-study page)
//
// Private:
//   - verifyParity()  — throws on first violation if any <slug>.{en,pt}.mdx is missing its sibling.
//
// All exports are React.cache()-wrapped for build-time dedup across RSC calls.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { mdxComponents } from '@/components/mdx';
import type { Locale } from '@/i18n/routing';
import { compileMDX } from 'next-mdx-remote/rsc';
import { cache } from 'react';
import { rehypePlugins, remarkPlugins } from './plugins';
import { type Project, ProjectFrontmatter, type ProjectWithContent } from './schema';

const CONTENT_DIR = join(process.cwd(), 'content', 'projects');
const FILE_PATTERN = /^([a-z0-9-]+)\.(en|pt)\.mdx$/;

type FileIndex = {
  // slug -> { en?: filename, pt?: filename }
  perSlug: Map<string, Partial<Record<Locale, string>>>;
};

async function indexFiles(): Promise<FileIndex> {
  let entries: string[];
  try {
    entries = await readdir(CONTENT_DIR);
  } catch (err) {
    throw new Error(
      `[mdx/loader] Cannot read content directory ${CONTENT_DIR}: ${(err as Error).message}`,
    );
  }
  const perSlug = new Map<string, Partial<Record<Locale, string>>>();
  for (const filename of entries) {
    const match = FILE_PATTERN.exec(filename);
    if (!match) continue;
    const [, slug, locale] = match;
    const bucket = perSlug.get(slug) ?? {};
    bucket[locale as Locale] = filename;
    perSlug.set(slug, bucket);
  }
  return { perSlug };
}

const verifyParity = cache(async (): Promise<void> => {
  const { perSlug } = await indexFiles();
  const missing: string[] = [];
  for (const [slug, bucket] of perSlug.entries()) {
    if (!bucket.en) missing.push(`content/projects/${slug}.en.mdx`);
    if (!bucket.pt) missing.push(`content/projects/${slug}.pt.mdx`);
  }
  if (missing.length > 0) {
    throw new Error(
      `Bilingual parity violation — missing locale files:\n  - ${missing.join(
        '\n  - ',
      )}\n\nPhase 3 D-05 requires every <slug>.{en,pt}.mdx to ship its sibling locale.`,
    );
  }
});

export const getAllSlugs = cache(async (): Promise<string[]> => {
  await verifyParity();
  const { perSlug } = await indexFiles();
  return [...perSlug.keys()].sort();
});

// Minimal YAML frontmatter parser — only handles the shape ProjectFrontmatter
// produces. Avoids invoking @mdx-js/mdx for the listing page (which only needs
// metadata) — compileMDX runs on the full MDX body in getProject() instead.
function parseFrontmatterBlock(raw: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(raw);
  if (!fmMatch) {
    return { data: {}, body: raw };
  }
  const [, frontmatterText, body] = fmMatch;
  const data: Record<string, unknown> = {};
  let i = 0;
  const lines = frontmatterText.split(/\r?\n/);
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
      // Block sequence — collect following "- value" lines
      const items: string[] = [];
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
  return { data, body };
}

async function readAndParse(
  filename: string,
): Promise<{ data: Record<string, unknown>; body: string; raw: string }> {
  const fullPath = join(CONTENT_DIR, filename);
  const raw = await readFile(fullPath, 'utf8');
  const parsed = parseFrontmatterBlock(raw);
  return { ...parsed, raw };
}

function validateFrontmatter(filename: string, data: Record<string, unknown>) {
  const result = ProjectFrontmatter.safeParse(data);
  if (!result.success) {
    throw new Error(
      `[mdx/loader] Frontmatter validation failed for content/projects/${filename}:\n${
        // biome-ignore lint/suspicious/noExplicitAny: zod error tree
        JSON.stringify((result.error as any).issues ?? result.error, null, 2)
      }`,
    );
  }
  return result.data;
}

export const getProjects = cache(async (locale: Locale): Promise<Project[]> => {
  await verifyParity();
  const { perSlug } = await indexFiles();
  const projects: Project[] = [];
  for (const [slug, bucket] of perSlug.entries()) {
    const filename = bucket[locale];
    if (!filename) continue;
    const { data, raw } = await readAndParse(filename);
    // Drive compileMDX once on the same source to confirm it's parseable + frontmatter
    // round-trips with the @^6 parser. We discard `content`; the listing page only
    // needs metadata. (Pitfall 1: blockJS/blockDangerousJS defaults preserved.)
    const { frontmatter } = await compileMDX<unknown>({
      source: raw,
      options: {
        parseFrontmatter: true,
        // blockJS + blockDangerousJS default to true in next-mdx-remote@6 — KEEP THAT.
      },
    });
    // Cross-validate: our YAML parser and next-mdx-remote's vfile-matter must agree
    // on at least the title (cheap check; any drift means our YAML parser broke).
    if (
      frontmatter &&
      typeof frontmatter === 'object' &&
      'title' in frontmatter &&
      data.title !== (frontmatter as Record<string, unknown>).title
    ) {
      throw new Error(
        `[mdx/loader] Frontmatter parser disagreement on ${filename}: local='${String(
          data.title,
        )}' vs vfile-matter='${String((frontmatter as Record<string, unknown>).title)}'`,
      );
    }
    const validated = validateFrontmatter(filename, data);
    projects.push({ ...validated, slug });
  }
  // Featured first, then order asc, then slug asc for stable output.
  projects.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.slug.localeCompare(b.slug);
  });
  return projects;
});

export const getProject = cache(
  async (slug: string, locale: Locale): Promise<ProjectWithContent | null> => {
    await verifyParity();
    const { perSlug } = await indexFiles();
    const bucket = perSlug.get(slug);
    if (!bucket) return null;
    const filename = bucket[locale];
    if (!filename) return null;
    const { data, raw } = await readAndParse(filename);
    const validated = validateFrontmatter(filename, data);
    const { content } = await compileMDX<unknown>({
      source: raw,
      components: mdxComponents,
      options: {
        parseFrontmatter: true,
        // blockJS + blockDangerousJS default to true in next-mdx-remote@6 — KEEP THAT.
        mdxOptions: { remarkPlugins, rehypePlugins },
      },
    });
    return { ...validated, slug, content };
  },
);
