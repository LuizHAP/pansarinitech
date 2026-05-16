# Phase 1: Cmd+K Command Palette - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a keyboard-triggered (Cmd+K / Ctrl+K) command palette accessible from any page on the site. Users can execute navigation to homepage sections, toggle theme, switch locale, and open quick links — all without touching the mouse. A visible trigger button in the header provides the mobile entry point.

Deliverables:
1. Shadcn Command palette component (`src/components/shared/command-palette.tsx`) wired to global keyboard shortcut
2. Header trigger button (icon + ⌘K text on desktop, icon-only on mobile) added to `header.tsx`
3. Commands: Navigate-to sections (Hero, About, Projects, Skills, Blog, Contact), Toggle theme, Switch locale (PT / EN), Quick links (Resume PT, Resume EN, LinkedIn, GitHub)
4. Full keyboard accessibility: focus trap, Esc to close, arrow nav, Enter to execute, mobile dismiss via close button or backdrop tap

</domain>

<decisions>
## Implementation Decisions

### Palette Library

- **D-01:** Use **Shadcn Command + cmdk** — install via `npx shadcn@latest add command dialog`. Adds `<Command>`, `<CommandInput>`, `<CommandList>`, `<CommandItem>`, `<CommandGroup>`, `<CommandSeparator>` to `src/components/ui/`. Keyboard navigation, ARIA, and search filtering are built in.
- **D-02:** Include a **live search/filter input** (`<CommandInput>`) — cmdk's built-in filtering. With 12+ commands across groups, search makes the palette faster to use.
- **D-03:** **Group commands into labeled sections** using `<CommandGroup>`:
  - "Navigate to" → Hero, About, Projects, Skills, Blog, Contact
  - "Actions" → Toggle theme (Jedi/Sith), Switch to PT, Switch to EN
  - "Links" → Resume PT, Resume EN, LinkedIn, GitHub

### Theme Switch from Palette

- **D-04:** **Skip ViewTransition from palette** — call `setTheme()` directly (no `startViewTransition`). Same code path as the `prefers-reduced-motion` branch already in `theme-toggle.tsx`. Avoids the radial reveal originating from a wrong/missing coordinate.
- **D-05:** **Close palette first, then swap theme** — dismiss the dialog before calling `setTheme()` so the theme change applies to the full page without the palette overlay competing visually.

### Locale Switch from Palette

- **D-06:** **Reuse the existing `switchLocale` server action** from `src/components/shared/locale-toggle-action.ts`. Calling it from the palette triggers the same cookie-set + redirect flow as the header locale toggle — page reloads, palette closes naturally. Consistent with established behavior; no new locale-switching mechanism.
- **D-07:** **Always show both PT and EN locale commands** in the palette, regardless of the active locale. Simple and predictable; selecting the current locale is a no-op (redirect to same path, cookie re-applied).

### Header Trigger

- **D-08:** Add a **search/command icon button in the header** — opens the palette on click/tap. Required for mobile users (no Cmd key). Follows the GitHub/Linear/Vercel trigger pattern.
- **D-09:** On **desktop (md+) show icon + ⌘K text** beside the icon (or as a pill/badge); on **mobile show icon only**. Makes the shortcut discoverable on desktop without cluttering mobile.
- **D-10:** **Position between locale toggle and theme toggle**: `[Brand] [spacer] [PT/EN] [⌘K trigger] [ThemeToggle]`. Controls cluster on the right; theme toggle stays last.

### Claude's Discretion

- Component file: `src/components/shared/command-palette.tsx` — add to `src/components/shared/index.ts` barrel.
- Render the palette in `src/app/[locale]/layout.tsx` (has ThemeProvider + NextIntlClientProvider subtree).
- Keyboard listener: `useEffect` with `keydown` on `document` checking `e.key === 'k' && (e.metaKey || e.ctrlKey)`.
- Add `id="hero"` to the `<section>` in `hero.tsx` — currently only `id="hero-heading"` on the `<h1>`. Needed for palette navigation scroll target.
- Shadcn `command` component goes into `src/components/ui/` — add named exports to `src/components/ui/index.ts` barrel (per Phase 2 D-01/D-02 curated barrel convention).
- Palette animation (open/close): Claude's call — `motion` is available; Shadcn Dialog already has built-in fade; may delegate to Shadcn defaults + Tailwind transition classes.
- Icon choice for the header trigger: Claude's call — `Search` or `Command` from `lucide-react` (already installed).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/ROADMAP.md` §"Phase 1: Cmd+K Command Palette" — Goal, Success Criteria, requirements UX-01 through UX-07
- `.planning/REQUIREMENTS.md` — UX-01 through UX-07 full requirement text

### Theme toggle (reuse setTheme pattern)
- `src/components/shared/theme-toggle.tsx` — `setTheme()` call pattern; the `prefers-reduced-motion` branch (lines 31–37) is the exact code path the palette should reuse for instant theme swap

### Locale switch (reuse server action)
- `src/components/shared/locale-toggle-action.ts` — Server action `switchLocale(target)` to call from palette; sets cookie + redirects
- `src/components/shared/locale-toggle.tsx` — Reference for how `useLocale()` is used to read active locale

### Header (trigger placement)
- `src/components/shared/header.tsx` — Current header structure; add trigger between `<LocaleToggle />` and `<ThemeToggle />`

### Layout (palette render location)
- `src/app/[locale]/layout.tsx` — Render `<CommandPalette />` here; has ThemeProvider + NextIntlClientProvider

### Barrel exports (add new components here)
- `src/components/shared/index.ts` — Add `CommandPalette` export (Phase 2 D-01 curated barrel pattern)
- `src/components/ui/index.ts` — Add Shadcn Command component exports after `npx shadcn@latest add command dialog`

### Section anchor IDs (scroll targets)
- `src/components/sections/about.tsx` — `id="about"`
- `src/components/sections/career-timeline.tsx` — `id="career"`
- `src/components/sections/featured-projects-teaser.tsx` — `id="projects"`
- `src/components/sections/skills.tsx` — `id="skills"`
- `src/components/sections/contact.tsx` — `id="contact"`
- `src/components/sections/hero.tsx` — `id="hero-heading"` on `<h1>` (no `id="hero"` on `<section>` yet — must add)

### Phase 2 barrel convention (follow for new ui/ exports)
- `.planning/phases/02-code-quality-baseline-barrel-exports-index-ts-em-components-/02-CONTEXT.md` — D-01/D-02: curated barrel, `export { X } from './x'` only, no `export *`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ThemeToggle` (`src/components/shared/theme-toggle.tsx`) — `useTheme()` + `setTheme()` pattern; the reduced-motion branch is exactly what palette should call
- `LocaleToggle` + `switchLocale` — `useLocale()` for reading current locale, `switchLocale(target)` server action for switching
- `Button` from `@/components/ui` — for the header trigger button
- `motion@^12.38.0` — installed; available for palette animation if Shadcn Dialog defaults aren't enough
- `radix-ui@^1.4.3` — installed; Shadcn Command uses Dialog internally which uses Radix Dialog
- `lucide-react` — `Search` and `Command` icons available for the header trigger button
- `reveal-group.tsx` (`src/components/ui/reveal-group.tsx`) — existing scroll animation utility (not needed for palette but context for animation patterns)

### Established Patterns
- Client components have `'use client'` at top
- Server Actions in separate `.ts` files (e.g., `locale-toggle-action.ts`)
- Translations via `useTranslations('namespace')` from `next-intl`
- No existing keyboard shortcut listeners — palette will be the first
- 44px touch targets via `h-11` + `min-w-[44px]` (established in LocaleToggle — apply to header trigger too)
- Barrel exports: curated `export { X } from './x'` (established in Phase 2)
- Biome for import ordering (run `biome check --write src/` after adding new files)

### Integration Points
- `src/app/[locale]/layout.tsx` — render `<CommandPalette />` here (inside ThemeProvider + NextIntlClientProvider)
- `src/components/shared/header.tsx` — add trigger button between `<LocaleToggle />` and `<ThemeToggle />`
- `src/components/sections/hero.tsx` — add `id="hero"` to `<section>` element for scroll target
- `src/components/ui/index.ts` — add Command component exports after Shadcn install
- `src/components/shared/index.ts` — add `CommandPalette` export

</code_context>

<specifics>
## Specific Ideas

- Header layout after change: `[Brand] [flex-1 spacer] [PT/EN toggle] [⌘K trigger with icon + "⌘K" text on md+] [ThemeToggle]`
- Command groups match GitHub/Linear/Vercel pattern — user explicitly selected this reference
- Mobile dismiss: Shadcn Dialog already provides backdrop click to close; add an explicit ✕ close button inside the palette for discoverability on mobile (UX-07)
- "Blog" navigation command: the blog lives at `/{locale}/blog` — this is a route navigation, not a section scroll, since it's a separate page

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-cmd-k-command-palette*
*Context gathered: 2026-05-12*
