// src/lib/fonts.ts
// Aurebesh decorative font — used ONLY for the decorative accent on the 404 page
// (src/app/[locale]/not-found.tsx + src/app/not-found.tsx). aria-hidden="true" with
// sr-only English fallback for accessibility (A11Y-07).
//
// Source: Aurebesh_Rodian (beta) by AurekFonts (MIT). The original CONTEXT D-15
// pointed at FT Aurebesh from fontesk.com (SIL OFL); fontesk's distribution is
// gated behind an interactive form, so Plan 02-01 fell back to the MIT-licensed
// Aurebesh_Rodian. License attribution: public/fonts/LICENSE-aurebesh.txt.
//
// preload: false is critical — the font is consumed by the 404 page only, so we
// don't want Next.js injecting <link rel="preload"> on every page (would waste
// ~7KB of bandwidth per pageview for a font 99% of users will never see).
//
// display: 'swap' satisfies PERF-06 (no FOIT) — the 404 paints with a fallback
// font first, then swaps to Aurebesh once the binary loads.
import localFont from 'next/font/local';

export const aurebesh = localFont({
  src: '../../public/fonts/ft-aurebesh.woff2',
  variable: '--font-aurebesh',
  display: 'swap',
  weight: '400',
  preload: false,
});
