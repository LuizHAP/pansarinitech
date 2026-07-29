#!/usr/bin/env node
// scripts/verify-metadata.mjs — Phase 4 PERF-03 / SEO gate
//
// Spawns `next start` against the existing .next build, fetches every route
// under both the /en and /pt locale prefixes, and asserts the rendered
// <head> contains:
//   - <title> non-empty
//   - <meta name="description"> non-empty
//   - <meta property="og:locale"> matches en_US (EN pass) or pt_BR (PT pass)
//   - hreflang alternate links for en, pt-BR, and x-default
//
// localePrefix:'always' means every route is served under /en or /pt and
// next-intl emits hreflang alternate links for each locale-prefixed URL —
// asserted below via REQUIRED_PATTERNS_HREFLANG.
//
// Requires `pnpm next build` to have run first. Spawns its own server on a
// non-conflicting port. Kills the server cleanly even on failure (T-04-29).
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

// Locale-free route suffixes ('' for home) — prefixed with /en or /pt below.
const ROUTES = [
  '',
  '/projects',
  '/projects/machinery-partner-ecommerce',
  '/blog',
  '/blog/building-this-portfolio',
  '/now',
];

const REQUIRED_PATTERNS_COMMON = [
  { name: '<title>', regex: /<title>[^<]+<\/title>/ },
  { name: '<meta name="description">', regex: /<meta name="description" content="[^"]+"/ },
];

const REQUIRED_PATTERNS_EN = [
  ...REQUIRED_PATTERNS_COMMON,
  {
    name: '<meta property="og:locale" content="en_US">',
    regex: /<meta property="og:locale" content="en_US"/,
  },
];

const REQUIRED_PATTERNS_PT = [
  ...REQUIRED_PATTERNS_COMMON,
  {
    name: '<meta property="og:locale" content="pt_BR">',
    regex: /<meta property="og:locale" content="pt_BR"/,
  },
];

// hreflang alternates asserted on every route regardless of which locale
// prefix was requested — next-intl emits the full set of alternates on
// every locale-prefixed page (localePrefix:'always').
// NOTE: verified against real rendered output (curl) — Next's metadata
// renderer emits the attribute as `hrefLang` (camelCase, NOT lowercased by
// React DOM in this Next/React version), so assert that exact casing.
const REQUIRED_PATTERNS_HREFLANG = [
  { name: 'hrefLang="en"', regex: /<link rel="alternate" hrefLang="en" href="[^"]+"/ },
  { name: 'hrefLang="pt-BR"', regex: /<link rel="alternate" hrefLang="pt-BR" href="[^"]+"/ },
  {
    name: 'hrefLang="x-default"',
    regex: /<link rel="alternate" hrefLang="x-default" href="[^"]+"/,
  },
];

const port = 3001;
const proc = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
proc.stderr.pipe(process.stderr);

function shutdown() {
  if (!proc.killed) proc.kill('SIGTERM');
}
process.on('exit', shutdown);
process.on('SIGINT', () => {
  shutdown();
  process.exit(130);
});

let failed = 0;
const checksPerRoute = REQUIRED_PATTERNS_EN.length + REQUIRED_PATTERNS_HREFLANG.length;
const totalChecks = ROUTES.length * 2 * checksPerRoute;

try {
  // Wait for "Ready" line on stdout (Next 16 prints "✓ Ready in Nms").
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('next start timed out after 20s')), 20000);
    proc.stdout.on('data', (chunk) => {
      const s = chunk.toString();
      process.stdout.write(s);
      if (/Ready/i.test(s)) {
        clearTimeout(t);
        resolve();
      }
    });
  });

  // Tiny grace period for the server to actually accept connections.
  await wait(500);

  // First pass: /en/{route} — check title, description, og:locale=en_US, hreflang
  for (const route of ROUTES) {
    const url = `/en${route}`;
    const res = await fetch(`http://localhost:${port}${url}`);
    if (!res.ok) {
      console.error(`[verify-metadata] EN ${url}: HTTP ${res.status}`);
      failed++;
      continue;
    }
    const html = await res.text();
    for (const p of [...REQUIRED_PATTERNS_EN, ...REQUIRED_PATTERNS_HREFLANG]) {
      if (!p.regex.test(html)) {
        console.error(`[verify-metadata] EN ${url}: missing ${p.name}`);
        failed++;
      }
    }
  }

  // Second pass: /pt/{route} — check title, description, og:locale=pt_BR, hreflang
  for (const route of ROUTES) {
    const url = `/pt${route}`;
    const res = await fetch(`http://localhost:${port}${url}`);
    if (!res.ok) {
      console.error(`[verify-metadata] PT ${url}: HTTP ${res.status}`);
      failed++;
      continue;
    }
    const html = await res.text();
    for (const p of [...REQUIRED_PATTERNS_PT, ...REQUIRED_PATTERNS_HREFLANG]) {
      if (!p.regex.test(html)) {
        console.error(`[verify-metadata] PT ${url}: missing ${p.name}`);
        failed++;
      }
    }
  }
} finally {
  shutdown();
  await wait(300);
}

if (failed > 0) {
  console.error(
    `\n[verify-metadata] ${failed} metadata violation(s) across ${ROUTES.length} routes × 2 locales`,
  );
  process.exit(1);
}
console.log(
  `[verify-metadata] ✓ ${ROUTES.length} routes × 2 locales × ${totalChecks} pattern checks clean`,
);
