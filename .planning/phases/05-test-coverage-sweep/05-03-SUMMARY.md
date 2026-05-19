---
phase: "05-test-coverage-sweep"
plan: "03"
subsystem: "testing"
tags: ["vitest", "blog-components", "post-card", "toc", "async-rsc", "server-components"]
dependency_graph:
  requires: []
  provides: ["TEST-04"]
  affects: ["src/components/blog/"]
tech_stack:
  added: []
  patterns:
    - "Pure sync server component tests: raw render, no mocks needed"
    - "Async RSC tests: await ComponentFn(props), pass JSX result to render()"
    - "Split-text-node assertion: use container.querySelector + textContent for text broken by child elements"
key_files:
  created:
    - "src/components/blog/toc-mobile.test.tsx"
    - "src/components/blog/toc-sidebar.test.tsx"
    - "src/components/blog/post-card.test.tsx"
  modified: []
decisions:
  - "Split-text-node reading-time assertion: getByText fails on text split across sibling nodes (<time> + text); use paragraph textContent instead"
  - "PostCard async RSC mock pattern: mock @/lib/i18n/helpers.formatDate to return fixed string, avoiding Intl locale logic in jsdom"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  files_created: 3
  tests_added: 13
  total_tests_after: 229
---

# Phase 5 Plan 03: Blog Component Test Suite Summary

Vitest test suites for three blog-layer components: TocMobile and TocSidebar (pure sync server components) and PostCard (async RSC with next-intl and locale-aware link dependencies).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | toc-mobile.test.tsx and toc-sidebar.test.tsx | `29cc47a` | src/components/blog/toc-mobile.test.tsx, src/components/blog/toc-sidebar.test.tsx |
| 2 | post-card.test.tsx | `a5c1f44` | src/components/blog/post-card.test.tsx |

## Test Coverage

### toc-mobile.test.tsx (4 tests)
1. Returns null when entries array is empty
2. Applies `ml-4` class to level-3 entries; level-2 entries have no `ml-4`
3. Anchors have correct `href="#${entry.id}"` for each entry
4. Summary element text matches label prop

### toc-sidebar.test.tsx (5 tests)
1. Returns null when entries array is empty
2. Applies `ml-4` class to level-3 entries; level-2 entries have no `ml-4`
3. Nav element exists with `aria-labelledby="toc-heading"`
4. `<h2 id="toc-heading">` text matches label prop
5. Anchors have correct `href="#${entry.id}"` for each entry

### post-card.test.tsx (4 tests)
1. Tags present: renders list with badge count equal to tags.length
2. Tags empty: no list in DOM
3. `<time>` element has `dateTime` attribute matching `post.date`
4. Reading time text appears in paragraph textContent

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reading-time text split across DOM nodes**
- **Found during:** Task 2
- **Issue:** `getByText('3 min read')` failed because the text is a raw text node sibling to `<time>Jan 1, 2025</time>` inside a `<p>`. RTL's `getByText` matches exact text within a single element; the text node "3 min read" has no wrapping element.
- **Fix:** Changed assertion to `container.querySelector('p.text-xs')?.textContent` which includes all text content of the paragraph node (concatenating child text nodes).
- **Files modified:** src/components/blog/post-card.test.tsx
- **Commit:** a5c1f44

**2. [Rule 3 - Blocking] Biome import order and formatting violations**
- **Found during:** Both tasks (pre-commit hooks)
- **Issue:** Biome enforced alphabetical import order and line-length formatting on vi.mock bodies
- **Fix:** Reordered imports (`@testing-library/react` before `react` alphabetically) and reformatted the chained `.fn().mockResolvedValue()` call across multiple lines
- **Files modified:** toc-mobile.test.tsx, toc-sidebar.test.tsx, post-card.test.tsx
- **Commit:** Same commits (fixed before commit)

## Decisions Made

1. **Split-text-node reading-time assertion:** `getByText` fails when the target text is split by sibling child elements. Using `paragraph.textContent` is the idiomatic fix — the guard `expect(paragraph?.textContent).toContain(...)` is functionally equivalent and does not require wrapping every mixed-content paragraph in test utilities.

2. **PostCard formatDate mock:** Mocking `@/lib/i18n/helpers` to return a fixed `'Jan 1, 2025'` string avoids locale-specific Intl output variations across CI environments and keeps assertions locale-agnostic.

## Self-Check: PASSED

- [x] src/components/blog/toc-mobile.test.tsx exists (4 passing tests)
- [x] src/components/blog/toc-sidebar.test.tsx exists (5 passing tests)
- [x] src/components/blog/post-card.test.tsx exists (4 passing tests)
- [x] pnpm vitest run src/components/blog/ exits 0 (13 tests)
- [x] Full test suite: 229 tests passing, 0 regressions
- [x] Commits 29cc47a and a5c1f44 exist in git log
