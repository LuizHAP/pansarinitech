// playwright.config.ts
// Phase 5 D-11: 1 retry in CI (was 2 — overly forgiving, masks flake);
// Phase 5 D-09 + D-10: tests/e2e.spec.ts runs ONCE on a single chromium
// `e2e` project, not 4× across the en/pt × light/dark axe matrix
// (RESEARCH §A4 — without testIgnore the spec would multiply CI minutes
// for no behavioral coverage gain).
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

  // 4 axe matrix projects — Pitfall 10 Method B: colorScheme triggers
  // next-themes enableSystem to apply .dark. tests/e2e.spec.ts is ignored
  // here so it does NOT run 4× — it runs once on the dedicated `e2e`
  // project below (Phase 5 RESEARCH §A4).
  projects: [
    {
      name: 'en-light',
      use: { colorScheme: 'light', locale: 'en-US' },
      testIgnore: 'tests/e2e.spec.ts',
    },
    {
      name: 'en-dark',
      use: { colorScheme: 'dark', locale: 'en-US' },
      testIgnore: 'tests/e2e.spec.ts',
    },
    {
      name: 'pt-light',
      use: { colorScheme: 'light', locale: 'pt-BR' },
      testIgnore: 'tests/e2e.spec.ts',
    },
    {
      name: 'pt-dark',
      use: { colorScheme: 'dark', locale: 'pt-BR' },
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
