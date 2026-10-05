// tests/e2e.spec.ts — Phase 5 e2e suite (CONTEXT D-06..D-11).
//
// Single chromium project (`e2e` in playwright.config.ts) — does NOT run on the
// 4-combo en/pt × light/dark axe matrix (RESEARCH §A4). Server is `next start`
// against the existing `next build` artifacts (D-07 — same as a11y-matrix).
//
// localePrefix:'always' — every route is served under /en or /pt. Tests goto()
// the explicit locale-prefixed path rather than relying on the NEXT_LOCALE
// cookie / Accept-Language to pick a locale for a locale-free URL.
// The `e2e` project sets locale: 'en-US' as the default Accept-Language.
//
// 7 test.describe blocks:
//   1. Locale switch + NEXT_LOCALE cookie                    (D-06 #1)
//   2. Theme toggle persistence across reload                (D-06 #2)
//   3. Navigation preserves locale (home -> blog)            (D-06 #3)
//   4. Resume PDF download per locale                        (D-06 #4)
//   5. Localized 404 response status + SW copy               (D-06 #5)
//   6. Project case study route renders both locales         (D-06 #6)
//   7. Client preview viewer (proxy-excluded, always noindex)
//
// Selector notes:
//   - Locale toggle is <button type="submit"> inside a <form>, NOT <a>. Use
//     getByRole('button') with anchored regex /^pt$/i to avoid Pitfall 8.
//   - Theme toggle aria-label is "Toggle theme" (en) / "Alternar tema" (pt).
//   - Resume CTA in Hero is an <a href="..." download> — Playwright's
//     waitForEvent('download') captures the click before navigation (Pitfall 4).
//   - Nav-preserves-locale entry route is /pt (home page): the home-page
//     FeaturedProjectsTeaser renders <Link href="/blog"> via the typed
//     lib/i18n/navigation wrapper (D-08), which re-prefixes it with the
//     active locale segment — with localePrefix:'always' the resolved URL is
//     /pt/blog — exactly the contract Test #3 verifies.
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Locale switch + NEXT_LOCALE cookie persistence', () => {
  test('toggling PT on /en/blog/{slug} sets NEXT_LOCALE cookie, redirects to /pt/..., and changes og:locale to pt_BR', async ({
    page,
    context,
  }) => {
    await page.goto('/en/blog/building-this-portfolio');
    // Locale toggle is a <form> with <button type="submit">PT</button>.
    // Anchored regex /^pt$/i matches the PT button exactly (Pitfall 8 — avoids
    // matching "Newsletter (PT)" or other loose substrings if added later).
    await page.getByRole('button', { name: /^pt$/i }).click();
    // Wait for the Server Action redirect + Set-Cookie response to complete
    // before reading cookies — the action sets NEXT_LOCALE in the response
    // headers and the cookie is only visible after the redirect finishes.
    await page.waitForLoadState('networkidle');

    // switchLocale() strips the /en prefix and re-prefixes with /pt (D-03).
    await expect(page).toHaveURL(/\/pt\/blog\/building-this-portfolio/);

    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('pt');

    // The client-side navigation briefly keeps the old <meta> next to the new one.
    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveCount(1);
    await expect(ogLocale).toHaveAttribute('content', 'pt_BR');
  });
});

test.describe('Theme toggle persistence across reload (next-themes localStorage)', () => {
  test('toggling to dark, reloading, still dark', async ({ page }) => {
    await page.goto('/en');
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
  test('from /pt home, internal blog link navigates to /pt/blog', async ({ page }) => {
    await page.goto('/pt');
    // The home page's FeaturedProjectsTeaser renders an internal nav link to
    // /blog via the typed <Link> wrapper (D-08). With localePrefix:'always' the
    // wrapper re-prefixes it with the active locale segment, so the resolved
    // URL is /pt/blog. Click any link with accessible name "blog" (matches
    // the localized cta.readBlog copy).
    await page.getByRole('link', { name: /blog/i }).first().click();
    await expect(page).toHaveURL(/\/pt\/blog(\/?$|\/)/);
  });
});

test.describe('Resume PDF download per locale (CONTACT-04 + D-06 #4)', () => {
  test('EN /en hero "Resume" CTA downloads Luiz-Pansarini_Resume.pdf', async ({ page }) => {
    await page.goto('/en');
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

  test('PT /pt hero "Currículo" CTA downloads Luiz-Pansarini_Curriculo.pdf', async ({ page }) => {
    await page.goto('/pt');
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
  test('/en/does-not-exist returns 404 with EN SW reference and functional header', async ({
    page,
  }) => {
    const response = await page.goto('/en/does-not-exist');
    // Critical: localized not-found must return HTTP 404, not 200, so search
    // engines do not index garbage URLs (SEO crossover).
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/These aren't the pages you're looking for/i)).toBeVisible();
    // Header chrome must still function on 404.
    await expect(page.getByRole('button', { name: /toggle theme/i })).toBeVisible();
  });

  test('/pt/nao-existe returns 404 with PT SW reference', async ({ page }) => {
    const response = await page.goto('/pt/nao-existe');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/Estas não são as páginas que você procura/i)).toBeVisible();
  });
});

test.describe('Project case study route renders in both locales (PROJ-04 + D-06 #6)', () => {
  test('/pt/projects/magazine-luiza-superapp renders MDX body in PT', async ({ page }) => {
    await page.goto('/pt/projects/magazine-luiza-superapp');
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

  test('/en/projects/magazine-luiza-superapp renders MDX body in EN', async ({ page }) => {
    await page.goto('/en/projects/magazine-luiza-superapp');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('Client preview viewer (proxy-excluded, always noindex)', () => {
  test('/preview/exemplo returns 200 without a redirect, with noindex header and meta', async ({
    request,
  }) => {
    const response = await request.get('/preview/exemplo', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    // noarchive is only sent by the preview rule, so this holds outside production too.
    const robots = response.headers()['x-robots-tag'] ?? '';
    expect(robots).toContain('noindex');
    expect(robots).toContain('noarchive');
    expect(await response.text()).toMatch(/<meta name="robots" content="[^"]*noindex/);
  });

  test('/client-previews/exemplo/index.html is served with the preview noindex header', async ({
    request,
  }) => {
    const response = await request.get('/client-previews/exemplo/index.html', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag'] ?? '').toContain('noarchive');
  });

  test('/preview/does-not-exist returns 404 without a locale redirect', async ({ request }) => {
    const response = await request.get('/preview/does-not-exist', { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test('/preview/exemplo renders the client site under the PT brand bar', async ({ page }) => {
    await page.goto('/preview/exemplo');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('Prévia do site');
    await expect(heading).toContainText('Cliente Exemplo');

    const brand = page.getByRole('link', { name: /abrir portfólio/ });
    await expect(brand).toHaveAttribute('href', '/');
    await expect(brand).toHaveAttribute('target', '_blank');

    // Relative style.css and script.js only resolve if the frame is served from its own directory.
    const frame = page.frameLocator('main iframe');
    await expect(frame.getByText('JavaScript carregado pelo caminho relativo.')).toBeVisible();
    await expect(frame.locator('[data-css-proof]')).toHaveCSS('color', 'rgb(22, 101, 52)');

    const iframe = page.locator('main iframe');
    expect((await iframe.boundingBox())?.height ?? 0).toBeGreaterThan(600);

    await page.getByRole('button', { name: 'Celular' }).click();
    await expect.poll(async () => (await iframe.boundingBox())?.width).toBe(390);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`/preview/exemplo brand bar follows the ${colorScheme} theme with zero axe violations`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/preview/exemplo');

      const html = page.locator('html');
      if (colorScheme === 'dark') {
        await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
      } else {
        await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
      }

      // The gate covers the portfolio chrome, not client content; this axe version has no
      // disableFrame, so the iframe is excluded by selector.
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
        .exclude('main iframe')
        .analyze();

      const formatted = JSON.stringify(results.violations, null, 2);
      expect(results.violations, formatted).toEqual([]);
    });
  }
});
