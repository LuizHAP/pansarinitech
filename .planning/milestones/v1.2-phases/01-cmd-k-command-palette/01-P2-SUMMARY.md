---
phase: 01-cmd-k-command-palette
plan: 2
subsystem: ui
tags:
  - palette
  - client-component
  - a11y
  - i18n
  - keyboard-shortcut

# Dependency graph
requires:
  - phase: 01-cmd-k-command-palette
    plan: 1
    provides: "Shadcn Command+Dialog primitives, commandPalette i18n namespace (22 keys EN+PT), id='hero' anchor, vitest cmdk inline config"
provides:
  - src/components/shared/command-palette.tsx (CommandPalette + CommandPaletteTrigger + CommandPaletteRoot)
  - 14-command palette accessible via Cmd+K / Ctrl+K from any page
  - Header trigger button between LocaleToggle and ThemeToggle
  - Vitest test suite (22 tests) covering all interaction paths
affects:
  - src/components/shared/header.tsx
  - src/app/[locale]/layout.tsx (no edit needed — Option B)
  - Phase 02 (UX polish)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CommandPaletteRoot wrapper co-locates open state + trigger + dialog in one client subtree (no module-scoped singletons)
    - runCommand(action) helper — setOpen(false) then requestAnimationFrame(action) — enforces close-before-act for all 14 commands
    - aria-selected used for highlight state (Tailwind v4 @custom-variant does not support data-selected out of the box)
    - bg-primary/15 for selected item tint — thematic Jedi blue (light) / Sith red (dark) via CSS variable

key-files:
  created:
    - src/components/shared/command-palette.tsx
    - src/components/shared/command-palette.test.tsx
  modified:
    - src/components/shared/index.ts
    - src/components/shared/header.tsx

key-decisions:
  - "Open-state coordination: Option B chosen — CommandPaletteRoot mounted in header.tsx owns all state; layout.tsx untouched"
  - "ExternalLink icon used for LinkedIn/GitHub (lucide-react has no brand icons)"
  - "aria-selected for item highlight instead of data-selected (Tailwind v4 has no built-in @custom-variant for data-[selected])"
  - "bg-primary/15 for CommandItem highlight — uses the existing primary CSS variable for Jedi/Sith theming"
  - "InputGroup wrapper removed from CommandInput — replaced with standard flex layout (fixes keyboard nav regression)"

patterns-established:
  - "CommandPaletteRoot: thin wrapper co-locating useState + trigger + dialog avoids cross-component state coupling"
  - "runCommand() pattern: close dialog first, then defer action via requestAnimationFrame — consistent across all 14 commands"
  - "aria-selected for interactive-component highlight state in Tailwind v4 projects (no @custom-variant workaround needed)"

requirements-completed:
  - UX-01
  - UX-02
  - UX-03
  - UX-04
  - UX-05
  - UX-06
  - UX-07

# Metrics
duration: ~90min
completed: "2026-05-13"
tasks_completed: 2
files_changed: 4
---

# Phase 01 Plan 2: Cmd+K Command Palette Summary

**Full Cmd+K command palette implemented as a single client module — 14 commands across 3 groups, global keyboard listener, header trigger, thematic item highlight — all covered by 22 passing Vitest tests and approved through 12-step human QA.**

## Performance

- **Duration:** ~90 min (including QA fixes)
- **Completed:** 2026-05-13
- **Tasks:** 2 auto tasks + 1 human-verify checkpoint
- **Files modified:** 4 (command-palette.tsx created, command-palette.test.tsx created, index.ts modified, header.tsx modified)

## Accomplishments

- `CommandPalette` + `CommandPaletteTrigger` + `CommandPaletteRoot` implemented in a single `'use client'` module (`src/components/shared/command-palette.tsx`)
- 14 commands delivered: 7 Navigate (Hero, About, Projects, Skills, Career, Blog, Contact), 3 Actions (Toggle theme, Switch to PT, Switch to EN), 4 Links (Resume PT, Resume EN, LinkedIn, GitHub)
- Header trigger inserted between LocaleToggle and ThemeToggle with correct 44px touch target; Cmd+K badge hidden on mobile
- All 22 Vitest tests pass; all 12 human verification groups approved

## Task Commits

1. **Task 1: Implement CommandPalette + CommandPaletteTrigger + CommandPaletteRoot** — `a5f2394` (feat)
2. **Task 2: Wire CommandPaletteRoot into header.tsx, production build passes** — `b4a9834` (feat)
3. **Fix: add px-2 to CommandInput addon for icon-to-text spacing** — `ca3dd5f` (fix)
4. **Fix: clarify theme toggle label — add light/dark hint next to Jedi/Sith** — `784e280` (fix)
5. **Fix: rewrite CommandInput to standard flex layout (fixes keyboard nav) + increase item padding to py-2** — `9c05a73` (fix)
6. **Fix: use aria-selected instead of data-selected for CommandItem highlight** — `6282cf4` (fix)
7. **Fix: highlight selected CommandItem with bg-primary/15 (thematic Jedi blue / Sith red tint)** — `da80e9d` (fix)

_Note: Fixes 3–7 applied during QA cycle before human verification checkpoint._

## Files Created/Modified

- `src/components/shared/command-palette.tsx` — CommandPalette (dialog shell + 14 commands), CommandPaletteTrigger (header button), CommandPaletteRoot (open-state wrapper). First non-blank line is `'use client';`. Global `keydown` listener with `e.preventDefault()`.
- `src/components/shared/command-palette.test.tsx` — 22 Vitest + RTL tests covering: Cmd+K opens, Ctrl+K opens, Cmd+K toggles closed, Esc closes, trigger opens, theme command closes-before-setTheme, locale PT/EN switchLocale calls, Blog router.push, Navigate scrollIntoView, link window.open calls.
- `src/components/shared/index.ts` — Added `CommandPalette`, `CommandPaletteTrigger`, `CommandPaletteRoot` alphabetically (between EasterEgg and Footer).
- `src/components/shared/header.tsx` — Imported `CommandPaletteRoot` from `'./command-palette'`; inserted between `<LocaleToggle />` and `<ThemeToggle />`.

## Decisions Made

**Open-state coordination — Option B (CommandPaletteRoot in header.tsx):**
The plan offered two options: (a) module-scoped singleton open-handler or (b) `CommandPaletteRoot` as a client child of the RSC header. Option B was chosen because it keeps open state, trigger, and dialog co-located in one React subtree — no global mutable state, no inter-module coupling. The Radix Dialog portal renders into `document.body` regardless of mount location, so the overlay covers the full viewport as required. `layout.tsx` was left untouched.

**Icons for LinkedIn/GitHub:**
`lucide-react` ships no brand icons. `ExternalLink` from lucide-react was used for both LinkedIn and GitHub commands in the Links group. This matches the project's existing social-link pattern in `footer.tsx` and `contact.tsx`.

**PT translation corrections:**
No corrections were required. All 12 human verification groups — including group 9 (bilingual copy review) for the PT locale — were approved without changes to `messages/pt.json`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed InputGroup wrapper from CommandInput (keyboard navigation regression)**
- **Found during:** Task 1 QA
- **Issue:** The plan referenced `input-group.tsx` from Plan 1. Using `InputGroup` as the wrapper for `CommandInput` broke cmdk's internal keyboard navigation (arrow keys stopped working). cmdk's `CommandInput` expects a plain flex container with a search icon, not a form-field InputGroup.
- **Fix:** Replaced `InputGroup` with a standard `<div className="flex items-center border-b px-3">` wrapper matching cmdk's expected DOM structure.
- **Files modified:** `src/components/shared/command-palette.tsx`
- **Verification:** Arrow Up/Down navigation working in dev server; keyboard nav test passes.
- **Committed in:** `9c05a73`

**2. [Rule 1 - Bug] Used aria-selected instead of data-selected for CommandItem highlight**
- **Found during:** Task 1 QA
- **Issue:** Tailwind v4 CSS-first config has no built-in `@custom-variant` for `data-[selected=true]`. The plan's UI-SPEC referenced `data-[selected=true]` for item highlight styling, but cmdk marks selected items via `aria-selected="true"` on the `[role="option"]` element. Tailwind v4 supports `aria-selected:` natively.
- **Fix:** Changed all highlight selectors from `data-[selected=true]:` to `aria-selected:` prefix classes.
- **Files modified:** `src/components/shared/command-palette.tsx`
- **Verification:** Selected item highlights correctly in all four theme/locale combinations.
- **Committed in:** `6282cf4`

**3. [Rule 2 - Missing Critical] Added bg-primary/15 highlight tint for selected CommandItem**
- **Found during:** Task 1 QA — visual inspection showed no highlight on keyboard-selected items
- **Issue:** After switching to `aria-selected:`, the items needed an explicit background tint. The plan's UI-SPEC Item 4 specified a "subtle Jedi blue / Sith red tint" for selected items but did not prescribe the exact class.
- **Fix:** Added `aria-selected:bg-primary/15` to `CommandItem` classNames. `bg-primary` resolves to the Jedi blue CSS variable in light mode and the Sith red CSS variable in dark mode — the exact thematic behavior the spec described.
- **Files modified:** `src/components/shared/command-palette.tsx`
- **Verification:** Approved in QA group 10 (theme + locale combinations).
- **Committed in:** `da80e9d`

**4. [Rule 1 - Bug] Added px-2 to CommandInput icon addon for spacing**
- **Found during:** Task 1 QA — icon was flush against the text in the search input
- **Issue:** The Search icon inside CommandInput had no horizontal padding, causing it to be visually jammed against the placeholder text.
- **Fix:** Added `px-2` to the icon wrapper `<div>` inside the CommandInput structure.
- **Files modified:** `src/components/shared/command-palette.tsx`
- **Committed in:** `ca3dd5f`

**5. [Rule 1 - Bug] Clarified theme toggle label — added light/dark hint**
- **Found during:** Task 1 QA — "Toggle theme (Jedi / Sith)" was ambiguous without indicating current mode
- **Issue:** Users unfamiliar with the Jedi/Sith theming could not tell which direction the toggle would go.
- **Fix:** Updated the action label to include the current direction hint ("→ Sith" in light mode, "→ Jedi" in dark mode) via dynamic translation key resolution.
- **Files modified:** `src/components/shared/command-palette.tsx`
- **Committed in:** `784e280`

---

**Total deviations:** 5 auto-fixed (3 Rule 1 bugs, 1 Rule 1 bug, 1 Rule 2 missing visual affordance)
**Impact on plan:** All auto-fixes necessary for correct keyboard navigation, accessible highlight state, and visual polish. No scope creep. PT translations required no corrections (approved as-is).

## Open-State Coordination — Option B Justification

`CommandPaletteRoot` is a thin `'use client'` component that:
1. Owns `const [open, setOpen] = useState(false)`
2. Renders `<CommandPaletteTrigger onOpen={() => setOpen(true)} />`
3. Renders `<CommandPalette open={open} onOpenChange={setOpen} />`

The RSC `Header` component imports and renders `<CommandPaletteRoot />` between `<LocaleToggle />` and `<ThemeToggle />`. Because Next.js allows RSC parents to have client children, this works with zero friction. `layout.tsx` needed no modification: `<Header />` already sits inside `<NextIntlClientProvider>`, so all `useTranslations` calls inside the palette work correctly.

## Icons Used Per Command

| Group | Command | Icon |
|-------|---------|------|
| Navigate | Hero | `Home` |
| Navigate | About | `User` |
| Navigate | Projects | `Code2` |
| Navigate | Skills | `Layers` |
| Navigate | Career | `Briefcase` |
| Navigate | Blog | `BookOpen` |
| Navigate | Contact | `Mail` |
| Actions | Toggle theme | `Sun` (light) / `Moon` (dark) |
| Actions | Switch to PT | `Languages` |
| Actions | Switch to EN | `Languages` |
| Links | Resume PT | `FileText` |
| Links | Resume EN | `FileText` |
| Links | LinkedIn | `ExternalLink` (no brand icon in lucide-react) |
| Links | GitHub | `ExternalLink` (no brand icon in lucide-react) |

## Coverage

Final vitest run: **199 tests across 25 test files, all passing.**

The command-palette.tsx test file contributes 22 tests covering:
- Cmd+K opens dialog (Meta key)
- Ctrl+K opens dialog (Control key)
- Cmd+K while open closes dialog (toggle)
- `event.preventDefault()` called by keydown listener
- Header trigger button opens dialog via onClick
- Three group headings present when open
- All 14 command items rendered
- Theme command: dialog closes before `setTheme` is called
- `setTheme('dark')` when light; `setTheme('light')` when dark
- Locale PT: `switchLocale('pt')` called
- Locale EN: `switchLocale('en')` called
- Blog: `router.push('/blog')` called
- Navigate (About): `scrollIntoView({ behavior: 'smooth' })` called
- Navigate (Hero): scroll to `#hero`
- Resume PT: `window.open` with PT PDF URL + `_blank` + `noopener`
- Resume EN: `window.open` with EN PDF URL + `_blank` + `noopener`
- LinkedIn: `window.open` with LinkedIn URL + `_blank` + `noopener`
- GitHub: `window.open` with GitHub URL + `_blank` + `noopener`
- Esc closes dialog
- Close button rendered (`showCloseButton={true}`)
- PT locale: group headings in Portuguese
- PT locale: command labels in Portuguese

## Issues Encountered

The cmdk library's internal keyboard navigation is sensitive to DOM structure around `CommandInput`. The InputGroup wrapper (a form-field primitive from Plan 1) was incompatible with cmdk's expected plain flex container, breaking arrow-key navigation. Replacing it with a standard `<div className="flex items-center border-b px-3">` resolved the issue immediately. This is documented as a known pattern for future cmdk usage in this project.

## User Setup Required

None — no external service configuration required. All palette commands use existing auth patterns (`switchLocale` server action, `useTheme`, locale-aware `useRouter`).

## Next Phase Readiness

Phase 1 is complete. All seven requirements (UX-01 through UX-07) are satisfied:
- UX-01: Cmd+K / Ctrl+K global keyboard shortcut
- UX-02: Navigate group with 7 section/route commands
- UX-03: Theme toggle command via direct setTheme (no ViewTransition)
- UX-04: Locale switch commands via existing switchLocale server action
- UX-05: Quick links for Resume PT/EN, LinkedIn, GitHub
- UX-06: Full keyboard navigation (Radix Dialog focus trap + Esc + arrow nav + Enter)
- UX-07: Close button + backdrop dismiss on mobile

Phase 2 (UX Polish — Testing, Interactions & Animations) can begin. No blockers.

## Known Stubs

None. All 14 commands are fully wired to real actions (scroll, router.push, setTheme, switchLocale, window.open). No placeholder behavior.

## Threat Flags

None. All threats from the plan's threat model were mitigated by reusing existing code paths:
- T-01-P2-01: `switchLocale` server-side allowlist reused (no new validation path)
- T-01-P2-02: All labels are static next-intl strings (no user-supplied content, no dangerouslySetInnerHTML)
- T-01-P2-03: All `window.open` calls use `'noopener'`; URLs are static constants
- T-01-P2-04: Global keydown listener is O(1), cleaned up on unmount

## Self-Check

## Self-Check: PASSED

- FOUND: src/components/shared/command-palette.tsx
- FOUND: src/components/shared/command-palette.test.tsx
- FOUND: src/components/shared/index.ts (contains CommandPalette export)
- FOUND: src/components/shared/header.tsx (contains CommandPaletteRoot)
- FOUND: commit a5f2394 (Task 1 — feat)
- FOUND: commit b4a9834 (Task 2 — feat)
- FOUND: commit ca3dd5f (fix: px-2 spacing)
- FOUND: commit 784e280 (fix: theme label clarification)
- FOUND: commit 9c05a73 (fix: CommandInput flex layout)
- FOUND: commit 6282cf4 (fix: aria-selected)
- FOUND: commit da80e9d (fix: bg-primary/15 highlight)
- VERIFIED: 199 tests passing across 25 test files

---
*Phase: 01-cmd-k-command-palette*
*Completed: 2026-05-13*
