// src/components/mdx/warning.tsx — Phase 3 D-07
// Thin alias of Callout type="warn" for ergonomic MDX authoring (<Warning>…</Warning>).
import type { ReactNode } from 'react';
import { Callout } from './callout';

export function Warning({ children }: { children: ReactNode }) {
  return <Callout type="warn">{children}</Callout>;
}
