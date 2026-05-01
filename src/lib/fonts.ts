// src/lib/fonts.ts
// FT Aurebesh (OFL) — decorative numerals only (404 accent in Phase 2).
//
// PLACEHOLDER FALLBACK: Phase 1 does NOT render any Aurebesh glyphs (no 404 page yet
// — that ships in Plan 02). The real OFL FT Aurebesh binary is a manual download from
// https://fontesk.com/ft-aurebesh-font/ (license: SIL OFL, freely redistributable).
//
// Until that binary lands at public/fonts/ft-aurebesh.woff2, we expose a CSS variable
// `--font-aurebesh` that falls back to the system serif. This keeps the contract
// (every page sets the CSS variable on <html className>) without breaking the build
// on a zero-byte placeholder file.
//
// Plan 02 Task: replace this file with the proper next/font/local declaration once the
// OFL binary is committed to public/fonts/. The export shape (`aurebesh.variable`,
// `aurebesh.className`) must remain stable so src/app/layout.tsx does not need changes.
//
// TODO(plan-02): swap fallback for next/font/local when ft-aurebesh.woff2 is the real binary.
// `variable` is empty so it interpolates to nothing in className lists.
// Consumers that want Aurebesh (Phase 2 404 page) should use `aurebesh.style` inline OR
// rely on `var(--font-aurebesh, ui-serif, Georgia, serif)` via Tailwind's font-aurebesh utility.
export const aurebesh = {
  variable: '',
  className: '',
  style: { fontFamily: 'var(--font-aurebesh, ui-serif, Georgia, serif)' },
} as const;
