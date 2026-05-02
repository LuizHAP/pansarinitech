// src/components/mdx/index.ts — Phase 3 D-07 + Phase 4 D-10
// mdxComponents map consumed by next-mdx-remote/rsc compileMDX. Closed map
// (only the listed components are MDX-callable) to mitigate T-03-01 (MDX
// content injection).
//
// Phase 4 adds `pre: PreWithCopyButton` so EVERY fenced code block (projects
// AND blog) automatically gets the copy button — no per-post opt-in. The
// rehype-pretty-code DOM is preserved; the button is appended via a sibling
// wrapper in the client island.
import { Callout } from './callout';
import { Note } from './note';
import { PreWithCopyButton } from './pre-with-copy-button';
import { Stat } from './stat';
import { Warning } from './warning';

export const mdxComponents = {
  Callout,
  Note,
  Warning,
  Stat,
  pre: PreWithCopyButton, // Phase 4 D-10 — automatic copy button on all <pre>
};

export { Callout, Note, Stat, Warning };
