---
plan: 07-02
phase: 07
status: complete
wave: 1
completed_at: "2026-05-20"
tags: [seo, hreflang, json-ld, tdd]
key-files:
  modified:
    - src/lib/seo.ts
    - src/lib/seo.test.ts
    - src/components/json-ld.tsx
    - src/components/json-ld.test.tsx
decisions:
  - Changed re-export-only pattern in json-ld.tsx to import+export so SITE_URL is available as a runtime value inside the same module
---

# Phase 7 Plan 02: SEO Hardening — hreflang Alternates + AUTHOR_PERSON Identity

## One-liner

buildMetadata() now emits hreflang alternates (en, pt-BR, x-default) on every route via the Next 16 alternates.languages field, and AUTHOR_PERSON has url + sameAs fields for Google Knowledge Graph linking.

## What was built

- **src/lib/seo.ts**: `buildMetadata()` return value extended — `alternates.languages` now always contains `en`, `pt-BR`, and `x-default` entries, each constructed as `${SITE_URL}/${locale}${path || '/'}`. No signature change; purely additive.
- **src/lib/seo.test.ts**: Added `SITE_URL` to import (sorted per Biome rules). Removed two stale `expect(meta.alternates?.languages).toBeUndefined()` assertions from the locale/canonical describe block. Added new describe block `buildMetadata() — hreflang alternates (D-01)` with two tests: blog path variant and empty-path edge case.
- **src/components/json-ld.tsx**: `AUTHOR_PERSON` extended with `url: SITE_URL` and `sameAs: ['https://github.com/LuizHAP', 'https://linkedin.com/in/luizpansarini']`. `as const` preserved. Changed `export { SITE_URL } from '@/lib/seo'` to `import { SITE_URL } from '@/lib/seo'; export { SITE_URL }` so SITE_URL is available as a value in scope (a re-export-only doesn't bind the name locally).
- **src/components/json-ld.test.tsx**: Extended the `AUTHOR_PERSON export` it() with three new assertions (`url`, `sameAs` containing GitHub URL, `sameAs` containing LinkedIn URL). Updated description string to include "url, and sameAs".

## Requirements fulfilled

- **SEO-03**: hreflang alternates emitted on every route via `buildMetadata()`
- **SEO-04**: `AUTHOR_PERSON` has `url` + `sameAs` enabling Google Knowledge Graph linking

## Decisions made during execution

- **import vs re-export for SITE_URL in json-ld.tsx**: The original `export { SITE_URL } from '@/lib/seo'` syntax re-exports the binding but does not make `SITE_URL` available as a local identifier. Changed to `import { SITE_URL } from '@/lib/seo'; export { SITE_URL }` — functionally equivalent from the consumer's perspective, but now `SITE_URL` is in scope for use inside `AUTHOR_PERSON`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SITE_URL not in scope in json-ld.tsx**

- **Found during:** Task 2, GREEN phase
- **Issue:** The plan instructed "SITE_URL is already in scope in json-ld.tsx (re-exported from @/lib/seo)." However, a bare re-export (`export { X } from '...'`) does not bind the name as a local value — `SITE_URL` could not be used inside `AUTHOR_PERSON` without a proper `import`.
- **Fix:** Changed `export { SITE_URL } from '@/lib/seo'` to `import { SITE_URL } from '@/lib/seo'; export { SITE_URL }`.
- **Files modified:** `src/components/json-ld.tsx`
- **Commit:** bebeacf

## Tests / verification

- `pnpm test` (vitest run): 241 tests, 36 files — all pass
- `pnpm exec tsc --noEmit`: exits 0, no type errors
- Biome lint: no errors
- Pre-commit hook: passed all checks

## Self-Check: PASSED

- src/lib/seo.ts: modified — alternates.languages present
- src/lib/seo.test.ts: modified — SITE_URL imported, new describe block present, no toBeUndefined() on languages
- src/components/json-ld.tsx: modified — AUTHOR_PERSON has url and sameAs, as const preserved
- src/components/json-ld.test.tsx: modified — new assertions on url and sameAs
- Commit bebeacf: verified in git log
