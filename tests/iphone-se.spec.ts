// tests/iphone-se.spec.ts — Phase 2 Wave 2 (Plan 02-02)
// UX-01: iPhone SE 375px no-horizontal-overflow gate.
//
// Lighthouse mobile preset uses Moto G Power 412×823, which doesn't cover the
// explicit ROADMAP success-criterion #5 wording ("iPhone SE 375px"). This spec
// is the additive viewport gate at the exact 375×667 budget; Playwright runs
// against the same `pnpm next start` web server that test:a11y / test:sith use
// (configured in playwright.config.ts).
//
// localePrefix:'always' — every route is served under /en or /pt. The 4
// Playwright projects (en/pt × light/dark) each set locale: 'en-US' or
// locale: 'pt-BR'; the locale segment used in goto() is derived from the
// project name so en-* projects hit /en/... and pt-* projects hit /pt/....
// 8 scenarios × 4 projects = 32 active tests total, 0 skips.
import { expect, test } from '@playwright/test';

const iPhoneSEViewport = { width: 375, height: 667 } as const;

const localeFor = (projectName: string) => (projectName.startsWith('pt') ? 'pt' : 'en');

type Scenario = { path: string };

// `path` is the locale-free suffix ('' for home) — prefixed with /en or /pt
// at goto() time below, based on the running Playwright project's locale.
const scenarios: Scenario[] = [
  { path: '' },
  { path: '/now' },
  { path: '/projects' },
  { path: '/projects/machinery-partner-ecommerce' },
  { path: '/blog' },
  { path: '/blog/building-this-portfolio' },
  { path: '/projects/uaubox-design-system' },
  { path: '/projects/machinery-mobile-first' },
];

for (const { path } of scenarios) {
  test(`iPhone SE 375px no horizontal overflow on ${path || '/'}`, async ({
    browser,
  }, testInfo) => {
    const locale = localeFor(testInfo.project.name);
    const url = `/${locale}${path}`;
    const context = await browser.newContext({ viewport: iPhoneSEViewport });
    try {
      const page = await context.newPage();
      await page.goto(url);
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(
        bodyScrollWidth,
        `body.scrollWidth (${bodyScrollWidth}) must be <= 375 on iPhone SE for ${url}`,
      ).toBeLessThanOrEqual(375);
    } finally {
      await context.close();
    }
  });
}
