---
phase: 02-ux-polish-testing-interactions-animations
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/sections/copy-email-button.tsx
  - src/components/sections/copy-email-button.test.tsx
  - src/components/sections/now-preview.tsx
  - src/components/sections/skills.tsx
  - src/components/shared/theme-toggle.tsx
  - src/data/personal-projects.ts
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files from Phase 02 (UX Polish) were reviewed: the AnimatePresence icon-swap in
`CopyEmailButton`, its corresponding test suite, two CSS class corrections in `skills.tsx`
and `now-preview.tsx`, the `mounted` hydration fix in `theme-toggle.tsx`, and the partial
screenshot wiring in `personal-projects.ts`.

The overall quality is solid. The hydration fix, the motion mock strategy in the test, and
the AnimatePresence structure are all correct. However, two blocking issues were found:
`aria-live` is mis-placed on the interactive button element (WCAG 2.1 violation), and
`screenshotDraft` is defined and populated in the data layer but never consumed by the
rendering component — making the flag dead data that silently fails its stated purpose.
Three additional warnings cover an accessibility mis-use of `<fieldset>` in Skills, an
inconsistent screenshot URL prefix, and a missing `prefers-reduced-motion` guard on the
clipboard-success animation in `CopyEmailButton`.

---

## Critical Issues

### CR-01: `aria-live` placed on the interactive `<button>` element

**File:** `src/components/sections/copy-email-button.tsx:72-79`

**Issue:** `aria-live="polite"` is set directly on the `<button>` element. The WAI-ARIA
specification (and every major AT implementation) requires live regions to be non-interactive
container elements. Browsers typically ignore or mishandle `aria-live` on focusable/interactive
roles. Mutations inside the button (the icon swap and the text change at line 105) will not be
reliably announced to screen reader users, defeating the purpose of the attribute entirely.
This is a WCAG 2.1 SC 4.1.3 (Status Messages) failure.

**Fix:** Wrap the changing text in a sibling `<span>` with `aria-live` and `aria-atomic`,
and remove `aria-live` from the `<button>`:

```tsx
<button
  type="button"
  onClick={handleCopy}
  className={
    className ??
    'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
  }
>
  <AnimatePresence mode="wait" initial={false}>
    {/* icon swap — unchanged */}
  </AnimatePresence>
  {/* aria-live on a non-interactive span so AT picks up the text change */}
  <span aria-live="polite" aria-atomic="true">
    {copied ? t('copied') : t('copyButton')}
  </span>
</button>
```

---

### CR-02: `screenshotDraft` flag is defined but never consumed — dead data with a false safety contract

**File:** `src/data/personal-projects.ts:12-13, 43, 81`

**Issue:** `screenshotDraft?: boolean` is documented as marking screenshots from a
pre-redesign build. It is set to `true` for `doacao` and `redzone-boss`. However,
`src/components/sections/personal-projects.tsx` (`ProjectScreenshot`) renders all
screenshots unconditionally — it reads `project.screenshot` but never reads
`project.screenshotDraft`. The flag therefore has zero runtime effect: stale/wrong
screenshots are shown to real users without any visual indicator, overlay, or fallback to
the placeholder gradient. Any future developer reading the type definition will assume the
flag is actively enforced when it is not.

**Fix:** Either (a) enforce the flag in `ProjectScreenshot` so draft screenshots fall back
to the placeholder, or (b) remove the field until the rendering component is updated to use it.

Option A (enforce):
```tsx
function ProjectScreenshot({ project }: { project: PersonalProject }) {
  // Treat screenshotDraft as no screenshot — show placeholder instead.
  if (project.screenshot && !project.screenshotDraft) {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        <Image ... />
      </div>
    );
  }
  // Placeholder gradient (existing code)
  return ( ... );
}
```

Option B (remove until wired up): delete `screenshotDraft` from the interface and both
data entries until `ProjectScreenshot` is updated.

---

## Warnings

### WR-01: `<fieldset>` used as a flex scroll container — invalid HTML structure

**File:** `src/components/sections/skills.tsx:40-67`

**Issue:** A `<fieldset>` wraps the filter toggle buttons with inline `style` for CSS
masking (`WebkitMaskImage`). `<fieldset>` is a block-level form grouping element; using it
as a flex overflow-scroll container with `maskImage` is semantically and structurally wrong
here. The buttons inside are `type="button"` toggles with `aria-pressed`, not radio inputs,
so a `<fieldset>`/`<legend>` pair gives misleading form semantics. Screen readers may
announce this as a form group requiring radio-style interaction. Additionally, `maskImage` on
a `<fieldset>` has inconsistent cross-browser behavior due to UA stylesheets resetting
fieldset layout.

**Fix:** Replace `<fieldset>` with a `<div role="group"` and keep the `<legend>` equivalent
as an `aria-label` or visually-hidden `<span>`:

```tsx
<div
  role="group"
  aria-label={t('filterLabel')} // add key or use 'Filter skills by category'
  className="m-0 mt-4 flex min-w-0 gap-2 overflow-x-auto p-0 pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0"
  style={{
    WebkitMaskImage: 'linear-gradient(90deg,#000 92%,transparent 100%)',
    maskImage: 'linear-gradient(90deg,#000 92%,transparent 100%)',
  }}
>
  {/* buttons unchanged */}
</div>
```

---

### WR-02: Inconsistent screenshot URL prefix in `personal-projects.ts`

**File:** `src/data/personal-projects.ts:28, 42, 80`

**Issue:** `starlimp` uses `screenshot: '/personal-projects/starlimp.png'` (matching
`public/personal-projects/`), while `doacao` and `redzone-boss` use
`screenshot: '/screenshots/doacao.png'` and `screenshot: '/screenshots/redzone-boss.png'`
(pointing to `public/screenshots/`). Two different path conventions exist in the same data
array. `next/image` will serve both correctly since both subdirectories exist in `public/`,
but the inconsistency makes the convention unclear and risks broken paths if either directory
is reorganized.

**Fix:** Consolidate to one subdirectory. Either move `public/screenshots/doacao.png` and
`public/screenshots/redzone-boss.png` into `public/personal-projects/` and update the paths,
or rename `starlimp`'s reference to `/screenshots/starlimp.png`:

```ts
// Preferred: all screenshots under /personal-projects/
screenshot: '/personal-projects/doacao.png',
// ...
screenshot: '/personal-projects/redzone-boss.png',
```

---

### WR-03: `AnimatePresence` icon swap has no `prefers-reduced-motion` guard in the component

**File:** `src/components/sections/copy-email-button.tsx:81-103`

**Issue:** The `motion.span` elements use `initial`/`animate`/`exit` with scale and opacity
transitions. The `ThemeToggle` in this same PR correctly bypasses `startViewTransition` when
`prefers-reduced-motion: reduce` is set. `CopyEmailButton` performs its own animated
transitions through `motion/react` without a `<MotionConfig reducedMotion="user">` wrapper
or a `useReducedMotion()` guard. Per CLAUDE.md constraints ("respects
`prefers-reduced-motion`"), this is a policy violation. Users who prefer reduced motion will
still see the scale/fade transition.

**Fix:** Wrap the component's animated output in `<MotionConfig>` or check `useReducedMotion`:

```tsx
import { AnimatePresence, MotionConfig, motion } from 'motion/react';

// Inside CopyEmailButton render:
<MotionConfig reducedMotion="user">
  <AnimatePresence mode="wait" initial={false}>
    {/* existing motion.span elements */}
  </AnimatePresence>
</MotionConfig>
```

Alternatively, import `useReducedMotion` and set `transition={{ duration: 0 }}` when true.

---

## Info

### IN-01: `now-preview.tsx` has comment block placed after imports (cosmetic)

**File:** `src/components/sections/now-preview.tsx:5-7`

**Issue:** The module-level comment describing the component (`// src/components/sections/now-preview.tsx — RSC ...`) appears after the import block rather than at the top of the file. This is inconsistent with the convention used in other files in this PR (e.g., `copy-email-button.tsx` line 3 places the comment at the top).

**Fix:** Move the block comment to line 1, before any imports.

---

### IN-02: Test 7 does not assert icon revert after timeout

**File:** `src/components/sections/copy-email-button.test.tsx:178-197`

**Issue:** Test 7 verifies the icon swap from `copy-icon` to `check-icon` after a successful
clipboard write, but does not verify that the icon reverts back to `copy-icon` after the 2-second
timeout. The revert path for the icon is implicitly covered by Test 6 (which checks text revert)
but since Test 7 is specifically about the icon swap it is incomplete. If a future change breaks
icon revert independently of text revert, no test will catch it.

**Fix:** Add a timeout assertion to Test 7, mirroring the pattern from Test 6:

```ts
// After asserting check-icon is present:
vi.useFakeTimers({ toFake: ['setTimeout'] });
await act(() => { vi.advanceTimersByTime(2001); });
expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
expect(screen.queryByTestId('check-icon')).toBeNull();
vi.useRealTimers();
```

---

_Reviewed: 2026-05-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
