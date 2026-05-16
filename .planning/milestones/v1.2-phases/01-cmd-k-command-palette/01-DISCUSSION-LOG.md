# Phase 1: Cmd+K Command Palette - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 01-cmd-k-command-palette
**Areas discussed:** Palette library, Theme switch from palette, Locale switch behavior, Header trigger hint

---

## Palette Library

| Option | Description | Selected |
|--------|-------------|----------|
| Shadcn Command + cmdk | Install via `npx shadcn@latest add command dialog`. Accessible, filterable, idiomatic for Shadcn stack. | ✓ |
| Radix Dialog + custom listbox | Use already-installed radix-ui, build keyboard nav manually. More control, more code. | |
| You decide | Claude picks — likely Shadcn Command. | |

**User's choice:** Shadcn Command + cmdk

---

| Option | Description | Selected |
|--------|-------------|----------|
| Search/filter input | Type to filter commands — cmdk's built-in filtering. Useful with 10+ commands. | ✓ |
| Static grouped list | No search input — simpler, small enough to scan. | |
| You decide | Claude picks based on final command count. | |

**User's choice:** Search/filter input (live filtering enabled)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped sections | "Navigate to" / "Actions" / "Links" labeled groups. | ✓ |
| Flat list, no groups | Single list — simpler but harder to scan. | |

**User's choice:** Grouped sections

---

## Theme Switch from Palette

| Option | Description | Selected |
|--------|-------------|----------|
| Skip ViewTransition — instant swap | Call setTheme() directly; same as reduced-motion path. No wrong-origin artifact. | ✓ |
| ViewTransition from screen center | Set --vt-x/y to window.innerWidth/2 + window.innerHeight/2. Radial from center. | |
| You decide | Claude picks — likely instant swap. | |

**User's choice:** Skip ViewTransition — instant swap

---

| Option | Description | Selected |
|--------|-------------|----------|
| Close palette, then swap theme | Palette dismisses first, then setTheme() fires. Full-page change without overlay competing. | ✓ |
| Swap theme, keep palette open | Theme changes while palette stays open — user sees live change. | |

**User's choice:** Close palette first, then swap theme

---

## Locale Switch Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse server action — page reloads | Call existing switchLocale server action. Page reloads. Same as header toggle. Zero new code. | ✓ |
| Client-side router.replace() — no reload | Set cookie client-side + useRouter().replace(). No reload, graceful close. More code. | |
| You decide | Claude picks — likely server action reuse. | |

**User's choice:** Reuse server action — page reloads

---

| Option | Description | Selected |
|--------|-------------|----------|
| Always show both PT and EN commands | Both visible at all times. Simple and predictable. | ✓ |
| Only show the other locale | Cleaner — no pointless command. | |

**User's choice:** Always show both PT and EN commands

---

## Header Trigger Hint

| Option | Description | Selected |
|--------|-------------|----------|
| Search/command icon in header | Tappable on mobile, clickable on desktop. Follows GitHub/Linear/Vercel pattern. | ✓ |
| ⌘K text badge in header | Clickable chip/text element. More explicit. | |
| No header button — floating action button on mobile | FAB on mobile only. Desktop stays keyboard-only. | |

**User's choice:** Search/command icon in header

---

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + ⌘K text on desktop | md+ screens: icon + ⌘K badge. Mobile: icon only. | ✓ |
| Icon only, ⌘K in tooltip | Just the icon; hover shows tooltip. Cleaner but less discoverable. | |
| Icon only, no shortcut hint | Trigger button only. No shortcut hint. | |

**User's choice:** Icon + ⌘K text on desktop (md+), icon only on mobile

---

| Option | Description | Selected |
|--------|-------------|----------|
| Between locale toggle and theme toggle | [Brand] [spacer] [PT/EN] [⌘K] [ThemeToggle] | ✓ |
| Left of locale toggle | [Brand] [spacer] [⌘K] [PT/EN] [ThemeToggle] | |
| You decide | Claude picks for visual balance. | |

**User's choice:** Between locale toggle and theme toggle

---

## Claude's Discretion

- Component file location: `src/components/shared/command-palette.tsx`
- Render location: `src/app/[locale]/layout.tsx`
- Keyboard listener implementation: `useEffect` + `keydown` on `document`
- `id="hero"` addition to hero section element
- Animation approach for palette open/close
- Icon choice for header trigger (Search or Command from lucide-react)
- Shadcn Command exports added to `src/components/ui/index.ts` barrel

## Deferred Ideas

None — discussion stayed within phase scope.
