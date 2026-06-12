// src/components/shared/deferred-command-palette.tsx — Phase 13 CASE-24, CASE-25, CASE-26
// Thin client wrapper around dynamic CommandPaletteRoot import.
// The header is a Server Component — dynamic() with ssr:false is only
// allowed inside Client Components. This wrapper defers the ~400KB command
// palette bundle until first user interaction (Cmd+K), directly improving
// LCP by reducing initial main-thread blocking.
'use client';

import dynamic from 'next/dynamic';

const CommandPaletteRoot = dynamic(
  () => import('./command-palette').then((mod) => mod.CommandPaletteRoot),
  { ssr: false },
);

export { CommandPaletteRoot };
