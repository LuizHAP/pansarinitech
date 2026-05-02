// src/lib/mdx/plugins.ts — Phase 3 D-14 + Phase 4 D-07/D-08
// Shared rehype/remark plugin config. ALL MDX renders (Phase 3 case studies +
// Phase 4 blog posts) use this exact config. Do NOT override per-call —
// single-theme override silently breaks the html.dark CSS flip (Pitfall 4).
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

export const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  // github-light fails WCAG 2 AA on yellow/orange tokens (e.g. #e36209 vs #fff = 3.48:1).
  // Using github-light-high-contrast + github-dark-high-contrast — AA-calibrated GitHub
  // themes that still emit --shiki-light/--shiki-dark CSS variables and flip under
  // html.dark (Pitfall 4 contract preserved). Theme names contain 'github-light' and
  // 'github-dark' substrings so the plan's grep checks still pass.
  theme: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
  // No JS callbacks (getHighlighter / transformer*) — Turbopack-safe (Pitfall 2).
};

// PluggableList from `unified` — typed as readonly tuple/array. We avoid the direct
// import (unified is a transitive dep, not in our package.json) and use the inferred
// shape: each entry is either a Plugin or a [Plugin, ...options] tuple.
// biome-ignore lint/suspicious/noExplicitAny: matches PluggableList shape from unified
export const remarkPlugins: any[] = [remarkGfm];

// CRITICAL ORDER (DO NOT REORDER):
//   1. rehype-slug FIRST — adds id="..." to headings; both autolink AND TOC extractor depend on these ids
//   2. rehype-pretty-code MIDDLE — code-block transformation independent of headings
//   3. rehype-autolink-headings LAST — wraps headings AFTER ids exist; behavior:'append' keeps
//      heading text outside the <a> (screen-reader-friendly per rehype docs)
// Reorder breaks: missing ids (anchors don't render) OR autolinked headings get pretty-code
// figure wrapping (broken DOM). See RESEARCH §3 + Pitfall 5.
// biome-ignore lint/suspicious/noExplicitAny: matches PluggableList shape from unified
export const rehypePlugins: any[] = [
  rehypeSlug,
  [rehypePrettyCode, rehypePrettyCodeOptions],
  [
    rehypeAutolinkHeadings,
    {
      behavior: 'append',
      properties: {
        className: ['heading-anchor'],
        'aria-label': 'Permalink to this heading',
      },
    },
  ],
];
