---
phase: 02-ux-polish-testing-interactions-animations
plan: "02"
subsystem: micro-interactions
tags: [css, focus-ring, link-hover, ux-consistency, a11y]
dependency_graph:
  requires: []
  provides: [UX-12-complete]
  affects: [skills.tsx, now-preview.tsx]
tech_stack:
  added: []
  patterns:
    - focus-visible:ring-3 focus-visible:ring-ring/50 for toggle/chip buttons
    - decoration-2 underline-offset-4 hover:decoration-foreground for inline prose links
key_files:
  created: []
  modified:
    - src/components/sections/skills.tsx
    - src/components/sections/now-preview.tsx
decisions:
  - "Inline prose links use decoration-2 / underline-offset-4 / hover:decoration-foreground, NOT font-semibold or text-foreground, to preserve paragraph flow"
  - "Filter chip focus rings match contact button pattern: ring-3 ring-ring/50"
metrics:
  duration: "3 minutes"
  completed: "2026-05-13"
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 02: UX-12 Micro-Interaction Deviations — Fixed Summary

**One-liner:** Surgical CSS-class fixes to align Skills chip focus ring (ring-3/ring-ring/50) and NowPreview inline link (decoration-2/underline-offset-4/hover:decoration-foreground) with established project patterns.

---

## What Was Built

Two one-line class-string corrections closing the final two deviations flagged by the UX-12 audit:

**DEV-1 (skills.tsx):** Filter chip buttons had `focus-visible:ring-2 focus-visible:ring-ring`. Changed to `focus-visible:ring-3 focus-visible:ring-ring/50` to match the contact.tsx button focus ring pattern.

**DEV-2 (now-preview.tsx):** The `/now` page link had `underline decoration-primary underline-offset-2 hover:opacity-80`. Changed to `underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground` to match featured-projects-teaser.tsx nav link pattern.

No logic, data flow, or structural changes — pure CSS class corrections.

---

## Tasks

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | DEV-1 — Skills filter chip focus ring | dc05532 | src/components/sections/skills.tsx |
| 2 | DEV-2 — NowPreview link hover pattern | 7803e58 | src/components/sections/now-preview.tsx |

---

## Deviations from Plan

None — plan executed exactly as written. Both changes were surgical single-line edits matching the plan's `<interfaces>` spec.

---

## Verification

- `pnpm test --run`: 200 tests pass (25 test files), no regressions
- skills.tsx: `focus-visible:ring-3 focus-visible:ring-ring/50` confirmed; no `ring-2` or bare `ring-ring` remain
- now-preview.tsx: `underline-offset-4` and `hover:decoration-foreground` confirmed; no `underline-offset-2` or `hover:opacity-80` remain

---

## Known Stubs

None.

---

## Threat Flags

None — pure CSS class changes; no new trust boundaries, network endpoints, auth paths, or schema changes introduced.

---

## Self-Check: PASSED

- [x] `src/components/sections/skills.tsx` modified with correct ring classes
- [x] `src/components/sections/now-preview.tsx` modified with correct decoration classes
- [x] Commits dc05532 and 7803e58 exist on main
- [x] 200 tests pass with 0 regressions
