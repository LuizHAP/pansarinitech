// tests/iphone-se.spec.ts — Phase 2 Wave 2 (Plan 02-02)
// UX-01: iPhone SE 375px no-horizontal-overflow gate.
//
// Lighthouse mobile preset uses Moto G Power 412×823, which doesn't cover the
// explicit ROADMAP success-criterion #5 wording ("iPhone SE 375px"). This spec
// is the additive viewport gate at the exact 375×667 budget; Playwright runs
// against the same `pnpm next start` web server that test:a11y uses
// (configured in playwright.config.ts).
//
// localePrefix:'never' — the `en` and `pt` Playwright projects set locale:
// 'en-US' or locale: 'pt-BR', and that Accept-Language picks the locale for
// the unprefixed URL. browser.newContext() does not inherit `use`, so the
// project locale is passed through explicitly.
// 8 scenarios × 2 projects = 16 active tests total, 0 skips.
import { expect, test } from '@playwright/test';

const iPhoneSEViewport = { width: 375, height: 667 } as const;

type Scenario = { path: string };

const scenarios: Scenario[] = [
  { path: '/' },
  { path: '/now' },
  { path: '/projects' },
  { path: '/projects/machinery-partner-ecommerce' },
  { path: '/blog' },
  { path: '/blog/building-this-portfolio' },
  { path: '/projects/uaubox-design-system' },
  { path: '/projects/machinery-mobile-first' },
];

for (const { path } of scenarios) {
  test(`iPhone SE 375px no horizontal overflow on ${path}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: iPhoneSEViewport,
      locale: testInfo.project.use.locale,
    });
    try {
      const page = await context.newPage();
      await page.goto(path);
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(
        bodyScrollWidth,
        `body.scrollWidth (${bodyScrollWidth}) must be <= 375 on iPhone SE for ${path}`,
      ).toBeLessThanOrEqual(375);
    } finally {
      await context.close();
    }
  });
}
