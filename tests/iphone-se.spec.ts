// tests/iphone-se.spec.ts — Phase 2 Wave 1 (Plan 02-01 T3)
// UX-01: iPhone SE 375px no-horizontal-overflow gate.
//
// Lighthouse mobile preset uses Moto G Power 412×823, which doesn't cover the
// explicit ROADMAP success-criterion #5 wording ("iPhone SE 375px"). This spec
// is the additive viewport gate at the exact 375×667 budget; Playwright runs
// against the same `pnpm next start` web server that test:a11y / test:sith use
// (configured in playwright.config.ts).
//
// Two tests pass on Wave 1 (en + pt home pages, currently the Phase 1
// placeholder home which fits well within 375px). Two tests are skipped placeholders
// for /en/now and /pt/now — Plan 02-02 ships the /now page and un-skips them.
import { expect, test } from '@playwright/test';

const iPhoneSEViewport = { width: 375, height: 667 } as const;

type Scenario = { url: string; skip?: string };

const scenarios: Scenario[] = [
  { url: '/en' },
  { url: '/pt' },
  { url: '/en/now', skip: 'Plan 02-02 ships /now page; un-skip there.' },
  { url: '/pt/now', skip: 'Plan 02-02 ships /now page; un-skip there.' },
];

for (const { url, skip } of scenarios) {
  test(`iPhone SE 375px no horizontal overflow on ${url}`, async ({ browser }) => {
    test.skip(Boolean(skip), skip ?? '');
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
