// src/components/mdx/note.tsx — Phase 3 D-07
// Thin alias of Callout type="info" for ergonomic MDX authoring (<Note>…</Note>).
import type { ReactNode } from 'react';
import { Callout } from './callout';

export function Note({ children }: { children: ReactNode }) {
  return <Callout type="info">{children}</Callout>;
}
