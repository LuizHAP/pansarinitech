---
phase: 05-test-coverage-sweep
plan: "02"
subsystem: testing
tags: [vitest, testing-library, json-ld, xss, coverage]
dependency_graph:
  requires: []
  provides: [TEST-02]
  affects: [src/components/json-ld.tsx]
tech_stack:
  added: []
  patterns: [raw-rtl-render, optional-chaining-in-tests]
key_files:
  created:
    - src/components/json-ld.test.tsx
  modified: []
decisions:
  - "Use optional chaining (?.) instead of non-null assertion (!) to satisfy biome lint/style/noNonNullAssertion rule"
  - "4 focused tests: script output, XSS escape boundary, AUTHOR_PERSON shape, SITE_URL non-empty"
metrics:
  duration: "64s"
  completed_date: "2026-05-19"
  tasks_completed: 1
  files_created: 1
  files_modified: 0
---

# Phase 5 Plan 02: json-ld Component Tests Summary

**One-liner:** 4 vitest tests for JsonLd RSC covering script output, XSS `<` → `<` escape boundary, AUTHOR_PERSON shape, and SITE_URL non-empty assertion.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | json-ld.test.tsx — script output, XSS escape, exported constants | d229a5e | src/components/json-ld.test.tsx |

---

## What Was Built

Created `src/components/json-ld.test.tsx` with 4 Vitest tests targeting `json-ld.tsx`:

1. **Script output test** — renders `<JsonLd schema={...} />` and asserts the `<script type="application/ld+json">` element exists with `innerHTML` equal to `JSON.stringify(schema)`.

2. **XSS escape test** — renders with a schema containing `<script>alert(1)</script>` as a value and asserts:
   - `innerHTML` does NOT contain a raw `<` character
   - `innerHTML` DOES contain `<`
   - This explicitly documents and validates the security boundary established in Phase 4 (`replace(/</g, '\\u003c')`).

3. **AUTHOR_PERSON shape test** — asserts `AUTHOR_PERSON['@type'] === 'Person'` and `AUTHOR_PERSON.name === 'Luiz Pansarini'`.

4. **SITE_URL non-empty test** — asserts `typeof SITE_URL === 'string'` and `SITE_URL.length > 0`.

Tests run under the `jsdom` Vitest project (picked up by `src/components/**/*.test.tsx` include pattern). Raw `@testing-library/react` render is used — no locale wrapper or ThemeProvider needed.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced non-null assertions (`!`) with optional chaining (`?.`)**
- **Found during:** Task 1 — pre-commit hook (biome lint)
- **Issue:** `scriptEl!.innerHTML` triggers `lint/style/noNonNullAssertion` in biome. The assertions `expect(scriptEl).not.toBeNull()` already guard the flow at test runtime; `?.` is semantically equivalent here and passes the linter.
- **Fix:** Changed `scriptEl!.innerHTML` to `scriptEl?.innerHTML` in lines 18, 28, and 30.
- **Files modified:** `src/components/json-ld.test.tsx`
- **Commit:** d229a5e (same commit — fixed before final commit)

---

## Test Results

- **Before plan:** 212 tests (31 files)
- **After plan:** 216 tests (31 files + 1 new)
- **New tests added:** 4
- **Regressions:** 0

---

## Known Stubs

None — all 4 tests assert real behavior against the live `json-ld.tsx` implementation.

---

## Threat Flags

The XSS escape test (Test 2) explicitly validates threat T-05-03 from the plan's threat model — `<` in schema values is escaped to `<` before insertion into the script tag. No new threat surface introduced.

---

## Self-Check: PASSED

- [x] `src/components/json-ld.test.tsx` — FOUND
- [x] Commit `d229a5e` — FOUND
- [x] 216 tests pass, 0 regressions
