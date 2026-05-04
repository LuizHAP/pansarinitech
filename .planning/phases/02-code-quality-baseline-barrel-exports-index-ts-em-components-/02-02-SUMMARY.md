---
phase: 02
plan: 02
subsystem: components
tags: [barrel-exports, import-refactor, dx, code-quality, shadcn-ui]
dependency_graph:
  requires: [02-01]
  provides: [components/ui/index.ts]
  affects:
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/projects/page.tsx
    - src/app/[locale]/now/page.tsx
    - src/app/[locale]/blog/page.tsx
    - src/app/not-found.tsx
    - src/app/[locale]/not-found.tsx
    - src/components/sections/about.tsx
    - src/components/sections/career-timeline.tsx
    - src/components/sections/case-study-hero.tsx
    - src/components/sections/contact.tsx
    - src/components/sections/featured-projects-teaser.tsx
    - src/components/sections/skills.tsx
    - src/components/blog/post-card.tsx
    - src/components/shared/theme-toggle.tsx
tech_stack:
  added: []
  patterns: [curated-barrel-exports, named-re-exports-per-line, no-export-star, variants-module-private]
key_files:
  created:
    - src/components/ui/index.ts
  modified:
    - src/components/ui/sheet.tsx
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/projects/page.tsx
    - src/app/[locale]/now/page.tsx
    - src/app/[locale]/blog/page.tsx
    - src/app/not-found.tsx
    - src/app/[locale]/not-found.tsx
    - src/components/sections/about.tsx
    - src/components/sections/career-timeline.tsx
    - src/components/sections/case-study-hero.tsx
    - src/components/sections/contact.tsx
    - src/components/sections/featured-projects-teaser.tsx
    - src/components/sections/skills.tsx
    - src/components/blog/post-card.tsx
    - src/components/shared/theme-toggle.tsx
decisions:
  - "buttonVariants, badgeVariants, toggleVariants excluded from ui/index.ts barrel — D-02 (Shadcn variant generators are module-private implementation detail, not public API)"
  - "sheet.tsx intra-ui Button import converted from absolute @/components/ui/button to relative ./button to avoid circular barrel resolution"
metrics:
  duration: "~8min"
  completed: "2026-05-04"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 15
---

# Phase 02 Plan 02: Barrel Exports — ui/ Summary

**One-liner:** Curated `index.ts` barrel for `components/ui/` with all 12 Shadcn component files enumerated (variants excluded per D-02), plus 14 external callsite files migrated to `@/components/ui` — completing the phase-wide no-deep-imports invariant across all four component subdirectories.

---

## What Was Built

### Task 1: ui/ barrel + sheet.tsx fix

**`src/components/ui/index.ts`** — curated barrel with 46 named re-exports across 12 source files:

| Source file | Exported symbols |
|-------------|-----------------|
| `alert.tsx` | Alert, AlertAction, AlertDescription, AlertTitle |
| `badge.tsx` | Badge (`badgeVariants` excluded — D-02) |
| `button.tsx` | Button (`buttonVariants` excluded — D-02) |
| `card.tsx` | Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle |
| `dropdown-menu.tsx` | DropdownMenu + 14 sub-components |
| `reveal-group.tsx` | RevealGroup, RevealItem, RevealSection |
| `separator.tsx` | Separator |
| `sheet.tsx` | Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger |
| `skeleton.tsx` | Skeleton |
| `sonner.tsx` | Toaster |
| `toggle.tsx` | Toggle (`toggleVariants` excluded — D-02) |
| `tooltip.tsx` | Tooltip, TooltipContent, TooltipProvider, TooltipTrigger |

**`src/components/ui/sheet.tsx`** — intra-ui `Button` import converted from `@/components/ui/button` to `./button` (relative) to keep the barrel one-directional and avoid potential circular resolution.

### Task 2: 14 external callsites migrated

| File | Change |
|------|--------|
| `app/[locale]/layout.tsx` | `@/components/ui/sonner` → `@/components/ui` |
| `app/[locale]/projects/page.tsx` | 2 separate ui imports merged into 1 barrel import |
| `app/[locale]/now/page.tsx` | `@/components/ui/card` → `@/components/ui` |
| `app/[locale]/blog/page.tsx` | `@/components/ui/reveal-group` → `@/components/ui` |
| `app/not-found.tsx` | `@/components/ui/button` → `@/components/ui` |
| `app/[locale]/not-found.tsx` | `@/components/ui/button` → `@/components/ui` |
| `sections/about.tsx` | `@/components/ui/reveal-group` → `@/components/ui` |
| `sections/career-timeline.tsx` | 2 separate ui imports merged into 1 alphabetized barrel import |
| `sections/case-study-hero.tsx` | `@/components/ui/badge` → `@/components/ui` |
| `sections/contact.tsx` | `@/components/ui/reveal-group` → `@/components/ui` |
| `sections/featured-projects-teaser.tsx` | 3 separate ui imports merged into 1 barrel import |
| `sections/skills.tsx` | `@/components/ui/reveal-group` → `@/components/ui` |
| `blog/post-card.tsx` | 2 separate ui imports merged into 1 barrel import |
| `shared/theme-toggle.tsx` | `@/components/ui/button` → `@/components/ui` |

---

## Verification Results

- `grep -rn "from '@/components/ui/[a-z]" src/` — zero results (all deep ui imports eliminated)
- `grep -rn "from '@/components/sections/[a-z]\|shared/[a-z]\|blog/[a-z]" src/` — zero results (Plan 02-01 invariants preserved)
- `git diff --name-only src/components/mdx/index.ts` — empty (D-03 honored)
- Combined grep across all 4 subdirectories — zero deep imports phase-wide
- `pnpm tsc --noEmit` — exits with only the pre-existing `seo.test.ts` error (documented in 02-01-SUMMARY; out of scope)
- `pnpm build` — exits 0 (23/23 static pages generated)
- `pnpm test:unit` — 110/110 tests pass

---

## Deviations from Plan

### Pre-existing Issues Noted (Out of Scope)

**Pre-existing TS error in `src/lib/seo.test.ts:63`**
- Carried forward from Plan 02-01 — same issue, same out-of-scope ruling
- `pnpm build` passes; only `tsc --noEmit` surfaces it due to test file inclusion

No other deviations. Plan executed exactly as written.

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | `bae124b` | feat(02-02): create ui/ barrel with all public component exports |
| Task 2 | `4b9b43f` | feat(02-02): migrate all external callsites to ui/ barrel |

---

## Known Stubs

None — this plan is a pure import-path refactor. No UI changes, no data sources, no stubs introduced.

---

## Threat Flags

None — this plan adds no new network endpoints, auth paths, file access patterns, or schema changes. Pure import restructuring at module boundaries.

---

## Self-Check: PASSED

- `src/components/ui/index.ts` — FOUND
- `src/components/ui/sheet.tsx` contains `from './button'` — CONFIRMED
- Commit `bae124b` — FOUND
- Commit `4b9b43f` — FOUND
- Zero deep `@/components/ui/<file>` imports — CONFIRMED
- Zero deep `@/components/{sections,shared,blog}/<file>` imports — CONFIRMED
- `mdx/index.ts` unchanged — CONFIRMED
- `pnpm build` exits 0 — CONFIRMED
- `pnpm test:unit` 110/110 — CONFIRMED
