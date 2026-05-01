// src/lib/fonts.ts
import localFont from 'next/font/local';

// FT Aurebesh (OFL) — decorative numerals only (404 accent).
// TODO: Replace public/fonts/ft-aurebesh.woff2 with the real OFL-licensed font binary
// before Phase 1 ships. Current file is a placeholder zero-byte stub so next/font/local
// resolves at build time. Source: https://fontesk.com/ft-aurebesh-font/
export const aurebesh = localFont({
  src: '../../public/fonts/ft-aurebesh.woff2',
  variable: '--font-aurebesh',
  display: 'swap',
});
