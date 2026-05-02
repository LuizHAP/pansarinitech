#!/usr/bin/env node
// scripts/verify-metadata.mjs — Phase 4 PERF-03 / SEO gate
//
// Spawns `next start` against the existing .next build, curls every locale
// page, and asserts the rendered <head> contains:
//   - <title> non-empty
//   - <meta name="description"> non-empty
//   - <meta property="og:locale"> matches en_US or pt_BR
//   - <link rel="alternate" hreflang="en"> AND hreflang="pt-BR" AND hreflang="x-default"
//
// Requires `pnpm next build` to have run first. Spawns its own server on a
// non-conflicting port. Kills the server cleanly even on failure (T-04-29).
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const ROUTES = [
  '/en',
  '/pt',
  '/en/projects',
  '/pt/projects',
  '/en/projects/machinery-partner-ecommerce',
  '/pt/projects/machinery-partner-ecommerce',
  '/en/blog',
  '/pt/blog',
  '/en/blog/building-this-portfolio',
  '/pt/blog/building-this-portfolio',
  '/en/now',
  '/pt/now',
];

const REQUIRED_PATTERNS = [
  { name: '<title>', regex: /<title>[^<]+<\/title>/ },
  { name: '<meta name="description">', regex: /<meta name="description" content="[^"]+"/ },
  {
    name: '<meta property="og:locale">',
    regex: /<meta property="og:locale" content="(en_US|pt_BR)"/,
  },
  // Next 16 emits camelCase `hrefLang` attribute in HTML (matches React's
  // canonical prop name). We accept either case to be tolerant of future
  // serializer changes.
  { name: 'hreflang="en"', regex: /href[Ll]ang="en"/ },
  { name: 'hreflang="pt-BR"', regex: /href[Ll]ang="pt-BR"/ },
  { name: 'hreflang="x-default"', regex: /href[Ll]ang="x-default"/ },
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

  for (const route of ROUTES) {
    const res = await fetch(`http://localhost:${port}${route}`);
    if (!res.ok) {
      console.error(`[verify-metadata] ${route}: HTTP ${res.status}`);
      failed++;
      continue;
    }
    const html = await res.text();
    for (const p of REQUIRED_PATTERNS) {
      if (!p.regex.test(html)) {
        console.error(`[verify-metadata] ${route}: missing ${p.name}`);
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
    `\n[verify-metadata] ${failed} metadata violation(s) across ${ROUTES.length} routes`,
  );
  process.exit(1);
}
console.log(
  `[verify-metadata] ✓ ${ROUTES.length} routes × ${REQUIRED_PATTERNS.length} patterns clean`,
);
