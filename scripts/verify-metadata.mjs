#!/usr/bin/env node
// scripts/verify-metadata.mjs — Phase 4 PERF-03 / SEO gate
//
// Spawns `next start` against the existing .next build, fetches every
// locale-free route twice (once as EN default, once with Cookie: NEXT_LOCALE=pt)
// and asserts the rendered <head> contains:
//   - <title> non-empty
//   - <meta name="description"> non-empty
//   - <meta property="og:locale"> matches en_US (EN pass) or pt_BR (PT pass)
//
// hreflang alternate links are intentionally omitted: localePrefix:'never'
// means next-intl does not emit alternate links (no URL prefix to link to).
//
// Requires `pnpm next build` to have run first. Spawns its own server on a
// non-conflicting port. Kills the server cleanly even on failure (T-04-29).
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const EN_ROUTES = [
  '/',
  '/projects',
  '/projects/machinery-partner-ecommerce',
  '/blog',
  '/blog/building-this-portfolio',
  '/now',
];

const REQUIRED_PATTERNS_EN = [
  { name: '<title>', regex: /<title>[^<]+<\/title>/ },
  { name: '<meta name="description">', regex: /<meta name="description" content="[^"]+"/ },
  {
    name: '<meta property="og:locale" content="en_US">',
    regex: /<meta property="og:locale" content="en_US"/,
  },
];

const REQUIRED_PATTERNS_PT = [
  {
    name: '<meta property="og:locale" content="pt_BR">',
    regex: /<meta property="og:locale" content="pt_BR"/,
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
const totalChecks =
  EN_ROUTES.length * REQUIRED_PATTERNS_EN.length + EN_ROUTES.length * REQUIRED_PATTERNS_PT.length;

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

  // First pass: EN default (no locale header) — check title, description, og:locale=en_US
  for (const route of EN_ROUTES) {
    const res = await fetch(`http://localhost:${port}${route}`);
    if (!res.ok) {
      console.error(`[verify-metadata] EN ${route}: HTTP ${res.status}`);
      failed++;
      continue;
    }
    const html = await res.text();
    for (const p of REQUIRED_PATTERNS_EN) {
      if (!p.regex.test(html)) {
        console.error(`[verify-metadata] EN ${route}: missing ${p.name}`);
        failed++;
      }
    }
  }

  // Second pass: PT locale via cookie — check og:locale=pt_BR
  for (const route of EN_ROUTES) {
    const res = await fetch(`http://localhost:${port}${route}`, {
      headers: { Cookie: 'NEXT_LOCALE=pt' },
    });
    if (!res.ok) {
      console.error(`[verify-metadata] PT ${route}: HTTP ${res.status}`);
      failed++;
      continue;
    }
    const html = await res.text();
    for (const p of REQUIRED_PATTERNS_PT) {
      if (!p.regex.test(html)) {
        console.error(`[verify-metadata] PT ${route}: missing ${p.name}`);
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
    `\n[verify-metadata] ${failed} metadata violation(s) across ${EN_ROUTES.length} routes × 2 locales`,
  );
  process.exit(1);
}
console.log(
  `[verify-metadata] ✓ ${EN_ROUTES.length} routes × 2 locales × ${totalChecks} pattern checks clean`,
);
