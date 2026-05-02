// tests/iphone-se.spec.ts — Phase 2 Wave 2 (Plan 02-02)
// UX-01: iPhone SE 375px no-horizontal-overflow gate.
//
// Lighthouse mobile preset uses Moto G Power 412×823, which doesn't cover the
// explicit ROADMAP success-criterion #5 wording ("iPhone SE 375px"). This spec
// is the additive viewport gate at the exact 375×667 budget; Playwright runs
// against the same `pnpm next start` web server that test:a11y / test:sith use
// (configured in playwright.config.ts).
//
// Plan 02-02 un-skipped the /en/now and /pt/now placeholders now that the
// route ships. All 4 scenarios run live across all 4 Playwright projects
// (en/pt × light/dark) — 16 active tests total, 0 skips.
import { expect, test } from '@playwright/test';

const iPhoneSEViewport = { width: 375, height: 667 } as const;

type Scenario = { url: string };

const scenarios: Scenario[] = [
  { url: '/en' },
  { url: '/pt' },
  { url: '/en/now' },
  { url: '/pt/now' },
  // Phase 3 additions (PROJ-01..05):
  { url: '/en/projects' },
  { url: '/pt/projects' },
  { url: '/en/projects/machinery-partner-ecommerce' },
  { url: '/pt/projects/machinery-partner-ecommerce' },
  // Phase 4 additions (BLOG-01..04):
  { url: '/en/blog' },
  { url: '/pt/blog' },
  { url: '/en/blog/building-this-portfolio' },
  { url: '/pt/blog/building-this-portfolio' },
];

for (const { url } of scenarios) {
  test(`iPhone SE 375px no horizontal overflow on ${url}`, async ({ browser }) => {
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
