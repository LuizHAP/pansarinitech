// tests/sith-contrast.spec.ts
// Day-one Sith-red WCAG sanity check (Pitfall 11).
// 4 tests: /en + /pt × light + dark. Dark mode .dark class injected manually
// before running axe to ensure the saber-red palette is the active one.
// Plan 03 expands to full WCAG 2.1 AA matrix.
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const projectLocale = (name: string) => (name.startsWith('en') ? 'en' : 'pt');
const isDark = (name: string) => name.endsWith('-dark');

test.describe('Sith-red contrast — Pitfall 11 day-one verification', () => {
  test('axe-core (color-contrast + focus): home page', async ({ page }, testInfo) => {
    const locale = projectLocale(testInfo.project.name);
    await page.goto(`/${locale}`);

    // Verify we're on the expected locale subtree.
    await expect(page).toHaveURL(new RegExp(`^http://localhost:3000/${locale}(/|$)`));

    if (isDark(testInfo.project.name)) {
      // Inject .dark class manually so the saber-red Sith palette is active for axe.
      // (Belt-and-suspenders: colorScheme:'dark' should trigger next-themes auto, but
      // explicit injection guards against next-themes hydration timing.)
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      // Wait for next paint so OKLCH variables flip before axe samples computed styles.
      await page.waitForTimeout(150);

      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass, 'expected .dark on <html> for Sith palette').toContain('dark');
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .options({
        // Force color-contrast rule on; some Playwright defaults disable it.
        rules: { 'color-contrast': { enabled: true } },
      })
      .analyze();

    const formatted = JSON.stringify(results.violations, null, 2);
    expect(results.violations, formatted).toEqual([]);
  });
});
