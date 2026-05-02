// src/components/mdx/index.ts — Phase 3 D-07
// mdxComponents map consumed by next-mdx-remote/rsc compileMDX. Closed map
// (only the 4 listed components are MDX-callable) to mitigate T-03-01 (MDX
// content injection).
import { Callout } from './callout';
import { Note } from './note';
import { Stat } from './stat';
import { Warning } from './warning';

export const mdxComponents = {
  Callout,
  Note,
  Warning,
  Stat,
};

export { Callout, Note, Stat, Warning };
