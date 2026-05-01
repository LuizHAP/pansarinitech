#!/usr/bin/env node
// scripts/check-static-rendering.mjs
//
// D-15 — Static-rendering verifier (PARSER, not builder).
//
// Reads a `next build` log file passed via process.argv[2] and fails (exit 1)
// if any /[locale] route emits the ƒ (Dynamic) marker, which would violate
// I18N-06 (every [locale] route must be SSG).
//
// USAGE:
//   pnpm next build 2>&1 | tee /tmp/build.log
//   node scripts/check-static-rendering.mjs /tmp/build.log
//
// The CALLER is responsible for piping `next build` output to a file. This
// script only PARSES the log — it never spawns its own build (avoids doubling
// CI runtime; D-19 < 3 min budget depends on a single build per CI run).
//
// Next 16 Turbopack route-table markers (NOT the legacy λ from older Next):
//   ○  Static       (prerendered as static content)
//   ●  SSG          (prerendered via generateStaticParams)
//   ƒ  Dynamic      (server-rendered on demand)
//   ƒ  Proxy        (the middleware / proxy.ts on Node runtime)
//
// ALLOWED `ƒ` markers (must NOT trigger failure):
//   - "ƒ Proxy (Middleware)" — proxy.ts runs on Node runtime, expected
//   - "ƒ /[locale]/[...rest]" — catch-all calls notFound() to route unmatched
//     {locale}/* URLs into [locale]/not-found.tsx (locale-aware 404 boundary).
//     Dynamic by design.
//
// FORBIDDEN `ƒ` markers (MUST trigger failure):
//   - "ƒ /[locale]" (the home page itself going dynamic) — breaks I18N-06
//   - "ƒ /[locale]/<any specific route>" — any real /[locale]/page going dynamic
//
// ROADMAP wording "no λ markers" is LEGACY; Next 16 emits ƒ, not λ.

import { readFileSync } from 'node:fs';
import { argv } from 'node:process';

const logPath = argv[2];
if (!logPath) {
  console.error('Usage: node scripts/check-static-rendering.mjs <build-log-path>');
  console.error('  Run `pnpm next build 2>&1 | tee <build-log-path>` first.');
  process.exit(2);
}

let log;
try {
  log = readFileSync(logPath, 'utf8');
} catch (err) {
  console.error(`Failed to read build log at ${logPath}: ${err.message}`);
  process.exit(2);
}

const lines = log.split('\n');
const violations = [];

for (const rawLine of lines) {
  const line = rawLine.trimEnd();

  // Skip the marker legend at the bottom of the route table:
  //   "ƒ  (Dynamic)  server-rendered on demand"
  if (/^\s*ƒ\s+\(Dynamic\)/.test(line)) continue;

  // Allow the proxy/middleware (Node-runtime, not a [locale] page).
  if (/^\s*ƒ\s+Proxy\b/.test(line)) continue;

  // Allow the [...rest] catch-all under [locale] — it INTENTIONALLY calls
  // notFound() so unmatched /{locale}/* URLs render the locale-aware 404.
  if (/^\s*[├└]?\s*ƒ\s+\/\[locale\]\/\[\.\.\.rest\]/.test(line)) continue;

  // Flag any other ƒ on a /[locale] route.
  // Matches both:
  //   "ƒ /[locale]"            (home segment going dynamic — forbidden)
  //   "├ ƒ /[locale]/blah"     (specific [locale] route going dynamic — forbidden)
  if (/^\s*[├└]?\s*ƒ\s+\/\[locale\](\/|$|\s)/.test(line)) {
    violations.push(line.trim());
  }
}

if (violations.length > 0) {
  console.error('\n✗ STATIC RENDERING VIOLATIONS:');
  for (const v of violations) {
    console.error(`  ${v}`);
  }
  console.error(
    `\n  ${violations.length} dynamic [locale] route(s) detected. I18N-06 requires all [locale] pages to be SSG (●).`,
  );
  console.error('  Likely cause: missing setRequestLocale(locale) in a layout/page,');
  console.error('  or accidental use of cookies()/headers()/draftMode() in a [locale] tree.');
  console.error('  See .planning/phases/01-foundation/01-RESEARCH.md §Pitfall 3.\n');
  process.exit(1);
}

console.log(`✓ Static rendering verified: all /[locale] routes are SSG (parsed ${logPath}).`);
