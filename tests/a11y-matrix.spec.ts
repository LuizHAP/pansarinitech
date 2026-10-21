// tests/a11y-matrix.spec.ts
//
// D-14 — Full WCAG 2.1 AA axe-core matrix.
//
// 2 projects (en, pt) × 10 pages = 20 axe tests, plus the computed non-text
// contrast check on the two MDX-heavy pages in each locale.
// 0 violations required (D-18 fail-build on first violation).
//
// localePrefix:'always' — every route is served under /en or /pt. The locale
// segment used in goto() is derived from the project name.
import { AxeBuilder } from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

const localeFor = (projectName: string) => (projectName.startsWith('pt') ? 'pt' : 'en');

// `path` is the locale-free suffix ('' for home), prefixed with /en or /pt at goto() time.
const PAGES = [
  { path: () => '', desc: 'home' },
  { path: () => '/non-existent-route-for-404', desc: '404' },
  { path: () => '/projects', desc: 'projects-listing' },
  { path: () => '/projects/machinery-partner-ecommerce', desc: 'projects-case-study' },
  { path: () => '/blog', desc: 'blog-listing' },
  { path: () => '/blog/building-this-portfolio', desc: 'blog-post' },
  { path: () => '/projects/uaubox-design-system', desc: 'projects-case-study-uaubox' },
  { path: () => '/projects/machinery-mobile-first', desc: 'projects-case-study-mobile-first' },
  { path: () => '/now', desc: 'now' },
  { path: () => '/blog/ai-workspace-jean-opencode', desc: 'blog-post-mdx-components' },
];

// The copy button is opacity 0 until its code block is hovered, and axe skips invisible
// text, so reveal it first or its contrast is never sampled.
async function revealFirstCopyButton(page: Page) {
  const group = page.locator('div.group:has(> pre)').first();
  if ((await group.count()) === 0) return false;
  await group.scrollIntoViewIfNeeded();
  await group.hover();
  const button = group.locator('> button');
  await expect.poll(async () => button.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  return true;
}

test.describe('a11y matrix — WCAG 2.1 AA across en/pt × 10 pages', () => {
  for (const { path, desc } of PAGES) {
    test(`${desc}`, async ({ page }, testInfo) => {
      const locale = localeFor(testInfo.project.name);

      await page.goto(`/${locale}${path()}`);

      // Lets any remaining RevealGroup/RevealItem stagger finish before axe samples styles.
      await page.waitForTimeout(800);

      await revealFirstCopyButton(page);

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

type Pair = { what: string; ratio: number };

// Runs in the page. Computed colours can be oklab()/color-mix() strings, so each one is
// painted onto a 1x1 canvas and read back as sRGB before computing WCAG luminance.
function measurePairs(): Pair[] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2d canvas unavailable');

  const rgba = (css: string) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255] as const;
  };
  const over = (top: readonly number[], bottom: readonly number[]) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a));
  };
  const luminance = (rgb: number[]) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const band = (el: Element) => {
    const paper = el.closest('.surface-paper');
    if (!paper) throw new Error('MDX component is not inside a .surface-paper band');
    return rgba(getComputedStyle(paper).backgroundColor);
  };
  const fill = (el: Element) => {
    const bandRgb = over(band(el), [255, 255, 255]);
    return over(rgba(getComputedStyle(el).backgroundColor), bandRgb);
  };

  const pairs: Pair[] = [];

  const button = document.querySelector('div.group:has(> pre) > button');
  if (button) {
    const icon = button.querySelector('svg') ?? button;
    const bg = fill(button);
    pairs.push({
      what: 'copy button icon',
      ratio: contrast(over(rgba(getComputedStyle(icon).color), bg), bg),
    });
  }

  for (const svg of document.querySelectorAll('aside[role="note"] svg')) {
    const bg = over(band(svg), [255, 255, 255]);
    pairs.push({
      what: 'callout icon',
      ratio: contrast(over(rgba(getComputedStyle(svg).color), bg), bg),
    });
  }

  for (const badge of document.querySelectorAll('.prose span.rounded-full.bg-muted')) {
    const bg = fill(badge);
    pairs.push({
      what: `InlineBadge secondary "${badge.textContent}"`,
      ratio: contrast(over(rgba(getComputedStyle(badge).color), bg), bg),
    });
  }

  return pairs;
}

const MDX_PAGES = ['/blog/ai-workspace-jean-opencode', '/projects/uaubox-design-system'];

test.describe('MDX components on paper — computed non-text and badge contrast', () => {
  for (const path of MDX_PAGES) {
    test(`contrast ${path}`, async ({ page }, testInfo) => {
      const locale = localeFor(testInfo.project.name);
      await page.goto(`/${locale}${path}`);
      await page.waitForTimeout(800);

      const pairs = await page.evaluate(measurePairs);
      if (await revealFirstCopyButton(page)) {
        const revealed = await page.evaluate(measurePairs);
        pairs.splice(0, pairs.length, ...revealed);
        expect(
          pairs.some((p) => p.what === 'copy button icon'),
          'copy button measured',
        ).toBe(true);
      }

      expect(pairs.length, 'no MDX component found to measure').toBeGreaterThan(0);
      for (const { what, ratio } of pairs) {
        const min = what.startsWith('InlineBadge') ? 4.5 : 3;
        expect(ratio, `${what}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
      }
      testInfo.annotations.push({
        type: 'contrast',
        description: pairs.map((p) => `${p.what}=${p.ratio.toFixed(2)}`).join('; '),
      });
    });
  }
});
