---
phase: 09-quality-verification
plan: 01
subsystem: testing
tags: [playwright, axe-core, wcag, a11y, vitest, iphone-se, inline-badge, css-variables]

# Dependency graph
requires:
  - phase: 08-author-integrate-uaubox-ds-case-study
    provides: UAUBox DS case study pages live on /projects/uaubox-design-system in both locales
provides:
  - axe-core matrix covering /projects/uaubox-design-system (28 tests, 7×4 combos)
  - iPhone SE 375px gate covering /projects/uaubox-design-system (28 tests, 7×4 combos)
  - UAUBox hero image mock in case-study-hero unit test suite
  - WCAG AA InlineBadge primary contrast fix for Sith dark mode (--badge-primary-text token)
affects:
  - future a11y matrix additions (add PAGES entry pattern)
  - future case study additions (add vi.mock hero entry pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PAGES array in a11y-matrix.spec.ts: one entry per route segment (path thunk + desc string)"
    - "scenarios array in iphone-se.spec.ts: one url entry per route to test"
    - "vi.mock factory form for static image imports: () => ({ default: { src, width, height, blurDataURL } })"
    - "--badge-primary-text CSS var: separate token for primary-colored text on dark backgrounds (contrast-safe)"

key-files:
  created: []
  modified:
    - tests/a11y-matrix.spec.ts
    - tests/iphone-se.spec.ts
    - src/components/sections/case-study-hero.test.tsx
    - src/components/mdx/inline-badge.tsx
    - src/app/globals.css

key-decisions:
  - "Add --badge-primary-text CSS token (oklch 70% 0.21 28) for dark-mode primary text on dark backgrounds: keeps --primary calibrated for button (white text on red bg) while providing contrast-safe text alternative for InlineBadge"
  - "dark:text-[var(--badge-primary-text)] override in InlineBadge primary variant preserves existing test assertion (toContain text-primary) since both classes coexist in the className string"
  - "Must rebuild Next.js before re-running Playwright a11y/iphone-se tests: Playwright tests the compiled .next/ bundle, not dev server"

patterns-established:
  - "Phase N additions comment: each PAGES/scenarios entry gets a comment marking the adding phase (e.g., // Phase 8 addition)"

requirements-completed:
  - CASE-10
  - CASE-11
  - CASE-12
  - CASE-14

# Metrics
duration: 9min
completed: 2026-05-21
---

# Phase 9 Plan 01: Quality Verification — UAUBox Case Study Test Coverage Summary

**UAUBox case study added to all 4 quality gates (a11y 28/28, iPhone SE 28/28, unit coverage 36/36) with an auto-fixed WCAG AA contrast bug in InlineBadge primary variant for Sith dark mode**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-05-21T22:18:41Z
- **Completed:** 2026-05-21T22:27:10Z
- **Tasks:** 3
- **Files modified:** 5 (+ skill-icons.json Biome format fix)

## Accomplishments

- Confirmed baseline: unit coverage 36 files / 241 tests / all thresholds met; E2E 9/9 flows pass — no Phase 8 regressions
- Extended a11y-matrix.spec.ts PAGES array with UAUBox entry — 24 → 28 tests (7 pages × 4 locale/theme combos), all pass with 0 axe violations
- Extended iphone-se.spec.ts scenarios array with UAUBox entry — 24 → 28 tests (7 scenarios × 4 combos), body.scrollWidth ≤ 375 confirmed
- Added fourth vi.mock factory block for UAUBox hero image in case-study-hero.test.tsx — correctness fix for static import shape in jsdom
- Auto-fixed WCAG 1.4.3 AA contrast violation in InlineBadge `primary` variant under Sith dark mode (Rule 1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify unit coverage and E2E regression baseline** — no commit (read-only verification)
2. **Task 2: Add UAUBox to a11y matrix and iPhone SE spec files** — `abd5fcd` (feat)
3. **Task 3: Add UAUBox hero image mock to case-study-hero.test.tsx** — `4ea933c` (test)

## Files Created/Modified

- `tests/a11y-matrix.spec.ts` — Added UAUBox entry to PAGES array; 24 → 28 tests
- `tests/iphone-se.spec.ts` — Added UAUBox entry to scenarios array; 24 → 28 tests
- `src/components/sections/case-study-hero.test.tsx` — Added UAUBox hero vi.mock factory block
- `src/components/mdx/inline-badge.tsx` — Added dark:text-[var(--badge-primary-text)] to primary variant
- `src/app/globals.css` — Added --badge-primary-text token (light and dark sections)

## Decisions Made

- Kept `--primary` at `oklch(54% 0.21 28)` — calibrated for white-text-on-red-button contrast; did not change it
- Added separate `--badge-primary-text` token at `oklch(70% 0.21 28)` for text-as-primary on dark backgrounds — achieves ≥5.0:1 against `oklch(10%)` dark background
- Used `dark:text-[var(--badge-primary-text)]` in InlineBadge rather than an inline OKLCH value — preserves CSS-variable-only rule from CLAUDE.md
- Rebuild required before Playwright re-runs: `.next/` served by `pnpm next start` does not hot-reload CSS changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] InlineBadge primary variant fails WCAG 1.4.3 AA contrast in Sith dark mode**
- **Found during:** Task 2 (Add UAUBox to a11y matrix)
- **Issue:** `<InlineBadge variant="primary">CSS custom properties</InlineBadge>` in UAUBox MDX produced `text-primary` (Sith red `oklch(54% 0.21 28)` = `#cd1819`) on the dark page background (`oklch(10%) = #020306`). axe reported contrast ratio 3.67:1 — below WCAG AA 4.5:1 for small text (text-xs = 12px). Tests: `[en-dark]` and `[pt-dark]` failed.
- **Fix:** Added `--badge-primary-text: oklch(70% 0.21 28)` to both `:root` (same as `--primary` for light) and `.dark` (lighter saber red, ≥5.0:1 against dark bg). Applied `dark:text-[var(--badge-primary-text)]` to the InlineBadge `primary` VARIANT_STYLES entry. Rebuilt `.next/` for Playwright to pick up the CSS change.
- **Files modified:** `src/app/globals.css`, `src/components/mdx/inline-badge.tsx`
- **Verification:** All 28 a11y-matrix tests pass after rebuild, 0 axe violations on all UAUBox locale/theme combos
- **Committed in:** `abd5fcd` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Auto-fix necessary for WCAG AA compliance. No scope creep. InlineBadge existing test unchanged (className still contains `text-primary`).

## Issues Encountered

- `src/data/skill-icons.json` had unstaged formatting drift (pre-existing, unrelated to plan); Biome pre-commit hook flagged it. Applied `biome format --write` to normalize before the Task 2 commit.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 4 quality gates pass: `pnpm test:unit:coverage` (36/36, 241 tests), `pnpm test:e2e` (9/9), `pnpm test:a11y` (28/28), `pnpm test:iphone-se` (28/28)
- CASE-10, CASE-11, CASE-12, CASE-14 closed
- CASE-13 (Lighthouse ≥ 95 on UAUBox case study) tracked in 09-02-PLAN.md
- Ready for Phase 9 Plan 02 (Lighthouse gate + Sith contrast smoke check)

---

*Phase: 09-quality-verification*
*Completed: 2026-05-21*
