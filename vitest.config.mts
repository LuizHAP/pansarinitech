// vitest.config.mts — Quick task 260504-msj: split into node (lib/data) and jsdom (components) projects.
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const LIB_DATA_FILES = [
  'src/lib/utils.ts',
  'src/lib/seo.ts',
  'src/lib/i18n/helpers.ts',
  'src/lib/mdx/reading-time.ts',
  'src/lib/mdx/schema.ts',
  'src/lib/mdx/toc.ts',
  'src/data/schemas.ts',
];

const COMPONENT_FILES = [
  'src/components/sections/hero.tsx',
  'src/components/sections/about.tsx',
  'src/components/sections/skills.tsx',
  'src/components/sections/contact.tsx',
  'src/components/sections/career-timeline.tsx',
  'src/components/sections/featured-projects-teaser.tsx',
  'src/components/sections/now-preview.tsx',
  'src/components/sections/case-study-hero.tsx',
  'src/components/sections/copy-email-button.tsx',
  'src/components/shared/header.tsx',
  'src/components/shared/footer.tsx',
  'src/components/shared/theme-toggle.tsx',
  'src/components/shared/locale-toggle.tsx',
  'src/components/shared/skip-to-content.tsx',
  'src/components/shared/easter-egg.tsx',
  'src/components/shared/theme-provider.tsx',
  'src/components/shared/command-palette.tsx',
  'src/components/mdx/callout.tsx',
  'src/components/mdx/note.tsx',
  'src/components/mdx/warning.tsx',
  'src/components/mdx/stat.tsx',
  'src/components/mdx/pre-with-copy-button.tsx',
  'src/components/mdx/code-filename.tsx',
  'src/components/mdx/inline-badge.tsx',
  'src/components/sections/personal-projects.tsx',
  'src/components/blog/post-card.tsx',
  'src/components/blog/toc-mobile.tsx',
  'src/components/blog/toc-sidebar.tsx',
];

const PURE_100 = { statements: 100, branches: 100, functions: 100, lines: 100 };
const COMPONENT_TARGET = { statements: 70, branches: 60, functions: 70, lines: 70 };

// hero.tsx and contact.tsx each have a single `pop() ?? 'resume.pdf'` null-coalescing
// expression. The falsy branch is structurally unreachable: String.prototype.split() never
// returns an empty array, so pop() never returns undefined. v8 counts this as 1/2 branches
// covered (50%). We override just the branch threshold to 50% for these two files.
// All other thresholds remain at COMPONENT_TARGET.
const UNREACHABLE_NULL_COALESCE = { ...COMPONENT_TARGET, branches: 50 };

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Coverage is aggregated across all projects.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: [...LIB_DATA_FILES, ...COMPONENT_FILES, 'src/components/json-ld.tsx'],
      thresholds: {
        // Surgical 100% gate on pure-logic TS modules — UNCHANGED.
        ...Object.fromEntries(LIB_DATA_FILES.map((f) => [f, PURE_100])),
        // Pragmatic gate on components — render-coverage, not branch-perfection.
        ...Object.fromEntries(COMPONENT_FILES.map((f) => [f, COMPONENT_TARGET])),
        // Per-file overrides for structurally unreachable branches (pop() ?? fallback).
        'src/components/sections/hero.tsx': UNREACHABLE_NULL_COALESCE,
        'src/components/sections/contact.tsx': UNREACHABLE_NULL_COALESCE,
        // json-ld.tsx is a pure RSC component with no unreachable branches — 100% required.
        'src/components/json-ld.tsx': PURE_100,
      },
    },
    testTimeout: 15000,
    server: {
      deps: {
        inline: ['next-intl', 'github-slugger', 'cmdk'],
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/lib/**/*.test.ts', 'src/lib/**/*.test.tsx', 'src/data/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/components/**/*.test.ts', 'src/components/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
