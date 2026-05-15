---
quick_id: 260515-locale-prefix-never
slug: locale-prefix-never
date: 2026-05-15
status: complete
completed_at: 2026-05-15T15:59:53Z
duration_minutes: 5
tasks_completed: 4
files_modified: 4
commits:
  - hash: f97ced1
    message: "feat(i18n): switch localePrefix to never"
  - hash: 5835e2a
    message: "feat(seo): remove locale segment from canonical URLs and drop hreflang alternates"
  - hash: 6b34542
    message: "feat(i18n): simplify switchLocale — no path stripping needed with localePrefix:never"
---

# Quick Task: Remove locale prefix from URLs

## One-liner

Switched next-intl from localePrefix:always to localePrefix:never so URLs are clean (/blog not /en/blog), locale resolved via cookie/Accept-Language, canonical meta is locale-free.

## Tasks completed

### Task 1 — src/i18n/routing.ts (commit f97ced1)
Changed localePrefix: 'always' to localePrefix: 'never'.

### Task 2 — src/lib/seo.ts (commit 5835e2a)
- Canonical URL: SITE_URL/locale/path -> SITE_URL/path (locale-free)
- Removed HREFLANG constant (only used for languages map)
- Removed alternates.languages map (both locales share same URL with localePrefix:never)
- Removed unused routing import; fixed import type style for biome
- Updated seo.test.ts: 2 tests rewritten to assert new behavior

### Task 3 — src/components/shared/locale-toggle-action.ts (commit 6b34542)
Removed regex strip pathname.replace(/^\/(en|pt)(?=\/|$)/, ''); simplified to pathname || '/'.

### Task 4 — Build + tests
- pnpm build: clean, 23 pages, no errors
- pnpm test:unit: 200/200 passed

## Deviations

### Auto-fixed: seo.test.ts updated to match new behavior
Pre-commit hook caught 2 failing tests asserting old languages map. Updated tests to assert alternates.languages is undefined and canonical is locale-free.

### Auto-fixed: import style lint error
biome useImportType rule required import type { Locale } instead of import { type Locale }.

## Self-Check: PASSED

- localePrefix: 'never' confirmed in routing.ts
- Locale-free canonical confirmed in seo.ts
- No regex strip confirmed in locale-toggle-action.ts
- Commits f97ced1, 5835e2a, 6b34542 present in git log
- pnpm build: passed
- pnpm test:unit: 200/200
