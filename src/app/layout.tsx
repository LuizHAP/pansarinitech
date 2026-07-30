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
  applicationName: 'Luiz Pansarini',
  title: {
    default: 'Luiz Pansarini',
    template: '%s — Luiz Pansarini',
  },
  // File conventions (app/favicon.ico, icon.png, apple-icon.png) cover the default
  // tags; explicit public/ sizes keep browsers and Lighthouse aligned with the
  // committed brand pack (16/32 + apple-touch).
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  verification: {
    google: 'GZNxF2q4D9DHuIF5_7pksepwESxAyKggi0bRYQ-uqfs',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
