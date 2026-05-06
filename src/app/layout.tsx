// src/app/layout.tsx — ROOT layout (NOT under [locale])
// Phase 2 Wave 1 (D-CONTEXT/D-13): passthrough so [locale]/layout.tsx can render the
// per-locale lang attribute. metadata stays here for Next 16 to discover at build time.
//
// Returning `children` directly (cast to React.ReactElement) is the documented passthrough
// pattern. Do NOT return `<>{children}</>` — Next has shown intermittent warnings around
// fragment-only root layouts in some 16.x dot-releases. Plain `children` is the safest shape
// across Next 16.0–16.2.
//
// Root `app/not-found.tsx` keeps its own document shell (Phase 1 commit f29b95a) — this
// passthrough is compatible because root not-found bypasses this layout for proxy-excluded
// paths.
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luiz Pansarini',
  verification: {
    google: 'GZNxF2q4D9DHuIF5_7pksepwESxAyKggi0bRYQ-uqfs',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
