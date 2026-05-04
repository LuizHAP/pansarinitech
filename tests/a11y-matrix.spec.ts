// tests/a11y-matrix.spec.ts
//
// D-14 — Full WCAG 2.1 AA axe-core matrix.
//
// 4 projects (en×light, en×dark, pt×light, pt×dark) × 2 pages (home, 404) = 8 tests.
// 0 violations required (D-18 fail-build on first violation).
// Runs with playwright fullyParallel + workers: 4 to stay under D-19's < 3 min budget.
//
// Additive to tests/sith-contrast.spec.ts (the Wave 2 fast-feedback Sith subset).
// Both run in CI; this spec is the broader gate, sith-contrast.spec.ts is the
// regression smoke that locks in THEME-06.
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const projectLocale = (name: string): 'en' | 'pt' => (name.startsWith('en') ? 'en' : 'pt');
const isDark = (name: string) => name.endsWith('-dark');

// Pages exercised in every locale × theme combo.
//   /                              → home (placeholder Phase 1)
//   /<locale>/non-existent-route   → routes through [locale]/[...rest] → notFound()
//                                    → renders [locale]/not-found.tsx (locale-aware 404)
const PAGES = [
  { path: (locale: 'en' | 'pt') => `/${locale}`, desc: 'home' },
  {
    path: (locale: 'en' | 'pt') => `/${locale}/non-existent-route-for-404`,
    desc: '404',
  },
  // Phase 3 additions (PROJ-01..05):
  { path: (locale: 'en' | 'pt') => `/${locale}/projects`, desc: 'projects-listing' },
  {
    path: (locale: 'en' | 'pt') => `/${locale}/projects/machinery-partner-ecommerce`,
    desc: 'projects-case-study',
  },
  // Phase 4 additions (BLOG-01..04):
  { path: (locale: 'en' | 'pt') => `/${locale}/blog`, desc: 'blog-listing' },
  {
    path: (locale: 'en' | 'pt') => `/${locale}/blog/building-this-portfolio`,
    desc: 'blog-post',
  },
];

test.describe('a11y matrix — WCAG 2.1 AA across en/pt × light/dark × home/404', () => {
  for (const { path, desc } of PAGES) {
    test(`${desc}`, async ({ page }, testInfo) => {
      const locale = projectLocale(testInfo.project.name);
      const dark = isDark(testInfo.project.name);

      await page.goto(path(locale));

      // Verify locale routing landed correctly.
      await expect(page).toHaveURL(new RegExp(`^http://localhost:3000/${locale}(/|$)`));

      if (dark) {
        // Inject .dark on <html> manually so the saber-red Sith palette is the
        // active one when axe samples computed styles. (Belt-and-suspenders
        // against next-themes hydration timing — colorScheme:'dark' SHOULD
        // trigger enableSystem auto-flip, but we don't rely on it.)
        await page.evaluate(() => document.documentElement.classList.add('dark'));
      }

      // Wait for RevealGroup/RevealItem stagger animations to complete before axe
      // samples computed styles. The slowest chain: stagger 0.08 × 3 items (0.24s)
      // + animation duration 0.4s = 0.64s total. 800ms gives a 160ms safety margin
      // and covers dark-mode CSS-variable flip time too.
      await page.waitForTimeout(800);

      // Theme-class assertion (defends against Method B drift — RESEARCH §A5).
      const htmlClass = (await page.locator('html').getAttribute('class')) ?? '';
      if (dark) {
        expect(htmlClass, '<html> should carry .dark in a dark colorScheme project').toContain(
          'dark',
        );
      } else {
        expect(
          htmlClass,
          '<html> should NOT carry .dark in a light colorScheme project',
        ).not.toContain('dark');
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .options({
          rules: {
            'color-contrast': { enabled: true },
            'heading-order': { enabled: true },
            'landmark-one-main': { enabled: true },
            'page-has-heading-one': { enabled: true },
          },
        })
        .analyze();

      const formatted = JSON.stringify(results.violations, null, 2);
      expect(results.violations, formatted).toEqual([]);
    });
  }
});
