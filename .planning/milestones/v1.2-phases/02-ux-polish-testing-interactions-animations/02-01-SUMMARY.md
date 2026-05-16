---
phase: 02-ux-polish-testing-interactions-animations
plan: "01"
subsystem: copy-email-button
tags: [animation, testing, motion, lucide-react, vitest]
dependency_graph:
  requires: []
  provides: [animated-icon-swap, test-7-icon-swap]
  affects: [src/components/sections/copy-email-button.tsx, src/components/sections/copy-email-button.test.tsx]
tech_stack:
  added: []
  patterns: [AnimatePresence-mode-wait, vi.mock-motion-react-for-jsdom, vi.mock-lucide-react-data-testid]
key_files:
  created: []
  modified:
    - src/components/sections/copy-email-button.tsx
    - src/components/sections/copy-email-button.test.tsx
decisions:
  - "Mock motion/react in tests with a synchronous AnimatePresence stub to avoid jsdom holding exiting elements during fake exit transitions"
  - "Use vi.mock('lucide-react') spreading ...actual to avoid breaking other lucide imports while injecting data-testid spans for Check and CopyIcon"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-13"
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 01: AnimatePresence Icon Swap for CopyEmailButton Summary

**One-liner:** Animated Check/CopyIcon swap via AnimatePresence mode="wait" with 150ms opacity+scale transition, verified by 7 Vitest tests including new Test 7 that uses synchronous motion/react mock.

---

## Tasks Completed

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: Add AnimatePresence icon swap | `953e6b2` | AnimatePresence with motion.span key="check"/"copy", Check green icon, 150ms easeOut |
| Task 2: Add Test 7 (icon swap) | `bb8ccc4` | vi.mock lucide-react + motion/react; Test 7 asserts check-icon/copy-icon swap |

---

## What Was Built

### copy-email-button.tsx

- Added `Check` import from `lucide-react` alongside existing `CopyIcon`
- Added `AnimatePresence` and `motion` imports from `motion/react`
- Replaced static `<CopyIcon />` with `<AnimatePresence mode="wait" initial={false}>` block
- `motion.span key="check"` wraps `<Check>` with `className="text-green-600 dark:text-green-400"` — shown when `copied=true`
- `motion.span key="copy"` wraps `<CopyIcon>` — shown when `copied=false`
- Both motion.span elements use `initial={{ opacity: 0, scale: 0.6 }}`, `animate={{ opacity: 1, scale: 1 }}`, `exit={{ opacity: 0, scale: 0.6 }}`, `transition={{ duration: 0.15, ease: 'easeOut' }}`
- `MotionConfig reducedMotion="user"` in layout.tsx suppresses all motion globally — no per-component guard needed

### copy-email-button.test.tsx

- Added `vi.mock('lucide-react')` at module scope: spreads `...actual`, replaces `Check` and `CopyIcon` with `data-testid` spans (`check-icon`, `copy-icon`)
- Added `vi.mock('motion/react')` at module scope: makes `AnimatePresence` render children synchronously (via `React.createElement(React.Fragment)`) and `motion.*` elements render as plain HTML elements without animation props — prevents jsdom from holding exiting elements in the DOM
- Added Test 7: sets up clipboard success, renders component, asserts `copy-icon` present and `check-icon` absent before click; asserts `check-icon` present and `copy-icon` absent after click

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added motion/react mock to fix Test 7 in jsdom**
- **Found during:** Task 2
- **Issue:** `AnimatePresence mode="wait"` holds the exiting element in the DOM until the exit animation completes. In jsdom there are no real animation frames, so the exiting `motion.span key="copy"` was never removed. Test 7 assertion `queryByTestId('copy-icon') === null` failed because `copy-icon` remained in DOM.
- **Fix:** Added `vi.mock('motion/react')` that replaces `AnimatePresence` with a synchronous `React.Fragment` wrapper and `motion.*` elements with plain HTML elements. This is the correct approach for jsdom tests — it mirrors the animation's end state without requiring animation frames.
- **Files modified:** `src/components/sections/copy-email-button.test.tsx`
- **Commit:** `bb8ccc4`

**2. [Rule 1 - Bug] Fixed Biome import order in copy-email-button.tsx**
- **Found during:** Task 1 commit (pre-commit hook)
- **Issue:** Biome `organizeImports` rule required `lucide-react` before `motion/react` (alphabetical by package scope: `l` < `m`)
- **Fix:** Swapped import order: `lucide-react` first, `motion/react` second
- **Files modified:** `src/components/sections/copy-email-button.tsx`
- **Commit:** `953e6b2`

**3. [Rule 1 - Bug] Fixed Biome import order and formatting in copy-email-button.test.tsx**
- **Found during:** Task 2 commit (pre-commit hook)
- **Issue:** Biome `organizeImports` wanted `@testing-library/user-event` before `react` (scoped packages sort before unscoped). Also, Biome formatter wanted inline destructuring and shorter filter lambda.
- **Fix:** Reordered imports and reformatted the motion mock's `get()` handler per Biome rules
- **Files modified:** `src/components/sections/copy-email-button.test.tsx`
- **Commit:** `bb8ccc4`

---

## Test Results

```
Test Files  25 passed (25)
     Tests  200 passed (200)
  Duration  ~5s
```

- `copy-email-button.test.tsx`: 7 tests | 7 passed
- No regressions across the 25 test files (199 pre-existing + 1 new)

---

## Known Stubs

None — all functionality is wired and verified.

---

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The `vi.mock('lucide-react')` is test-only (Vitest module isolation) per T-02-02 in the plan's threat register.

---

## Self-Check: PASSED

- `src/components/sections/copy-email-button.tsx` — exists, contains `AnimatePresence`, `Check`, `CopyIcon`
- `src/components/sections/copy-email-button.test.tsx` — exists, contains Test 7
- Commit `953e6b2` — exists (feat task 1)
- Commit `bb8ccc4` — exists (test task 2)
- 200/200 tests pass
