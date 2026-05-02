// src/lib/mdx/reading-time.ts — Phase 4 D-05
//
// Hand-rolled reading-time helper. Uses 220 wpm (Medium average) and strips
// fenced + inline code before counting. 1-minute floor. NOT the npm
// `reading-time` package (that uses 200 wpm and does not strip code).
//
// Regexes are bounded (no nested quantifiers) — author-controlled MDX is the
// only input, but defense-in-depth keeps T-04-04 (regex DoS) closed.

const WORDS_PER_MINUTE = 220;
const FENCED_CODE = /^```[\s\S]*?^```$/gm;
const INLINE_CODE = /`[^`\n]+`/g;

export function calculateReadingTime(body: string): { minutes: number } {
  const prose = body.replace(FENCED_CODE, ' ').replace(INLINE_CODE, ' ');
  const words = prose.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return { minutes };
}
