// src/lib/mdx/toc.ts — Phase 4 D-07
//
// Hand-rolled TOC extractor. Returns typed TocEntry[] (h2 + h3 only) using
// github-slugger for id parity with rehype-slug (Pitfall #12 — github-slugger
// is rehype-slug's internal slugifier; same package + same version => same ids).
//
// NOT the npm `rehype-toc` package (that injects nodes into the AST; we want
// pure data for a sidebar component).
//
// Threshold-gated: short posts get [] (no TOC clutter on 200-word notes).
import GithubSlugger from 'github-slugger';

export type TocEntry = { id: string; text: string; level: 2 | 3 };

const HEADING_LINE = /^(##|###)\s+(.+?)\s*$/gm;
const FENCED_CODE = /^```[\s\S]*?^```$/gm;

export function extractToc(
  body: string,
  options: { wordCountThreshold?: number } = {},
): TocEntry[] {
  const wordCount = body.replace(FENCED_CODE, ' ').split(/\s+/).filter(Boolean).length;
  const threshold = options.wordCountThreshold ?? 1000;
  if (wordCount <= threshold) return [];

  // Strip fenced code so `## a heading` inside a code sample is not picked up.
  const proseOnly = body.replace(FENCED_CODE, '');
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let match: RegExpExecArray | null;
  HEADING_LINE.lastIndex = 0;
  match = HEADING_LINE.exec(proseOnly);
  while (match !== null) {
    const [, marker, text] = match;
    const level = (marker.length === 2 ? 2 : 3) as 2 | 3;
    const trimmed = text.trim();
    entries.push({ id: slugger.slug(trimmed), text: trimmed, level });
    match = HEADING_LINE.exec(proseOnly);
  }
  return entries;
}
