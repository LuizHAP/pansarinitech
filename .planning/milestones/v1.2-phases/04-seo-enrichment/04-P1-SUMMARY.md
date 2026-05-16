---
phase: 04-seo-enrichment
plan: 1
subsystem: seo
tags: [json-ld, structured-data, schema-org, prose, tailwind, rsc, next-js]

# Dependency graph
requires:
  - phase: 03-automated-content-pipeline
    provides: blog and project post pages with MDX content and readingTime
provides:
  - shared JsonLd RSC component at src/components/json-ld.tsx
  - Article schema injection on every blog post page
  - WebPage schema injection on every project post page
  - prose heading vertical spacing overrides (prose-h2:mt-10, prose-h3:mt-8, prose-headings:scroll-mt-20) on both post pages
affects: [verifier, lighthouse-seo, search-engines, ai-crawlers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSON-LD via RSC dangerouslySetInnerHTML: safe pattern for structured data with owner-controlled Zod-validated content"
    - "Re-export SITE_URL from seo.ts: single source of truth for canonical URL base across metadata and structured data"
    - "Biome-ignore for noDangerouslySetInnerHtml: idiomatic JSON-LD suppression with justification comment"

key-files:
  created:
    - src/components/json-ld.tsx
  modified:
    - src/lib/seo.ts
    - src/app/[locale]/blog/[slug]/page.tsx
    - src/app/[locale]/projects/[slug]/page.tsx

key-decisions:
  - "Export SITE_URL from seo.ts (add export keyword) — single canonical URL source shared by buildMetadata and JsonLd"
  - "AUTHOR_PERSON exported from json-ld.tsx as const — reused for both author and publisher fields in Article and WebPage schemas"
  - "Blog schema @type Article with headline/description/author/publisher/datePublished/url/inLanguage/keywords/image/wordCount"
  - "Project schema @type WebPage (avoids SoftwareApplication required fields); datePublished stubs to ${year}-01-01"
  - "JsonLd placed as first child of <article> element in both pages — App Router hoists to <head> at build time"
  - "biome-ignore lint/security/noDangerouslySetInnerHtml with justification comment — content is Zod-validated owner-only MDX frontmatter"

patterns-established:
  - "JsonLd RSC pattern: import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld'; render as first child of <article>"
  - "Prose heading overrides: prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20 appended inline to existing prose wrapper className"

requirements-completed: [SEO-01, SEO-02]

# Metrics
duration: 15min
completed: 2026-05-15
---

# Phase 4 Plan 1: SEO Enrichment Summary

**Shared JsonLd RSC injecting Article/WebPage schema.org structured data into blog and project post pages, plus prose heading vertical spacing overrides for visual hierarchy and TOC anchor clearing.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-15T18:54:00Z
- **Completed:** 2026-05-15T19:10:00Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments
- Created `src/components/json-ld.tsx` — zero-JS RSC that serializes any schema object into `<script type="application/ld+json">` via dangerouslySetInnerHTML; exports `AUTHOR_PERSON` and re-exports `SITE_URL`
- Exported `SITE_URL` from `src/lib/seo.ts` (added `export` keyword) to establish a single source of truth for canonical URL base used by both `buildMetadata` and `JsonLd`
- Injected Article schema into every blog post page and WebPage schema into every project post page — both with full rich fields (headline/name, description, author, publisher, datePublished, url, inLanguage, keywords, image, wordCount)
- Added `prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20` to both prose wrapper divs — headings now have distinct vertical spacing and TOC anchor links clear the sticky header

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared JsonLd RSC** - `15ae0b5` (feat)
2. **Task 2: Wire prose heading overrides and JsonLd into both post pages** - `91f3cd9` (feat)

**Plan metadata:** _(committed as part of this docs commit)_

## Files Created/Modified
- `src/components/json-ld.tsx` — Shared RSC; renders ld+json script; exports `AUTHOR_PERSON` and `SITE_URL`
- `src/lib/seo.ts` — Added `export` to `SITE_URL` constant (single source of truth)
- `src/app/[locale]/blog/[slug]/page.tsx` — Added `JsonLd` with Article schema as first child of `<article>`; added prose heading override classes
- `src/app/[locale]/projects/[slug]/page.tsx` — Added `JsonLd` with WebPage schema as first child of `<article>`; added prose heading override classes

## Decisions Made
- Chose option (a) from plan: add `export` to `SITE_URL` in `seo.ts` rather than re-declaring it in `json-ld.tsx` — keeps single source of truth
- Used `biome-ignore lint/security/noDangerouslySetInnerHtml` (not ESLint) with justification comment — project linter is Biome, not ESLint
- Project schema `@type: "WebPage"` (not `SoftwareApplication`) — avoids required fields missing from `ProjectFrontmatter`
- `datePublished` for projects stubs to `"${project.year}-01-01"` — `year` is `number` in frontmatter, no day-level date available
- `wordCount` calculated as `Math.round(readingTime.minutes * 200)` — 200 wpm convention

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome linter rejecting ESLint comment format for dangerouslySetInnerHTML**
- **Found during:** Task 1 (commit attempt)
- **Issue:** Plan specified `// eslint-disable-next-line react/no-danger` but project uses Biome, not ESLint; Biome flagged `noDangerouslySetInnerHtml` and blocked the commit
- **Fix:** Replaced ESLint comment with `// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script tags require dangerouslySetInnerHTML; content comes from Zod-validated frontmatter (site owner only — no user input)`
- **Files modified:** `src/components/json-ld.tsx`
- **Verification:** `biome check` passes, pre-commit hook passes
- **Committed in:** `15ae0b5` (Task 1 commit, second attempt)

**2. [Rule 1 - Bug] Fixed import ordering violations in both page files**
- **Found during:** Task 2 (commit attempt)
- **Issue:** Biome organizeImports rule required `@/components/json-ld` import to precede `@/i18n/routing` in blog page, and to precede `@/components/sections` in projects page (alphabetical `@/components/json-ld` < `@/components/sections` < `@/i18n/routing`)
- **Fix:** Reordered import statements in both page files to satisfy Biome's organizeImports ordering
- **Files modified:** `src/app/[locale]/blog/[slug]/page.tsx`, `src/app/[locale]/projects/[slug]/page.tsx`
- **Verification:** `biome check` passes, pre-commit hook passes
- **Committed in:** `91f3cd9` (Task 2 commit, second attempt)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — linter compliance)
**Impact on plan:** Both fixes are mechanical corrections required by the Biome linter enforced in pre-commit hooks. No scope creep, no architectural change.

## Issues Encountered
- Pre-commit hook rejects ESLint-style suppression comments — project is Biome-only; all suppressions must use `biome-ignore` syntax
- Biome `organizeImports` is strict alphabetical within `@/` paths — new imports must be inserted in sorted order

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SEO-01 and SEO-02 fully implemented: prose heading overrides and JSON-LD structured data in place on all post pages
- Phase 4 complete — no further plans in this phase
- Google's Rich Results Test can be used post-deploy to validate Article and WebPage schemas resolve without errors
- Lighthouse SEO score expected to remain ≥ 95 (no regressions; build passed, 200 tests pass)

---
*Phase: 04-seo-enrichment*
*Completed: 2026-05-15*
