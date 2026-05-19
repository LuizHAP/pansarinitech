// src/components/mdx/index.ts — Phase 3 D-07 + Phase 4 D-10 + Phase 6
// mdxComponents map consumed by next-mdx-remote/rsc compileMDX. Closed map
// (only the listed components are MDX-callable) to mitigate T-03-01 (MDX
// content injection).
//
// Phase 4 adds `pre: PreWithCopyButton` so EVERY fenced code block (projects
// AND blog) automatically gets the copy button — no per-post opt-in. The
// rehype-pretty-code DOM is preserved; the button is appended via a sibling
// wrapper in the client island.
//
// Phase 6 adds CodeFilename (async RSC, filename bar above code block) and
// InlineBadge (sync RSC, 4-variant inline chip) — T-06-01 closed-map mitigation.
import { Callout } from './callout';
import { CodeFilename } from './code-filename';
import { InlineBadge } from './inline-badge';
import { Note } from './note';
import { PreWithCopyButton } from './pre-with-copy-button';
import { Stat } from './stat';
import { Warning } from './warning';

export const mdxComponents = {
  Callout,
  Note,
  Warning,
  Stat,
  CodeFilename,
  InlineBadge,
  pre: PreWithCopyButton, // Phase 4 D-10 — automatic copy button on all <pre>
};

export { Callout, CodeFilename, InlineBadge, Note, Stat, Warning };
