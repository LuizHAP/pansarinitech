// tests/e2e.spec.ts — Phase 5 e2e suite (CONTEXT D-06..D-11).
//
// Single chromium project (`e2e` in playwright.config.ts) — does NOT run on the
// en/pt axe projects. Server is `next start` against the existing `next build`
// artifacts (D-07 — same as a11y-matrix).
//
// localePrefix:'never' — public routes carry no locale segment. The locale comes
// from the NEXT_LOCALE cookie, then x-vercel-ip-country, then Accept-Language.
// The `e2e` project sets locale: 'en-US' as the default Accept-Language, and
// PT tests set the cookie with usePt() before navigating.
//
// 9 test.describe blocks:
//   1. Locale switch + NEXT_LOCALE cookie                    (D-06 #1)
//   2. Locale resolution and legacy /en, /pt redirects
//   3. Navigation preserves locale (home -> blog)            (D-06 #3)
//   4. Resume PDF download per locale                        (D-06 #4)
//   5. Localized 404 response status + terminal copy         (D-06 #5)
//   6. Project case study route renders both locales         (D-06 #6)
//   7. Hero 3D field loads only on desktop
//   8. Client preview viewer (proxy-excluded, always noindex)
//   9. Hidden admin for client previews (env-gated, noindex)
//
// Selector notes:
//   - Locale toggle is <button type="submit"> inside a <form>, NOT <a>. Use
//     getByRole('button') with anchored regex /^pt$/i to avoid Pitfall 8.
//   - Resume CTA in Hero is an <a href="..." download> — Playwright's
//     waitForEvent('download') captures the click before navigation (Pitfall 4).
import { type Browser, type BrowserContext, expect, test } from '@playwright/test';

async function usePt(context: BrowserContext, baseURL: string | undefined) {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'pt', url: baseURL ?? '' }]);
}

test.describe('Locale switch + NEXT_LOCALE cookie persistence', () => {
  test('toggling PT on /blog/{slug} sets NEXT_LOCALE cookie, keeps the URL, and changes og:locale to pt_BR', async ({
    page,
    context,
  }) => {
    await page.goto('/blog/building-this-portfolio');
    // Locale toggle is a <form> with <button type="submit">PT</button>.
    // Anchored regex /^pt$/i matches the PT button exactly (Pitfall 8 — avoids
    // matching "Newsletter (PT)" or other loose substrings if added later).
    await page.getByRole('button', { name: /^pt$/i }).click();
    // The URL does not change, so wait on the reloaded document's <head>.
    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveAttribute('content', 'pt_BR');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await expect(page).toHaveURL(/\/blog\/building-this-portfolio$/);

    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('pt');

    // Pages prefetched in EN before the switch share these URLs, so a stale
    // router cache would show EN copy here.
    await page.getByRole('link', { name: 'projetos' }).first().click();
    await expect(page).toHaveURL(/\/projects$/);
    // The client-side navigation briefly keeps the old <meta> next to the new one.
    await expect(ogLocale).toHaveCount(1);
    await expect(ogLocale).toHaveAttribute('content', 'pt_BR');
  });
});

test.describe('Locale resolution and legacy prefix redirects', () => {
  test('/ serves the page without redirecting to a locale prefix', async ({ request }) => {
    const response = await request.get('/', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test('legacy /pt/... 308s to the unprefixed path and keeps PT in the cookie', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get('/pt/blog/building-this-portfolio?ref=x', {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, baseURL).pathname).toBe(
      '/blog/building-this-portfolio',
    );
    expect(new URL(response.headers().location, baseURL).search).toBe('?ref=x');
    expect(response.headers()['set-cookie']).toMatch(/NEXT_LOCALE=pt/);
  });

  test('legacy /en 308s to the site root', async ({ request, baseURL }) => {
    const response = await request.get('/en', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, baseURL).pathname).toBe('/');
  });

  test('legacy dated blog slug under a prefix lands on the current slug', async ({ page }) => {
    await page.goto('/pt/blog/software-engineering-career-20260516'); // ci-safety: legacy-redirect
    await expect(page).toHaveURL(/\/blog\/software-engineering-career$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('a Brazilian IP gets PT and the choice is written to the cookie', async ({ request }) => {
    const response = await request.get('/', {
      headers: { 'x-vercel-ip-country': 'BR', 'accept-language': 'en-US' },
    });
    expect(await response.text()).toMatch(/<html[^>]*lang="pt-BR"/);
    expect(response.headers()['set-cookie']).toMatch(/NEXT_LOCALE=pt/);
  });

  test('a non Portuguese-speaking country gets EN even with a PT browser', async ({ request }) => {
    const response = await request.get('/', {
      headers: { 'x-vercel-ip-country': 'US', 'accept-language': 'pt-BR' },
    });
    expect(await response.text()).toMatch(/<html[^>]*lang="en"/);
  });

  test('the cookie outranks the geo header', async ({ request }) => {
    const response = await request.get('/', {
      headers: { 'x-vercel-ip-country': 'BR', cookie: 'NEXT_LOCALE=en' },
    });
    expect(await response.text()).toMatch(/<html[^>]*lang="en"/);
  });
});

test.describe('Navigation preserves locale (lib/i18n/navigation Link wrapper)', () => {
  test('from the PT home, the internal blog link opens /blog in PT', async ({
    page,
    context,
    baseURL,
  }) => {
    await usePt(context, baseURL);
    await page.goto('/');
    await page.getByRole('link', { name: /blog/i }).first().click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });
});

test.describe('Resume PDF download per locale (CONTACT-04 + D-06 #4)', () => {
  test('EN hero "Resume" CTA downloads Luiz-Pansarini_Resume.pdf', async ({ page }) => {
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

  test('PT hero "Currículo" CTA downloads Luiz-Pansarini_Curriculo.pdf', async ({
    page,
    context,
    baseURL,
  }) => {
    await usePt(context, baseURL);
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

test.describe('Localized 404 (UX-04 + D-06 #5)', () => {
  test('/does-not-exist returns 404 with the EN terminal error and a working header', async ({
    page,
  }) => {
    const response = await page.goto('/does-not-exist');
    // Critical: localized not-found must return HTTP 404, not 200, so search
    // engines do not index garbage URLs (SEO crossover).
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/no such file or directory/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /404/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^pt$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open command palette' })).toBeVisible();
  });

  test('/nao-existe returns 404 with the PT terminal error', async ({ page, context, baseURL }) => {
    await usePt(context, baseURL);
    const response = await page.goto('/nao-existe');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/arquivo ou diretório não encontrado/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^en$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir painel de comandos' })).toBeVisible();
  });
});

test.describe('Project case study route renders in both locales (PROJ-04 + D-06 #6)', () => {
  test('/projects/magazine-luiza-superapp renders MDX body in PT', async ({
    page,
    context,
    baseURL,
  }) => {
    await usePt(context, baseURL);
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

test.describe('Hero 3D field loads only on desktop', () => {
  async function requestsSceneChunk(
    browser: Browser,
    options: Parameters<Browser['newContext']>[0],
  ): Promise<boolean> {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const bodies: Promise<string>[] = [];
    page.on('response', (response) => {
      if (response.request().resourceType() === 'script') {
        bodies.push(response.text().catch(() => ''));
      }
    });
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    const texts = await Promise.all(bodies);
    await context.close();
    return texts.some((text) => text.includes('isWebGLRenderer'));
  }

  test('375px touch viewport never requests the three.js chunk', async ({ browser }) => {
    const requested = await requestsSceneChunk(browser, {
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    expect(requested).toBe(false);
  });

  test('desktop with prefers-reduced-motion never requests the three.js chunk', async ({
    browser,
  }) => {
    const requested = await requestsSceneChunk(browser, {
      viewport: { width: 1280, height: 720 },
      reducedMotion: 'reduce',
    });
    expect(requested).toBe(false);
  });

  test('desktop with a fine pointer requests it after load (positive control)', async ({
    browser,
  }) => {
    const requested = await requestsSceneChunk(browser, {
      viewport: { width: 1280, height: 720 },
      reducedMotion: 'no-preference',
    });
    expect(requested).toBe(true);
  });
});

test.describe('Client preview viewer (proxy-excluded, always noindex)', () => {
  test('/preview/does-not-exist returns 404 without a locale redirect', async ({ request }) => {
    const response = await request.get('/preview/does-not-exist', { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test('/client-previews/does-not-exist/index.html returns a noindexed 404, not a 500', async ({
    request,
  }) => {
    const response = await request.get('/client-previews/does-not-exist/index.html', {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(404);
    expect(response.headers()['x-robots-tag'] ?? '').toContain('noarchive');
  });
});

test.describe('Hidden admin for client previews (env-gated, noindex)', () => {
  // Mirrors webServer.env in playwright.config.ts.
  const ADMIN_USER = 'e2e-admin';
  const ADMIN_PASSWORD = 'e2e-password-not-a-secret';

  test('/admin without a session redirects to the login, noindexed and uncached', async ({
    page,
    request,
  }) => {
    const admin = await request.get('/admin', { maxRedirects: 0 });
    expect(admin.status()).toBe(307);
    expect(admin.headers().location).toMatch(/^(https?:\/\/[^/]+)?\/admin\/login$/);
    expect(admin.headers()['x-robots-tag'] ?? '').toContain('noarchive');

    const login = await request.get('/admin/login', { maxRedirects: 0 });
    expect(login.status()).toBe(200);
    const robots = login.headers()['x-robots-tag'] ?? '';
    expect(robots).toContain('noindex');
    expect(robots).toContain('noarchive');
    expect(login.headers()['cache-control'] ?? '').toContain('no-store');
    expect(await login.text()).toMatch(/<meta name="robots" content="[^"]*noindex/);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByLabel('Usuário')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
  });

  test('admin keeps its own <html> while public pages carry the site scope', async ({ page }) => {
    await page.goto('/admin/login');
    const adminClasses = ((await page.locator('html').getAttribute('class')) ?? '').split(/\s+/);
    expect(adminClasses).not.toContain('site');

    await page.goto('/');
    const publicClasses = ((await page.locator('html').getAttribute('class')) ?? '').split(/\s+/);
    expect(publicClasses).toContain('site');
  });

  test('wrong password shows the generic error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Usuário').fill(ADMIN_USER);
    await page.getByLabel('Senha').fill('not-the-password');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('form').getByRole('alert')).toHaveText('Usuário ou senha inválidos.');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('login shows the dashboard with the Blob alert, and Sair ends the session', async ({
    page,
  }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Usuário').fill(ADMIN_USER);
    await page.getByLabel('Senha').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prévias de clientes');
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Blob indisponível');

    const session = (await page.context().cookies()).find(({ name }) => name === 'admin_session');
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe('Strict');
    expect(session?.path).toBe('/admin');
    // next start runs with NODE_ENV=production, and Chromium keeps Secure cookies on localhost.
    expect(session?.secure).toBe(true);
    const daysLeft = ((session?.expires ?? 0) * 1000 - Date.now()) / 86_400_000;
    expect(daysLeft).toBeGreaterThan(89.9);
    expect(daysLeft).toBeLessThan(90.1);

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('leads board needs a session, opens from the dashboard and fits 375 px without Redis', async ({
    page,
    request,
  }) => {
    const leads = await request.get('/admin/leads', { maxRedirects: 0 });
    expect(leads.status()).toBe(307);
    expect(leads.headers().location).toMatch(/^(https?:\/\/[^/]+)?\/admin\/login$/);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/login');
    await page.getByLabel('Usuário').fill(ADMIN_USER);
    await page.getByLabel('Senha').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prévias de clientes');

    await page.getByRole('link', { name: 'Leads', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/leads$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Leads');
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Redis indisponível');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
