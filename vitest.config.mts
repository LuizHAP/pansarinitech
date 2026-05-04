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
  'src/components/shared/header.tsx',
  'src/components/shared/footer.tsx',
  'src/components/shared/theme-toggle.tsx',
  'src/components/shared/locale-toggle.tsx',
  'src/components/shared/skip-to-content.tsx',
];

const PURE_100 = { statements: 100, branches: 100, functions: 100, lines: 100 };
const COMPONENT_TARGET = { statements: 70, branches: 60, functions: 70, lines: 70 };

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Coverage is aggregated across all projects.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: [...LIB_DATA_FILES, ...COMPONENT_FILES],
      thresholds: {
        // Surgical 100% gate on pure-logic TS modules — UNCHANGED.
        ...Object.fromEntries(LIB_DATA_FILES.map((f) => [f, PURE_100])),
        // Pragmatic gate on components — render-coverage, not branch-perfection.
        ...Object.fromEntries(COMPONENT_FILES.map((f) => [f, COMPONENT_TARGET])),
      },
    },
    server: {
      deps: {
        inline: ['next-intl', 'github-slugger'],
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'src/lib/**/*.test.ts',
            'src/lib/**/*.test.tsx',
            'src/data/**/*.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: [
            'src/components/**/*.test.ts',
            'src/components/**/*.test.tsx',
          ],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
