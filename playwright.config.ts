// playwright.config.ts
// Phase 1 — day-one Sith-red WCAG sanity check (Pitfall 11).
// Plan 03 expands to full WCAG 2.1 AA matrix; here we ship the focused subset.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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

  // 4 combos — Pitfall 10 Method B: colorScheme triggers next-themes enableSystem to apply .dark.
  // Plan 02 only exercises -dark projects (skip in spec); Plan 03 will run all 4.
  projects: [
    { name: 'en-light', use: { colorScheme: 'light', locale: 'en-US' } },
    { name: 'en-dark', use: { colorScheme: 'dark', locale: 'en-US' } },
    { name: 'pt-light', use: { colorScheme: 'light', locale: 'pt-BR' } },
    { name: 'pt-dark', use: { colorScheme: 'dark', locale: 'pt-BR' } },
  ],
});
