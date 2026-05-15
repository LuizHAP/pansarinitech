// tests/e2e.spec.ts — Phase 5 e2e suite (CONTEXT D-06..D-11).
//
// Single chromium project (`e2e` in playwright.config.ts) — does NOT run on the
// 4-combo en/pt × light/dark axe matrix (RESEARCH §A4). Server is `next start`
// against the existing `next build` artifacts (D-07 — same as a11y-matrix).
//
// localePrefix:'never' — URLs are locale-free (no /en/ or /pt/ prefix).
// PT locale is set via Cookie: NEXT_LOCALE=pt which middleware reads.
// The `e2e` project sets locale: 'en-US' as the default Accept-Language.
//
// 6 test.describe blocks:
//   1. Locale switch + NEXT_LOCALE cookie                    (D-06 #1)
//   2. Theme toggle persistence across reload                (D-06 #2)
//   3. Navigation preserves locale (home -> blog)            (D-06 #3)
//   4. Resume PDF download per locale                        (D-06 #4)
//   5. Localized 404 response status + SW copy               (D-06 #5)
//   6. Project case study route renders both locales         (D-06 #6)
//
// Selector notes:
//   - Locale toggle is <button type="submit"> inside a <form>, NOT <a>. Use
//     getByRole('button') with anchored regex /^pt$/i to avoid Pitfall 8.
//   - Theme toggle aria-label is "Toggle theme" (en) / "Alternar tema" (pt).
//   - Resume CTA in Hero is an <a href="..." download> — Playwright's
//     waitForEvent('download') captures the click before navigation (Pitfall 4).
//   - Nav-preserves-locale entry route is / (home page) with PT cookie set:
//     the home-page FeaturedProjectsTeaser renders <Link href="/blog"> via the
//     typed lib/i18n/navigation wrapper (D-08). With localePrefix:'never' the
//     URL stays /blog regardless of locale — exactly the contract Test #3 verifies.
import { expect, test } from '@playwright/test';

test.describe('Locale switch + NEXT_LOCALE cookie persistence', () => {
  test('toggling PT on /blog/{slug} sets NEXT_LOCALE cookie and changes og:locale to pt_BR', async ({
    page,
    context,
  }) => {
    await page.goto('/blog/building-this-portfolio');
    // Locale toggle is a <form> with <button type="submit">PT</button>.
    // Anchored regex /^pt$/i matches the PT button exactly (Pitfall 8 — avoids
    // matching "Newsletter (PT)" or other loose substrings if added later).
    await page.getByRole('button', { name: /^pt$/i }).click();

    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('pt');

    // Reload so middleware applies the PT cookie and serves PT locale.
    await page.reload();
    const ogLocale = await page.locator('meta[property="og:locale"]').getAttribute('content');
    expect(ogLocale).toBe('pt_BR');
  });
});

test.describe('Theme toggle persistence across reload (next-themes localStorage)', () => {
  test('toggling to dark, reloading, still dark', async ({ page }) => {
    await page.goto('/');
    // Normalize to light first (clears any system-pref bleed-through).
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.reload();

    // Theme toggle aria-label is locale-dependent — match either string.
    await page.getByRole('button', { name: /toggle theme|alternar tema/i }).click();

    // next-themes writes 'theme' to localStorage synchronously (verified A1).
    await page.reload();
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe('dark');

    // Belt-and-suspenders: <html> should carry .dark.
    const htmlClass = (await page.locator('html').getAttribute('class')) ?? '';
    expect(htmlClass).toContain('dark');
  });
});

test.describe('Navigation preserves locale (lib/i18n/navigation Link wrapper)', () => {
  test('from / home with PT cookie, internal blog link navigates to /blog (locale-free)', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'pt', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/');
    // The home page's FeaturedProjectsTeaser renders an internal nav link to
    // /blog via the typed <Link> wrapper (D-08). With localePrefix:'never' the
    // URL is /blog regardless of locale. Click any link with accessible name
    // "blog" (matches the localized cta.readBlog copy).
    await page.getByRole('link', { name: /blog/i }).first().click();
    await expect(page).toHaveURL(/\/blog(\/?$|\/)/);
  });
});

test.describe('Resume PDF download per locale (CONTACT-04 + D-06 #4)', () => {
  test('EN / hero "Resume" CTA downloads Luiz-Pansarini_Resume.pdf', async ({ page }) => {
    await page.goto('/');
    const downloadPromise = page.waitForEvent('download');
    // Hero CTA is the FIRST resume link; Contact section adds another with
    // identical href + download attribute. .first() selects Hero.
    await page
      .getByRole('link', { name: /^resume$/i })
      .first()
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Luiz-Pansarini_Resume.pdf');
  });

  test('PT / hero "Currículo" CTA downloads Luiz-Pansarini_Curriculo.pdf', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'pt', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/');
    const downloadPromise = page.waitForEvent('download');
    await page
      .getByRole('link', { name: /^currículo$/i })
      .first()
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Luiz-Pansarini_Curriculo.pdf');
  });
});

test.describe('Localized 404 (UX-04 + EASTER-01 + D-06 #5)', () => {
  test('/does-not-exist returns 404 with EN SW reference and functional header', async ({
    page,
  }) => {
    const response = await page.goto('/does-not-exist');
    // Critical: localized not-found must return HTTP 404, not 200, so search
    // engines do not index garbage URLs (SEO crossover).
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/These aren't the pages you're looking for/i)).toBeVisible();
    // Header chrome must still function on 404.
    await expect(page.getByRole('button', { name: /toggle theme/i })).toBeVisible();
  });

  test('/nao-existe returns 404 with PT SW reference', async ({ page, context }) => {
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'pt', domain: 'localhost', path: '/' },
    ]);
    const response = await page.goto('/nao-existe');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/Estas não são as páginas que você procura/i)).toBeVisible();
  });
});

test.describe('Project case study route renders in both locales (PROJ-04 + D-06 #6)', () => {
  test('/projects/magazine-luiza-superapp renders MDX body in PT', async ({ page, context }) => {
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'pt', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/projects/magazine-luiza-superapp');
    // H1 from frontmatter title should render.
    await expect(page.locator('h1').first()).toBeVisible();
    // First main image should load (frontmatter heroImage path — verifies
    // static-import + next/image pipeline survives to runtime).
    const heroImg = page.locator('main img').first();
    await heroImg.scrollIntoViewIfNeeded();
    // WR-02: poll the load state — next/image is lazy, so the request fires
    // on viewport intersection but the bytes arrive asynchronously. Playwright
    // does not auto-wait for <img> load events, so a direct evaluate() races
    // the network on slow CI workers. expect.poll re-runs the check until the
    // image is fully decoded or the 10s timeout elapses.
    await expect
      .poll(
        async () =>
          heroImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        { timeout: 10_000 },
      )
      .toBe(true);
  });

  test('/projects/magazine-luiza-superapp renders MDX body in EN', async ({ page }) => {
    await page.goto('/projects/magazine-luiza-superapp');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
