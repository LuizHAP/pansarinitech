#!/usr/bin/env node
// scripts/verify-metadata.mjs — Phase 4 PERF-03 / SEO gate
//
// Spawns `next start` against the existing .next build, fetches every route
// once per locale (picked with the NEXT_LOCALE cookie), and asserts the
// rendered <head> contains:
//   - <title> non-empty with exactly one `— Luiz Pansarini` suffix
//   - <meta name="description"> non-empty
//   - <meta property="og:locale"> matches en_US (EN pass) or pt_BR (PT pass)
//   - an unprefixed canonical link and no hreflang alternates
//
// localePrefix:'never' serves both locales from one URL, so there is no
// per-language URL for hreflang to point at.
//
// Requires `pnpm next build` to have run first. Spawns its own server on a
// non-conflicting port. Kills the server cleanly even on failure (T-04-29).
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const ROUTES = [
  '/',
  '/projects',
  '/projects/machinery-partner-ecommerce',
  '/blog',
  '/blog/building-this-portfolio',
  '/now',
];

const BRAND_SUFFIX = ' — Luiz Pansarini';
const EXPECTED_TITLES = new Map([
  ['EN /blog', `Software Engineering Blog${BRAND_SUFFIX}`],
  ['PT /blog', `Blog de Engenharia de Software${BRAND_SUFFIX}`],
]);

const REQUIRED_PATTERNS_COMMON = [
  { name: '<title>', regex: /<title>[^<]+<\/title>/ },
  { name: '<meta name="description">', regex: /<meta name="description" content="[^"]+"/ },
];

function checkTitle(html, locale, url) {
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  if (!title) return 0;

  const expectedTitle = EXPECTED_TITLES.get(`${locale} ${url}`);
  if (expectedTitle && title !== expectedTitle) {
    console.error(
      `[verify-metadata] ${locale} ${url}: expected <title> "${expectedTitle}", received "${title}"`,
    );
    return 1;
  }

  const suffixCount = title.split(BRAND_SUFFIX).length - 1;
  if (suffixCount === 1 && title.endsWith(BRAND_SUFFIX)) return 0;

  console.error(
    `[verify-metadata] ${locale} ${url}: expected one trailing "${BRAND_SUFFIX}" in <title>, received "${title}"`,
  );
  return 1;
}

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

function routeChecks(route) {
  const canonical = route === '/' ? '' : route;
  return [
    {
      name: `canonical ending in "${canonical || '/'}"`,
      ok: (html) =>
        new RegExp(`<link rel="canonical" href="https?://[^/"]+${canonical}"`).test(html),
    },
    { name: 'no hrefLang alternates', ok: (html) => !/hrefLang=/i.test(html) },
  ];
}

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
const checksPerRoute = REQUIRED_PATTERNS_EN.length + routeChecks('/').length + 1;
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

  const passes = [
    { label: 'EN', cookie: 'NEXT_LOCALE=en', patterns: REQUIRED_PATTERNS_EN },
    { label: 'PT', cookie: 'NEXT_LOCALE=pt', patterns: REQUIRED_PATTERNS_PT },
  ];
  for (const { label, cookie, patterns } of passes) {
    for (const url of ROUTES) {
      const res = await fetch(`http://localhost:${port}${url}`, { headers: { cookie } });
      if (!res.ok) {
        console.error(`[verify-metadata] ${label} ${url}: HTTP ${res.status}`);
        failed++;
        continue;
      }
      const html = await res.text();
      failed += checkTitle(html, label, url);
      for (const p of patterns) {
        if (!p.regex.test(html)) {
          console.error(`[verify-metadata] ${label} ${url}: missing ${p.name}`);
          failed++;
        }
      }
      for (const check of routeChecks(url)) {
        if (!check.ok(html)) {
          console.error(`[verify-metadata] ${label} ${url}: failed ${check.name}`);
          failed++;
        }
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
