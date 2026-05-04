// vitest.config.mts — Phase 01 (v1.1) Vitest baseline
// Node environment: the 7 target files are pure-logic TS modules. No jsdom needed.
// server.deps.inline: next-intl + github-slugger are "type": "module" ESM-only packages
// and must be transformed by Vite (Pitfall 1 in 01-RESEARCH.md).
// coverage.include + per-file thresholds: enforced 100% surgical gate. Listing all
// 7 files now means Plans 02-03 inherit the gate without config edits.
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/utils.ts',
        'src/lib/seo.ts',
        'src/lib/i18n/helpers.ts',
        'src/lib/mdx/reading-time.ts',
        'src/lib/mdx/schema.ts',
        'src/lib/mdx/toc.ts',
        'src/data/schemas.ts',
      ],
      thresholds: {
        'src/lib/utils.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/lib/seo.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/lib/i18n/helpers.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/lib/mdx/reading-time.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/mdx/schema.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/lib/mdx/toc.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/data/schemas.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
    server: {
      deps: {
        inline: ['next-intl', 'github-slugger'],
      },
    },
  },
});
