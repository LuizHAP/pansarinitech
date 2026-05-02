// playwright.config.ts
// Phase 5 D-11: 1 retry in CI (was 2 — overly forgiving, masks flake);
// Phase 5 D-09 + D-10: tests/e2e.spec.ts runs ONCE on a single chromium
// `e2e` project, not 4× across the en/pt × light/dark axe matrix
// (RESEARCH §A4 — without testIgnore the spec would multiply CI minutes
// for no behavioral coverage gain).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,

  webServer: {
    command: 'pnpm next start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  use: {
    baseURL: 'http://localhost:3000',
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
