// playwright.config.ts
// Phase 5 D-11: 1 retry in CI (was 2 — overly forgiving, masks flake);
// Phase 5 D-09 + D-10: tests/e2e.spec.ts runs ONCE on a single chromium
// `e2e` project, not once per locale project (without testIgnore the spec
// would multiply CI minutes for no behavioral coverage gain).
import { defineConfig } from '@playwright/test';

const PORT = process.env.PLAYWRIGHT_PORT ?? '3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,

  webServer: {
    command: `pnpm next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    // Test-only values so the admin exists under `next start`. The build runs without them,
    // which is what proves the admin routes are never prerendered.
    env: { ADMIN_USER: 'e2e-admin', ADMIN_PASSWORD: 'e2e-password-not-a-secret' },
  },

  use: {
    baseURL: `http://localhost:${PORT}`,
  },

  // Public pages have one fixed palette, so the a11y and iPhone SE specs run once per locale.
  // tests/e2e.spec.ts is ignored here and runs once on the `e2e` project below.
  projects: [
    {
      name: 'en',
      use: { locale: 'en-US' },
      testIgnore: 'tests/e2e.spec.ts',
    },
    {
      name: 'pt',
      use: { locale: 'pt-BR' },
      testIgnore: 'tests/e2e.spec.ts',
    },
    // Phase 5 D-09/D-10: dedicated chromium project for e2e flows.
    // locale: 'en-US' is the navigator default for tests that goto('/en/...');
    // tests that exercise PT explicitly goto('/pt/...').
    {
      name: 'e2e',
      use: { locale: 'en-US' },
      testMatch: 'tests/e2e.spec.ts',
    },
  ],
});
