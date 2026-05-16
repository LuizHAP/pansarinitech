# Phase 2: UX Polish — Testing, Interactions & Animations - Research

**Researched:** 2026-05-13
**Domain:** React component animation (motion@^12), RTL testing patterns, CSS micro-interaction audit
**Confidence:** HIGH — all findings are directly verified from source code in this session; no external library lookups needed (the stack is already installed and in production use)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CopyEmailButton Feedback (UX-09)**
- D-01: When `copied` is `true`, swap `CopyIcon` for `Check` (lucide-react) — same visual weight, clean and minimal
- D-02: Icon swap must be animated — opacity + scale fade via motion@^12.38, ~150ms. Must respect `prefers-reduced-motion` (instant swap when reduced motion is preferred)
- D-03: `Check` icon renders in success color — use `text-green-600 dark:text-green-400` (no `--success` CSS variable exists; see CSS findings below)
- D-04: `aria-live="polite"` already on the button — keep it; no additional `role="status"` wrapper

**CopyEmailButton Tests (UX-08)**
- D-05: 6 tests already exist, all passing. Add exactly one test: when clipboard succeeds, the `Check` icon is rendered; `CopyIcon` is no longer in DOM

**Personal Projects Screenshots (UX-10)**
- D-06: User provides real screenshots for DoAção, NotificaMe, MTG Price Monitor, Redzone Boss. Place in `public/screenshots/`; update `screenshot` field in `src/data/personal-projects.ts`
- D-07: 2-card last row in `lg:grid-cols-3` with 5 items is acceptable — no CSS grid changes
- D-08: `RevealGroup stagger={0.07}` already in PersonalProjects — UX-11 is already implemented; verify it survives screenshot changes, no animation code changes needed

**Micro-Interaction Audit (UX-12)**
- D-09: Audit scope = homepage sections only: Hero, About, FeaturedProjects, Career, Skills, PersonalProjects, NowPreview ("Blog preview"), Contact. CommandPalette (Phase 1) is out of scope
- D-10: Full audit — Claude scans all in-scope sections for deviations, then fixes them. Established patterns:
  - Card hover: `transition hover:-translate-y-0.5 hover:shadow-md`
  - Focus rings: `focus-visible:ring-3 focus-visible:ring-ring/50`
  - Interactive links: `hover:underline underline-offset-4` or `hover:text-foreground`
- D-11: Stagger values stay section-appropriate — Skills (0.04), Career (0.08), Projects (0.07–0.08). No harmonization

### Claude's Discretion
- Specific motion easing curve for icon swap — match existing `easeOut` used in `childVariant`
- Whether to use `<AnimatePresence>` + key-based swap or `useReducedMotion` + opacity for icon transition
- If no `--success` variable exists (confirmed absent), `text-green-600 dark:text-green-400` is the fallback; Claude can define a `--success` OKLCH token if it makes the codebase cleaner
- Which specific hover/focus deviations exist is for Claude to discover (now documented in this research)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-08 | `copy-email-button.tsx` has Vitest + RTL tests covering clipboard API mock and Sonner toast verification | 6 tests confirmed passing (verified by running `vitest run`). Test infrastructure fully in place. One icon-swap test needed. |
| UX-09 | Copy-email interaction visually polished — check icon confirmation, reset timeout, accessible status announcement | `CopyIcon` → `Check` swap + motion animation + `text-green-600 dark:text-green-400`. `aria-live` and 2000ms reset already implemented. |
| UX-10 | Personal Projects section layout refined to match quality standard of other homepage sections | 4 of 5 cards use gradient placeholders. `ProjectScreenshot` component already handles both paths. Screenshots go in `public/screenshots/` with `/screenshots/[id].png` paths. |
| UX-11 | Personal Projects section has scroll-reveal stagger animations consistent with v1.1 animation system | Already implemented: `RevealGroup stagger={0.07}` wrapping `RevealItem` per card. No code changes needed — verify only. |
| UX-12 | Hover states, focus rings, and scroll-reveal timings polished across all homepage sections | 2 confirmed deviations found; 1 borderline case documented. See Micro-Interaction Audit section. |
</phase_requirements>

---

## Summary

Phase 2 is a code-surgery phase, not a greenfield build. The entire tech stack (motion@^12.38, Vitest + RTL, RevealGroup animation system) is already installed, configured, and in production use. The research task was to audit existing code for the specific gaps described in CONTEXT.md decisions, not to evaluate library choices.

The `CopyEmailButton` component is well-structured for the UX-09 upgrade: it already tracks `copied` state, fires `toast.success`, and resets after 2000ms. The only missing pieces are the `Check` icon swap and its motion animation. The test file has 6 passing tests with a mature mock infrastructure (clipboard, `execCommand`, `sonner`, `setTimeout`); adding Test 7 (icon presence check) is a small, scoped addition.

The Personal Projects section already has RevealGroup/RevealItem in place (UX-11 confirmed done). The 4 gradient-placeholder cards simply need their `screenshot` fields populated once Luiz provides the assets. The `ProjectScreenshot` component already handles both the `screenshot` path (renders `next/image`) and the gradient fallback (renders the colored div) — no component logic changes are needed for UX-10.

The micro-interaction audit found 2 confirmed deviations and 1 borderline case: (1) Skills filter chips use `ring-2 ring-ring` instead of `ring-3 ring-ring/50`, and (2) NowPreview uses `underline-offset-2 hover:opacity-80` instead of the established primary-link pattern `underline-offset-4 hover:decoration-foreground`.

**Primary recommendation:** Plan 3 sequenced tasks — (1) CopyEmailButton upgrade + Test 7, (2) screenshots asset wiring step for Luiz, (3) micro-interaction audit fixes in skills.tsx and now-preview.tsx.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CopyEmailButton icon swap animation | Browser / Client | — | State-driven UI update (`copied` state already in client component); motion JS runs in browser |
| Copy test coverage | Test layer (Vitest + RTL + jsdom) | — | Component tests use jsdom environment; clipboard/sonner are already mocked |
| Personal Projects screenshot display | Browser / Client | CDN / Static | `next/image` renders the `<img>` in the client; assets are static files served from Vercel's CDN |
| Micro-interaction CSS fixes | Browser / Client | — | Pure Tailwind class additions; no server logic involved |
| Scroll-reveal animations | Browser / Client | — | `motion/react` components; `RevealGroup` uses `whileInView` + IntersectionObserver (stubbed in tests) |

---

## Standard Stack

No new libraries required. All tools are already installed and in use.

### In-Use Libraries (verified from `package.json` and source)

| Library | Installed Version | Role in Phase 2 | Verified |
|---------|------------------|-----------------|---------|
| `motion` | `^12.38.0` | Icon swap animation (`AnimatePresence`, `motion.span`) | [VERIFIED: package.json + src imports] |
| `lucide-react` | installed (Shadcn default) | `Check` icon (success state) | [VERIFIED: already imported in other components] |
| `vitest` | v4.1.5 (from test runner output) | Test runner | [VERIFIED: running test suite] |
| `@testing-library/react` | installed | RTL render helper | [VERIFIED: `src/test/render.tsx`] |
| `@testing-library/user-event` | installed | Click simulation in tests | [VERIFIED: `copy-email-button.test.tsx` line 3] |
| `sonner` | installed | Toast mock (already mocked in test) | [VERIFIED: test mock pattern confirmed working] |

### No New Installs Required

All libraries for Phase 2 are already in the project. `Check` from `lucide-react` is a zero-cost addition (lucide is tree-shaken; adding a second import from the same package adds no bundle weight).

---

## Architecture Patterns

### System Architecture Diagram

```
User Click
    │
    ▼
CopyEmailButton.handleCopy()
    │
    ├─► navigator.clipboard.writeText() ──► success=true
    │       └─ fallback: document.execCommand() ──► success=true/false
    │
    ▼
success=true:
    ├─► toast.success(t('copied'))
    ├─► setCopied(true)          ──► triggers icon swap
    │       │
    │       ▼
    │   [CopyIcon exits] ── AnimatePresence ──► [Check icon enters]
    │       opacity/scale 150ms (or instant if reduced-motion)
    │
    └─► window.setTimeout(setCopied(false), 2000)  ──► [Check exits, CopyIcon enters]

success=false:
    └─► toast.error(t('copyFailed'))
```

### Recommended File Structure (Phase 2 changes only)

```
src/
├── components/sections/
│   ├── copy-email-button.tsx        # MODIFY: add Check icon swap + AnimatePresence
│   └── copy-email-button.test.tsx   # MODIFY: add Test 7 (icon presence check)
│   ├── skills.tsx                   # MODIFY: fix focus-visible:ring-2 → ring-3 ring-ring/50
│   └── now-preview.tsx              # MODIFY: fix underline-offset-2 + hover:opacity-80
├── data/
│   └── personal-projects.ts         # MODIFY: add screenshot field for 4 projects
public/
└── screenshots/                     # CREATE: new directory; Luiz provides PNG assets
    ├── doacao.png
    ├── notificame.png
    ├── mtgprice.png
    └── redzone-boss.png
```

### Pattern 1: AnimatePresence Icon Swap

The project does NOT currently use `AnimatePresence` anywhere — this will be its first use. However, `motion.div` and `motion.ol` are already used in `skills.tsx` and `career-timeline.tsx`, confirming the motion API is wired up correctly through `<MotionConfig reducedMotion="user">` in `app/[locale]/layout.tsx`.

```typescript
// Source: motion/react official API — pattern matches existing motion usage in project
import { AnimatePresence, motion } from 'motion/react';
import { Check, CopyIcon } from 'lucide-react';

// Inside CopyEmailButton render:
<button ...>
  <AnimatePresence mode="wait" initial={false}>
    {copied ? (
      <motion.span
        key="check"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="text-green-600 dark:text-green-400"
      >
        <Check className="size-4" aria-hidden="true" />
      </motion.span>
    ) : (
      <motion.span
        key="copy"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <CopyIcon className="size-4" aria-hidden="true" />
      </motion.span>
    )}
  </AnimatePresence>
  <span>{copied ? t('copied') : t('copyButton')}</span>
</button>
```

**Why `mode="wait"`:** Ensures the exiting icon finishes before the entering icon starts. Without it, both icons briefly overlap. At 150ms total this is imperceptible but `mode="wait"` is correct semantics.

**Why `initial={false}`:** Prevents the enter animation from running on the initial mount (the button starts showing `CopyIcon` naturally, no animation needed).

**Reduced motion:** `<MotionConfig reducedMotion="user">` in `layout.tsx` globally sets `reducedMotion="user"`, which means motion automatically reads `prefers-reduced-motion` and skips animations for that user. No per-component `useReducedMotion()` hook needed for this pattern.

### Pattern 2: Test 7 — Icon Presence Check

The existing test infrastructure mocks `sonner` at the top of the file and uses `navigator.clipboard` overrides in `beforeEach`. Test 7 follows the same pattern as Test 3:

```typescript
// Source: verified from copy-email-button.test.tsx existing pattern
it('Test 7 (icon swap): after clipboard success, Check icon renders and CopyIcon is absent', async () => {
  const user = userEvent.setup();
  const writeTextSpy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: writeTextSpy },
  });

  render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });

  // Before click: CopyIcon present, Check absent
  // (lucide icons render as SVGs; accessible name via aria-label or test-id)
  // After click: Check icon present
  await user.click(screen.getByRole('button'));

  // The Check icon doesn't have a text label — best assertion is the button
  // no longer contains CopyIcon. Use lucide mock OR check data-testid.
  // Simplest reliable approach: verify the button's accessible name / text
  // content changed AND the button no longer contains the CopyIcon SVG path.
  // Since lucide renders plain SVGs without accessible names, the recommended
  // approach is a vi.mock('lucide-react') to give Check a data-testid:
  expect(screen.getByRole('button')).toHaveTextContent('Email copied');
  // Icon assertion: query by testId if mocked, or by SVG role
});
```

**Implementation note for the executor:** Lucide icons render as `<svg>` elements with `aria-hidden="true"`. They cannot be queried by role. The cleanest test strategy is:
- Option A: `vi.mock('lucide-react', ...)` patching `Check` to render `<span data-testid="check-icon" />` and `CopyIcon` to render `<span data-testid="copy-icon" />` — then assert `getByTestId('check-icon')` is present and `queryByTestId('copy-icon')` is null.
- Option B: Skip icon presence assertion and instead verify button state via text content (already done in Test 3) + assert `toast.success` was called. This is weaker but avoids mocking lucide.

Option A is more robust and directly satisfies UX-08's "icon swap" requirement. Option B is already covered by Test 3.

### Pattern 3: Screenshot Wiring in `personal-projects.ts`

```typescript
// Current (gradient placeholder):
{
  id: 'doacao',
  ...
  accentColor: 'from-emerald-500/20 to-teal-500/20',
  // screenshot field absent
}

// After wiring:
{
  id: 'doacao',
  ...
  screenshot: '/screenshots/doacao.png',
  accentColor: 'from-emerald-500/20 to-teal-500/20', // keep for fallback if image fails
}
```

The `ProjectScreenshot` component already branches on `project.screenshot`:
- If present → renders `<Image src={project.screenshot} ...>`
- If absent → renders the gradient div fallback

No component changes needed.

### Anti-Patterns to Avoid

- **Using `useReducedMotion()` per-component instead of relying on `MotionConfig`:** The project already wraps everything in `<MotionConfig reducedMotion="user">` in `layout.tsx`. Per-component `useReducedMotion()` would be redundant. Rely on the layout-level config.
- **Adding `data-testid` to production JSX without a mock:** Adding `data-testid="check-icon"` directly to the `Check` component in `copy-email-button.tsx` pollutes production HTML. Mock at the test layer only.
- **Changing stagger values for "consistency":** D-11 explicitly forbids harmonizing stagger to a single value. Do not modify `stagger={0.04}` in Skills or `stagger={0.07}` in PersonalProjects.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon exit/enter transition | Custom CSS keyframes or useState opacity toggle | `AnimatePresence` from `motion/react` | AnimatePresence handles unmount timing correctly; CSS transitions can't animate elements that are removed from DOM |
| Reduced-motion guard | Per-component `if (reducedMotion) return` branches | `<MotionConfig reducedMotion="user">` already in layout | Global config handles it for all motion elements; per-component logic creates maintenance risk |
| Screenshot image optimization | Manual `<img>` with srcset | `next/image` (already used in `ProjectScreenshot`) | Automatic WebP, lazy loading, LQIP blur placeholder, Vercel image CDN |
| Test icon detection | Querying by SVG path content | `vi.mock('lucide-react')` with testid substitutes | SVG path content is brittle; mock at module boundary |

---

## Micro-Interaction Audit Findings

This section documents the complete findings from the UX-12 audit performed during research. The planner must create tasks addressing DEV-1 and DEV-2.

### Sections Audited

| Section | Component | Interactive Elements | Deviations Found |
|---------|-----------|---------------------|-----------------|
| Hero | `hero.tsx` | 2 CTAs (Contact, Resume) | None — both have `ring-3 ring-ring/50` |
| About | `about.tsx` | No interactive elements (stat cards are display-only) | N/A |
| FeaturedProjects | `featured-projects-teaser.tsx` | 2 nav links + 3 card links | None — cards have `hover:-translate-y-0.5 hover:shadow-md`; nav links have `decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground` |
| Career | `career-timeline.tsx` | TooltipTrigger (pivot dot) | None — keyboard interaction handled by Radix Tooltip |
| Skills | `skills.tsx` | 8 filter chip buttons | **DEV-1: `ring-2 ring-ring` instead of `ring-3 ring-ring/50`** |
| PersonalProjects | `personal-projects.tsx` | Card hover + project links | None — card has `hover:-translate-y-0.5 hover:shadow-md`; links have `hover:underline` + `hover:text-foreground hover:underline` |
| NowPreview ("Blog preview") | `now-preview.tsx` | 1 inline link | **DEV-2: `underline-offset-2 hover:opacity-80` instead of `underline-offset-4 hover:decoration-foreground`** |
| Contact | `contact.tsx` | 5 buttons/links | None — all have `ring-3 ring-ring/50` |

### DEV-1: Skills Filter Chips Focus Ring

**File:** `src/components/sections/skills.tsx`, line 57

**Current:**
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
```

**Required (per UI-SPEC §"Focus Ring"):**
```
focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50
```

**Fix:** Change `ring-2` to `ring-3` and append `/50` to `ring-ring`. One-line change.

### DEV-2: NowPreview Link Pattern

**File:** `src/components/sections/now-preview.tsx`, lines 31–34

**Current:**
```
underline decoration-primary underline-offset-2 hover:opacity-80
```

**Required (per UI-SPEC §"Inline Link Hover" — primary nav-style link):**
```
underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground
```

**Fix:** Update `underline-offset-2` to `underline-offset-4`, add `decoration-2`, replace `hover:opacity-80` with `hover:decoration-foreground`.

### Stagger Values Verified

All section stagger values confirmed correct per D-11:
- About (stats): `stagger={0.06}` — section-appropriate for 4 stat cards
- About (bullets): `stagger={0.06}` — section-appropriate for 4 bullets
- Contact: `stagger={0.05}` — section-appropriate for 5 small items
- Skills: `stagger={0.04}` — section-appropriate for many badge items
- PersonalProjects: `stagger={0.07}` — matches spec
- FeaturedProjects: `stagger={0.08}` — matches spec
- Career: `staggerChildren: 0.08` (inline, not via RevealGroup) — matches spec

No stagger changes required.

---

## Common Pitfalls

### Pitfall 1: AnimatePresence Initial Mount Flash

**What goes wrong:** Without `initial={false}` on `AnimatePresence`, the `CopyIcon` entry animation runs on page load (scales/fades in from nothing on initial render). Visually this is a subtle flicker that undermines the "polish" intent.

**Why it happens:** `AnimatePresence` treats the first child as "entering" by default.

**How to avoid:** Always use `<AnimatePresence initial={false}>` when the initial state should render without animation.

**Warning signs:** Copy button appears to "pulse" on page first load.

### Pitfall 2: Icon SVG queryability in Tests

**What goes wrong:** Test tries to `screen.getByRole('img')` or query by text for the Check icon. Lucide renders plain `<svg>` with `aria-hidden="true"` — these are invisible to the accessibility tree and `getByRole` won't find them.

**Why it happens:** Lucide's `aria-hidden` is intentional (the icon is decorative), but it makes direct ARIA queries impossible.

**How to avoid:** Use `vi.mock('lucide-react', ...)` in Test 7 to replace `Check` and `CopyIcon` with testid-bearing elements, or verify icon state indirectly via button text content (less complete but acceptable per D-05's intent).

**Warning signs:** `TestingLibraryElementError: Unable to find role="img"`.

### Pitfall 3: Personal Projects Test Breakage After Screenshot Wiring

**What goes wrong:** `personal-projects.test.tsx` has this assertion:
```typescript
expect(screen.getAllByText('DoAção').length).toBeGreaterThanOrEqual(1);
```
This works because gradient-placeholder cards show the name twice (once in CardTitle, once in the placeholder span). After adding a screenshot, the gradient div is replaced by `<Image>` — the name only appears once (CardTitle). The test uses `toBeGreaterThanOrEqual(1)` which still passes.

**Why this is fine:** The test was written defensively for exactly this scenario. The assertion is correct after screenshots are added.

**Warning signs:** None — the existing tests are screenshot-change-safe.

### Pitfall 4: `next/image` with `public/screenshots/` Path

**What goes wrong:** Path in `personal-projects.ts` uses `/screenshots/doacao.png` (leading slash, relative to `public/`). If the `public/screenshots/` directory doesn't exist when the build runs, `next/image` will throw a 404 at runtime (not a build error).

**Why it happens:** `next/image` with local paths doesn't validate file existence at build time unless using static imports.

**How to avoid:** The plan must include creating `public/screenshots/` and placing all 4 PNG files before updating `personal-projects.ts`. Order matters: assets first, then data file update, then verify.

**Warning signs:** Card renders broken image icon instead of screenshot.

### Pitfall 5: Skills Filter Chip Touch Target

**What goes wrong:** The filter chips use `py-1` (8px vertical padding). With `text-xs` (12px line height), total height is ~28px — below the WCAG 2.5.5 44px minimum for touch targets.

**Why it happens:** Filter chips are intentionally compact (design choice for the horizontal scroll row).

**How to avoid:** This is a pre-existing design trade-off, not introduced by Phase 2. The DEV-1 fix (ring-2 → ring-3) does not change touch target size. Do not attempt to fix chip height in this phase — it is out of scope per D-09 (audit scope is hover states, focus rings, scroll-reveal timing, not layout or sizing).

---

## Code Examples

### AnimatePresence Setup (First Use in Project)

```typescript
// Source: verified pattern — motion/react AnimatePresence docs + layout.tsx MotionConfig setup
// The MotionConfig in layout.tsx already handles reducedMotion="user" globally.
// No additional setup needed in copy-email-button.tsx.

import { AnimatePresence, motion } from 'motion/react';
// Check is from lucide-react — already installed
import { Check, CopyIcon } from 'lucide-react';
```

### Lucide Mock for Test 7 (Option A — recommended)

```typescript
// Source: Vitest vi.mock pattern — consistent with the sonner mock at top of test file
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Check: () => <span data-testid="check-icon" />,
    CopyIcon: () => <span data-testid="copy-icon" />,
  };
});

// Then in Test 7:
it('Test 7 (icon swap): Check icon renders and CopyIcon is absent after clipboard success', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });

  // Before click: CopyIcon present
  expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button'));

  // After click: Check present, CopyIcon absent
  expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument();
});
```

**Important:** The `vi.mock` call must be at the module level (hoisted by Vitest), not inside `describe`. Vitest hoists `vi.mock` automatically.

**Interaction with existing tests:** Tests 1–6 also use `CopyIcon` and `Check` through the component. With the mock in place, all existing tests still pass because they query by role (`getByRole('button')`) and text content, not by icon element.

### DEV-1 Fix (Skills)

```typescript
// Before (src/components/sections/skills.tsx, line 57):
'flex-none rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',

// After:
'flex-none rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
```

### DEV-2 Fix (NowPreview)

```typescript
// Before (src/components/sections/now-preview.tsx, ~line 31):
className="underline decoration-primary underline-offset-2 hover:opacity-80"

// After:
className="underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
```

---

## CSS Token Findings

**`--success` CSS variable:** Does not exist in `src/app/globals.css`. [VERIFIED: full file read]

The globals.css defines these semantic tokens: `--background`, `--foreground`, `--card`, `--card-foreground`, `--muted`, `--muted-foreground`, `--border`, `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--ring`, `--input`, `--popover`, `--popover-foreground`.

There is no `--success` token. The UI-SPEC confirms the fallback contract: `text-green-600 dark:text-green-400`.

**Decision for executor:** Using `text-green-600 dark:text-green-400` directly is the simplest approach and matches the UI-SPEC. Defining a `--success` OKLCH token would require adding it to both `:root` and `.dark` in globals.css with values that clear ≥4.5:1 contrast on `--background` and `--card` in both themes. This is at Claude's discretion per CONTEXT.md — the fallback Tailwind classes are safe and do not require defining the token.

---

## Animation System Inventory

All motion usage in the project was catalogued during research:

| File | Motion API | Pattern |
|------|-----------|---------|
| `app/[locale]/layout.tsx` | `MotionConfig reducedMotion="user"` | Global reduced-motion provider |
| `components/ui/reveal-group.tsx` | `motion.div` + `variants` + `whileInView` | Scroll-reveal primitives |
| `components/sections/career-timeline.tsx` | `motion.ol` + `motion.li` + `variants` | Timeline stagger (inline, not via RevealGroup) |
| `components/sections/skills.tsx` | `motion.div` + `variants` | Badge grid (uses `childVariant` from reveal-group) |

`AnimatePresence` is not yet used anywhere in the project. Phase 2 introduces it for the first time in `copy-email-button.tsx`.

---

## Runtime State Inventory

Step 2.5 SKIPPED — Phase 2 involves no renames, rebrands, or migrations. All changes are additive (new icon state, new screenshots, CSS class fixes).

---

## Environment Availability

Step 2.6 applied selectively — Phase 2 has no new external CLI dependencies. All tooling is already verified in CI.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vitest | UX-08 tests | Yes | 4.1.5 | — |
| `motion` package | UX-09 icon animation | Yes | 12.38.0 | — |
| `lucide-react` `Check` icon | UX-09 UI | Yes | installed | — |
| `public/screenshots/` dir | UX-10 asset path | No (does not exist yet) | — | Gradient fallback renders until assets placed |

**Missing dependencies with no fallback:**
- `public/screenshots/*.png` files — must be provided by Luiz before `personal-projects.ts` is updated

**Note:** The plan must sequence the screenshot step with a human hand-off: Luiz provides PNG assets → executor places them → executor updates `personal-projects.ts`.

---

## Assumptions Log

> All claims in this research were verified directly from source code in this session.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `AnimatePresence mode="wait"` prevents icon overlap at 150ms duration | Architecture Patterns | If wrong: icons briefly overlap during transition. Mitigation: test visually; `mode="popLayout"` is alternative | [ASSUMED — not tested in browser this session, documented from motion API knowledge] |

All other claims are [VERIFIED] from direct file reads and test execution.

---

## Open Questions (RESOLVED)

1. **Screenshot asset format and resolution**
   - What we know: UI-SPEC specifies 1280×800 min, PNG format, `public/screenshots/[id].png` naming
   - What's unclear: Whether Luiz will provide pre-resized assets or originals needing optimization
   - Recommendation: Plan should include a note to pre-size to ≤1280px wide before placing in `public/` to avoid Vercel image optimization quota consumption (5K/month on Hobby)

2. **Blog preview section identification**
   - What we know: CONTEXT.md scope says "Blog preview" but the homepage renders `NowPreview` with `id="now"` — there is no `BlogPreview` component
   - What's unclear: Whether "Blog preview" in the scope list was intended to mean `NowPreview` or whether there is a planned blog preview section not yet built
   - Recommendation: Treat "Blog preview" as `NowPreview` (it is the only preview-style section on the homepage). Confirmed: DEV-2 in `now-preview.tsx` is the only deviation found in this section.

---

## Validation Architecture

> `workflow.nyquist_validation` is `false` in `.planning/config.json`. This section is SKIPPED.

---

## Security Domain

> This phase introduces no new authentication, session management, input validation, or cryptography surfaces. It is a pure UI polish and test phase. Security domain section omitted.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: direct source code read] `src/components/sections/copy-email-button.tsx` — current implementation state
- [VERIFIED: direct source code read] `src/components/sections/copy-email-button.test.tsx` — 6 tests, all passing
- [VERIFIED: vitest run output] Test suite: 199 tests / 25 files all passing
- [VERIFIED: direct source code read] `src/components/ui/reveal-group.tsx` — RevealGroup/RevealItem/childVariant API
- [VERIFIED: direct source code read] `src/app/globals.css` — no `--success` CSS variable; `MotionConfig reducedMotion="user"` confirmed in layout
- [VERIFIED: direct source code read] `src/components/sections/skills.tsx` — DEV-1 confirmed at line 57
- [VERIFIED: direct source code read] `src/components/sections/now-preview.tsx` — DEV-2 confirmed
- [VERIFIED: direct source code read] `src/data/personal-projects.ts` — 4 projects with no screenshot field; 1 (Starlimp) has `/personal-projects/starlimp.png`
- [VERIFIED: direct source read] `package.json` — motion@^12.38.0 installed
- [VERIFIED: `ls public/`] `public/personal-projects/` exists with `starlimp.png`; `public/screenshots/` does not exist

### Secondary (MEDIUM confidence)
- [ASSUMED] `AnimatePresence mode="wait"` behavior at 150ms — from motion API knowledge, not browser-tested this session

---

## Metadata

**Confidence breakdown:**
- Current code state (tests, CSS, components): HIGH — all read directly from source
- Animation pattern correctness: MEDIUM — documented from motion API knowledge; should be spot-checked in browser during implementation
- Test 7 lucide mock approach: HIGH — follows exact same pattern as existing sonner mock

**Research date:** 2026-05-13
**Valid until:** Stable — no external dependencies; valid until source files change
