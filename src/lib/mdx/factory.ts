// src/lib/mdx/factory.ts — Phase 4 D-01, D-02 (parameterized from Phase 3 loader.ts)
//
// Phase 3 v1 used next-mdx-remote@^6 directly; Phase 4 generalizes the loader
// into a factory keyed on { contentDir, schema, kind } so the SAME pipeline
// serves projects (Phase 3) and blog posts (Phase 4 Plan 04-02).
//
// Repo archived 2026-04-09 but 6.0.0 final stable shipped 2026-02-12.
// 12-month migration target = Fumadocs MDX (CLAUDE.md).
// DO NOT import from 'next-mdx-remote' root — use the '/rsc' subpath.
// DO NOT call serialize() — that's the Pages Router path.
//
// Public surface (per loader instance):
//   - getAllSlugs(): string[]                        — locale-agnostic; one entry per slug
//   - getAll(locale): Loaded<T>[]                    — frontmatter + readingTime (listing pages)
//   - getOne(slug, locale): LoadedWithContent<T>|null — full MDX compile + rawBody
//
// Private:
//   - verifyParity()  — throws on first violation if any <slug>.{en,pt}.mdx is missing its sibling.
//
// All exports are React.cache()-wrapped for build-time dedup across RSC calls.
//
// Security posture (T-04-02):
//   - blockJS / blockDangerousJS defaults preserved (DO NOT pass mdxOptions.format)
//   - mdxComponents map is closed (only Callout/Note/Warning/Stat/pre callable)

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { mdxComponents } from '@/components/mdx';
import type { Locale } from '@/i18n/routing';
import { compileMDX } from 'next-mdx-remote/rsc';
import { cache } from 'react';
import type { ReactElement } from 'react';
import type { z } from 'zod';
import { rehypePlugins, remarkPlugins } from './plugins';
import { calculateReadingTime } from './reading-time';

const FILE_PATTERN = /^([a-z0-9-]+)\.(en|pt)\.mdx$/;

export type Loaded<T> = T & { slug: string; readingTime: { minutes: number } };
export type LoadedWithContent<T> = Loaded<T> & {
  content: ReactElement;
  rawBody: string;
};

export interface MdxLoader<T> {
  getAll(locale: Locale): Promise<Loaded<T>[]>;
  getOne(slug: string, locale: Locale): Promise<LoadedWithContent<T> | null>;
  getAllSlugs(): Promise<string[]>;
}

type FileIndex = {
  // slug -> { en?: filename, pt?: filename }
  perSlug: Map<string, Partial<Record<Locale, string>>>;
};

// Minimal YAML frontmatter parser — only handles the shape ProjectFrontmatter +
// BlogFrontmatter produce. Avoids invoking @mdx-js/mdx for the listing page
// (which only needs metadata) — compileMDX runs on the full MDX body in
// getOne() instead.
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

export function createMdxLoader<T>({
  contentDir,
  schema,
  kind,
}: {
  contentDir: string;
  schema: z.ZodType<T>;
  kind: 'projects' | 'posts';
}): MdxLoader<T> {
  const kindLabel = kind === 'projects' ? 'projects' : 'blog';

  async function indexFiles(): Promise<FileIndex> {
    let entries: string[];
    try {
      entries = await readdir(contentDir);
    } catch (err) {
      // Plan 04-01 ships before content/blog exists — Plan 04-02 adds the
      // first MDX post. Treat missing dir as empty index (NOT a fatal error)
      // so getAllSlugs/getAll return [] cleanly.
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        return { perSlug: new Map() };
      }
      throw new Error(
        `[mdx/factory] Cannot read content directory ${contentDir}: ${(err as Error).message}`,
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
      if (!bucket.en) missing.push(`content/${kindLabel}/${slug}.en.mdx`);
      if (!bucket.pt) missing.push(`content/${kindLabel}/${slug}.pt.mdx`);
    }
    if (missing.length > 0) {
      throw new Error(
        `Bilingual parity violation — missing locale files:\n  - ${missing.join(
          '\n  - ',
        )}\n\nPhase 3 D-05 requires every <slug>.{en,pt}.mdx to ship its sibling locale.`,
      );
    }
  });

  async function readAndParse(
    filename: string,
  ): Promise<{ data: Record<string, unknown>; body: string; raw: string }> {
    const fullPath = join(contentDir, filename);
    const raw = await readFile(fullPath, 'utf8');
    const parsed = parseFrontmatterBlock(raw);
    return { ...parsed, raw };
  }

  function validateFrontmatter(filename: string, data: Record<string, unknown>): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(
        `[mdx/factory] Frontmatter validation failed for content/${kindLabel}/${filename}:\n${
          // biome-ignore lint/suspicious/noExplicitAny: zod error tree
          JSON.stringify((result.error as any).issues ?? result.error, null, 2)
        }`,
      );
    }
    return result.data;
  }

  const getAllSlugs = cache(async (): Promise<string[]> => {
    await verifyParity();
    const { perSlug } = await indexFiles();
    return [...perSlug.keys()].sort();
  });

  const getAll = cache(async (locale: Locale): Promise<Loaded<T>[]> => {
    await verifyParity();
    const { perSlug } = await indexFiles();
    const items: Loaded<T>[] = [];
    for (const [slug, bucket] of perSlug.entries()) {
      const filename = bucket[locale];
      if (!filename) continue;
      const { data, raw, body } = await readAndParse(filename);
      // Drive compileMDX once on the same source to confirm it's parseable +
      // frontmatter round-trips with the @^6 parser. We discard `content`; the
      // listing page only needs metadata. (Pitfall 1: blockJS/blockDangerousJS
      // defaults preserved.)
      const { frontmatter } = await compileMDX<unknown>({
        source: raw,
        options: {
          parseFrontmatter: true,
          // blockJS + blockDangerousJS default to true in next-mdx-remote@6 — KEEP THAT.
        },
      });
      // Cross-validate: our YAML parser and next-mdx-remote's vfile-matter must
      // agree on at least the title (cheap check; any drift means our YAML
      // parser broke).
      if (
        frontmatter &&
        typeof frontmatter === 'object' &&
        'title' in frontmatter &&
        data.title !== (frontmatter as Record<string, unknown>).title
      ) {
        throw new Error(
          `[mdx/factory] Frontmatter parser disagreement on ${filename}: local='${String(
            data.title,
          )}' vs vfile-matter='${String((frontmatter as Record<string, unknown>).title)}'`,
        );
      }
      const validated = validateFrontmatter(filename, data);
      items.push({
        ...validated,
        slug,
        readingTime: calculateReadingTime(body),
      } as Loaded<T>);
    }
    return items;
  });

  const getOne = cache(
    async (slug: string, locale: Locale): Promise<LoadedWithContent<T> | null> => {
      await verifyParity();
      const { perSlug } = await indexFiles();
      const bucket = perSlug.get(slug);
      if (!bucket) return null;
      const filename = bucket[locale];
      if (!filename) return null;
      const { data, raw, body } = await readAndParse(filename);
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
      return {
        ...validated,
        slug,
        readingTime: calculateReadingTime(body),
        content,
        rawBody: body,
      } as LoadedWithContent<T>;
    },
  );

  return { getAll, getOne, getAllSlugs };
}
