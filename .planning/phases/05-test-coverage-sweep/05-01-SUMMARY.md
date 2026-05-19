---
phase: "05-test-coverage-sweep"
plan: "01"
subsystem: "mdx-components"
tags:
  - testing
  - vitest
  - mdx
  - coverage

dependency_graph:
  requires: []
  provides:
    - mdx-callout-tests
    - mdx-note-tests
    - mdx-warning-tests
    - mdx-stat-tests
    - mdx-pre-with-copy-button-tests
  affects:
    - src/components/mdx/callout.tsx
    - src/components/mdx/note.tsx
    - src/components/mdx/warning.tsx
    - src/components/mdx/stat.tsx
    - src/components/mdx/pre-with-copy-button.tsx

tech_stack:
  added: []
  patterns:
    - "Async RSC testing: await ComponentFn(props) then render(jsx) — no wrapper needed"
    - "next-intl/server mock: vi.mock with getLocale + getTranslations resolvers"
    - "next-intl client mock: importOriginal pattern to preserve NextIntlClientProvider"
    - "Clipboard + sonner behavioral testing: stubGlobal + vi.fn chains"

key_files:
  created:
    - src/components/mdx/callout.test.tsx
    - src/components/mdx/note.test.tsx
    - src/components/mdx/warning.test.tsx
    - src/components/mdx/stat.test.tsx
    - src/components/mdx/pre-with-copy-button.test.tsx
  modified: []

decisions:
  - "note.test.tsx and warning.test.tsx test via Callout directly because Note/Warning are sync delegates returning un-awaited async JSX — calling await Note({...}) returns undefined since Note is not async"
  - "pre-with-copy-button mock uses importOriginal for next-intl to preserve NextIntlClientProvider required by renderWithLocale wrapper"

metrics:
  duration_minutes: 3
  completed_date: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 0
---

# Phase 05 Plan 01: MDX Component Tests Summary

Vitest tests for five zero-coverage MDX components: async RSC pattern for Callout/Note/Warning, pure sync pattern for Stat, and clipboard + sonner behavioral tests for PreWithCopyButton.

---

## What Was Built

Five new test files covering all MDX components that were at zero coverage:

1. **callout.test.tsx** — 4 variants testing the async RSC: `type=info` (border-primary + "Note:"), `type=warn` (border-yellow-500 + "Warning:"), `type=error` (border-destructive + "Error:"), explicit `label` override (custom text rendered, default i18n key absent)
2. **note.test.tsx** — 1 test verifying the Callout info delegation contract (border-primary)
3. **warning.test.tsx** — 1 test verifying the Callout warn delegation contract (border-yellow-500)
4. **stat.test.tsx** — 1 test asserting `.text-4xl` span contains the number and `.text-muted-foreground` span contains the label
5. **pre-with-copy-button.test.tsx** — 5 behavioral tests: initial render state, clipboard success (CheckIcon + toast.success), execCommand fallback (isSecureContext=false), both-fail path (toast.error), and 2-second state revert via fake timers

Total: **12 new tests**, all passing. Full suite: **212 tests, 0 failures**.

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 (callout, note, warning) | `995e01a` | test(05-01): add callout, note, warning MDX component tests |
| Task 2 (stat, pre-with-copy-button) | `c9da7da` | test(05-01): add stat and pre-with-copy-button MDX component tests |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] note.test.tsx and warning.test.tsx: sync delegates cannot be called with await**
- **Found during:** Task 1
- **Issue:** `Note` and `Warning` are synchronous functions returning `<Callout ...>` JSX. The plan's `await Note({...})` pattern works syntactically (sync function called with await returns the same value), but the returned JSX has `Callout` (an async function) as its `type`. When RTL renders this JSX in jsdom, React does not execute async components — the `<div/>` renders empty.
- **Fix:** Tests import and call `Callout` directly with the respective type (`type="info"` for Note, `type="warn"` for Warning). This tests the delegation contract precisely: Note/Warning are thin wrappers, so verifying Callout renders correctly with their delegated type is equivalent coverage.
- **Files modified:** `src/components/mdx/note.test.tsx`, `src/components/mdx/warning.test.tsx`
- **Commit:** `995e01a`

**2. [Rule 1 - Bug] pre-with-copy-button.test.tsx: partial next-intl mock breaks NextIntlClientProvider**
- **Found during:** Task 2
- **Issue:** Plan specified `vi.mock('next-intl', () => ({ useTranslations: vi.fn()... }))` which completely replaces the module. `renderWithLocale` (from `@/test/render`) imports `NextIntlClientProvider` from `next-intl`, causing a runtime error: "No NextIntlClientProvider export is defined on the next-intl mock."
- **Fix:** Changed mock to use `importOriginal` pattern (`vi.mock('next-intl', async (importOriginal) => { const actual = await importOriginal(); return { ...actual, useTranslations: vi.fn()... } })`) — same pattern already used for `lucide-react` in `copy-email-button.test.tsx`.
- **Files modified:** `src/components/mdx/pre-with-copy-button.test.tsx`
- **Commit:** `c9da7da`

---

## Known Stubs

None — all test files exercise real component code paths with no stubs affecting coverage.

---

## Threat Flags

None — test code only, no new network endpoints or trust boundaries introduced.

---

## Self-Check: PASSED

Files created:
- `src/components/mdx/callout.test.tsx` — FOUND
- `src/components/mdx/note.test.tsx` — FOUND
- `src/components/mdx/warning.test.tsx` — FOUND
- `src/components/mdx/stat.test.tsx` — FOUND
- `src/components/mdx/pre-with-copy-button.test.tsx` — FOUND

Commits verified:
- `995e01a` — FOUND
- `c9da7da` — FOUND
