---
plan: 06-02
phase: 06-mdx-component-toolkit-expansion
status: completed
completed_at: "2026-05-19"
---

# Plan 06-02 Summary — Tests + vitest Coverage Config

## What Was Built

**Task 1: CodeFilename tests (async RSC mock pattern)**
- Created `src/components/mdx/code-filename.test.tsx`
- Mock: `vi.mock('next-intl/server', ...)` with `getLocale → 'en'`, `getTranslations → fn('codeFilename.ariaPrefix') → 'File'`
- 4 test cases: filename text rendered, FileIcon aria-hidden svg, aria-label format (`File: src/app/page.tsx`), children passthrough

**Task 2: InlineBadge tests + vitest expansion**
- Created `src/components/mdx/inline-badge.test.tsx`
- Pure sync — no `vi.mock` needed
- 6 test cases: children text, primary default classes, secondary (bg-muted/text-muted-foreground), muted, destructive, span element type
- Updated `vitest.config.mts`: appended `'src/components/mdx/code-filename.tsx'` and `'src/components/mdx/inline-badge.tsx'` to `COMPONENT_FILES` — both auto-get `COMPONENT_TARGET` (70/60/70/70) via `Object.fromEntries` spread

## Verification

- `pnpm test:unit` — 239 tests passed (36 test files) ✓
- `pnpm test:unit:coverage` — exits 0; all files above COMPONENT_TARGET thresholds ✓
- Both new test files in passing suite ✓
- Both new component files in `vitest.config.mts` COMPONENT_FILES ✓

## Decisions Applied

- T-06-04: Coverage scope expanded, not reduced
- T-06-05: Coverage gate (`pnpm test:unit:coverage`) is the audit trail for both new components
