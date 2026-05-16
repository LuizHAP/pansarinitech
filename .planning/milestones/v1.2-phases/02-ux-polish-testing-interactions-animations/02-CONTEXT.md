# Phase 2: UX Polish — Testing, Interactions & Animations - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual polish and test coverage for three scoped areas — copy-email interaction, Personal Projects section quality, and cross-section micro-interaction consistency. No new features or routes.

Deliverables:
1. `CopyEmailButton` visual feedback upgrade: `Check` icon replaces `CopyIcon` when copied, animated with motion, success-colored — plus an updated test covering the icon swap
2. Real screenshots for the 4 Personal Projects that currently use gradient placeholders (Luiz provides assets; planner adds a step for wiring them in)
3. Full audit + fix pass across all homepage page sections for hover states, focus rings, and scroll-reveal timing deviations
4. UX-08 resolved: existing 6 tests verified passing + 1 new icon-swap test added

</domain>

<decisions>
## Implementation Decisions

### CopyEmailButton Feedback (UX-09)

- **D-01:** When `copied` is `true`, swap `CopyIcon` for `Check` (simple checkmark from `lucide-react`) — same visual weight, clean and minimal.
- **D-02:** Icon swap must be **animated** — opacity + scale fade via `motion@^12.38`, ~150ms. Must respect `prefers-reduced-motion` (instant swap when reduced motion is preferred).
- **D-03:** The `Check` icon should render in a **success color (green-ish)** — use a green that works in both Jedi (light) and Sith (dark) themes. Implementation detail: `text-green-600 dark:text-green-400` is a safe fallback if no `--success` CSS variable is in `globals.css`; Claude should check first and use the project token if it exists.
- **D-04:** `aria-live="polite"` already on the button element — keep it. No additional `role="status"` wrapper needed.

### CopyEmailButton Tests (UX-08)

- **D-05:** 6 tests already exist in `copy-email-button.test.tsx` covering all clipboard/toast paths. After implementing D-01–D-03, **add one test**: when clipboard succeeds, the button renders the `Check` icon (verify via `lucide-react` mock or accessible name/role check). No other test changes required.

### Personal Projects Screenshots (UX-10)

- **D-06:** User will provide real screenshots for the 4 projects currently using gradient placeholders (DoAção, NotificaMe, MTG Price Monitor, Redzone Boss). The planner must include a step for placing screenshots in `public/screenshots/` and updating `src/data/personal-projects.ts` entries (`screenshot` field). Starlimp already has a screenshot and is untouched.
- **D-07:** The 2-card last row in the 3-column grid (`lg:grid-cols-3` with 5 projects) is **acceptable** — no CSS grid changes needed.
- **D-08:** `RevealGroup stagger={0.07}` is already in place for PersonalProjects — **UX-11 is already implemented**. Verify it still works after any screenshot changes; no animation code changes needed.

### Micro-Interaction Audit (UX-12)

- **D-09:** Audit scope = **homepage page sections only**: Hero, About, FeaturedProjects, Career, Skills, PersonalProjects, Blog preview, Contact. The CommandPalette (Phase 1) is explicitly out of scope.
- **D-10:** Full audit: Claude scans all in-scope sections for deviations from the established patterns below, then fixes any deviations found:
  - Card hover: `transition hover:-translate-y-0.5 hover:shadow-md` (established in FeaturedProjects + PersonalProjects)
  - Focus rings: `focus-visible:ring-3 focus-visible:ring-ring/50` (established in CopyEmailButton + other interactive elements)
  - Interactive links: `hover:underline underline-offset-4` or `hover:text-foreground` patterns (established in FeaturedProjects and Contact)
- **D-11:** Stagger values stay **section-appropriate** — Skills (`0.04`), Career (`0.08`), Projects (`0.07–0.08`). No harmonization to a single value.

### Claude's Discretion

- Specific motion easing curve for the icon swap (D-02) — match existing motion patterns in the project
- Whether to use `<AnimatePresence>` + key-based swap or a `useReducedMotion` + `opacity` approach for the icon transition — Claude's call, whichever is cleaner
- If no `--success` CSS variable exists, `text-green-600 dark:text-green-400` is the fallback; Claude can define a token if it makes the codebase cleaner
- Which specific hover/focus deviations exist in the in-scope sections is for Claude to discover during the audit (D-10)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/ROADMAP.md` §"Phase 2: UX Polish — Testing, Interactions & Animations" — Goal, Success Criteria, requirements UX-08 through UX-12
- `.planning/REQUIREMENTS.md` — UX-08 through UX-12 full requirement text

### Copy-email component (primary UX-08/UX-09 target)
- `src/components/sections/copy-email-button.tsx` — Component to modify for check-icon feedback
- `src/components/sections/copy-email-button.test.tsx` — Existing tests (6 tests passing); add icon-swap test here

### Personal Projects (UX-10/UX-11 target)
- `src/components/sections/personal-projects.tsx` — Component with gradient placeholders to upgrade
- `src/data/personal-projects.ts` — Data file with `screenshot` field to populate for 4 projects

### Animation system (reference for UX-11/UX-12)
- `src/components/ui/reveal-group.tsx` — RevealGroup, RevealItem, childVariant exports; the canonical scroll-reveal utility
- `src/components/sections/featured-projects-teaser.tsx` — Reference section for established card hover + stagger pattern (`stagger={0.08}`, `hover:-translate-y-0.5 hover:shadow-md`)

### Focus ring + interaction pattern
- `src/components/sections/contact.tsx` — Established `focus-visible:ring-3 focus-visible:ring-ring/50` pattern and link hover patterns

### Theme / motion library
- `src/app/globals.css` — CSS variables; check for existing `--success` token before inventing one
- Phase 1 CONTEXT.md decision D-04: `motion@^12.38` is installed; `useReducedMotion` pattern already used in theme-toggle

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CopyIcon`, `Check` — both in `lucide-react` (already installed); `Check` is the chosen success icon
- `motion@^12.38` — installed; use `AnimatePresence` + `motion.span` or `useReducedMotion` hook for icon transition
- `RevealGroup` + `RevealItem` from `@/components/ui` — animation system already used in PersonalProjects and FeaturedProjects
- `toast.success` / `toast.error` from `sonner` — already wired in copy-email-button; no changes needed

### Established Patterns
- Card hover: `transition hover:-translate-y-0.5 hover:shadow-md` (FeaturedProjects + PersonalProjects)
- Focus rings: `focus-visible:ring-3 focus-visible:ring-ring/50` (CopyEmailButton)
- Section structure: `mx-auto max-w-5xl px-4 py-12` (FeaturedProjects, PersonalProjects, Skills)
- Heading: `text-2xl font-semibold tracking-tight` — consistent across all sections
- Stagger values: `0.04` (Skills — many items), `0.07` (PersonalProjects), `0.08` (FeaturedProjects, Career)
- Client components have `'use client'` at top; server actions in separate `.ts` files

### Integration Points
- `src/components/sections/copy-email-button.tsx` — icon swap + motion animation added here
- `src/components/sections/copy-email-button.test.tsx` — one additional test case added here
- `src/data/personal-projects.ts` — `screenshot` field populated for 4 projects
- `public/screenshots/` — new directory for project screenshot assets (Luiz provides)
- All in-scope homepage sections — audit pass with targeted CSS fixes

</code_context>

<specifics>
## Specific Ideas

- Icon transition: when `copied` flips to `true`, the `CopyIcon` exits and `Check` enters with a quick opacity + scale (e.g., `initial={{ opacity: 0, scale: 0.6 }}`, `animate={{ opacity: 1, scale: 1 }}`, `exit={{ opacity: 0, scale: 0.6 }}`, `transition={{ duration: 0.15 }}`). Under `prefers-reduced-motion`: skip the animation, just swap.
- Screenshots naming convention for Personal Projects: `public/screenshots/[project-id].png` (kebab-case matching the project `id` in `personal-projects.ts`).
- UX-12 audit baseline: compare each section's interactive elements against FeaturedProjects (`hover:-translate-y-0.5 hover:shadow-md` for cards, `hover:decoration-foreground` for links) and CopyEmailButton (`focus-visible:ring-3 focus-visible:ring-ring/50` for buttons).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-ux-polish-testing-interactions-animations*
*Context gathered: 2026-05-13*
