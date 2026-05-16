---
phase: 01-cmd-k-command-palette
plan: 2
type: execute
wave: 2
depends_on: [1]
files_modified:
  - src/components/shared/command-palette.tsx
  - src/components/shared/command-palette.test.tsx
  - src/components/shared/index.ts
  - src/components/shared/header.tsx
  - src/components/shared/header.test.tsx
  - src/app/[locale]/layout.tsx
autonomous: false
requirements:
  - UX-01
  - UX-02
  - UX-03
  - UX-04
  - UX-05
  - UX-06
  - UX-07
tags:
  - palette
  - client-component
  - a11y
  - i18n
must_haves:
  truths:
    - "Pressing Cmd+K on macOS or Ctrl+K elsewhere from any page opens the command palette"
    - "Pressing Esc, clicking the backdrop, tapping the visible close button, or pressing Cmd+K again closes the palette"
    - "Arrow Up/Down navigates command items, Enter executes the selected command"
    - "Selecting a Navigate-to command (Hero/About/Projects/Skills/Career/Contact) scrolls to the corresponding section anchor on the homepage"
    - "Selecting the Blog command navigates to the locale-prefixed /blog route via the i18n router"
    - "Selecting the theme toggle command flips Jedi/Sith via setTheme() with the dialog closing before the swap (no ViewTransition)"
    - "Selecting a locale switch command invokes the existing switchLocale server action, causing cookie+redirect"
    - "Selecting a Resume PT/EN command opens the bilingual resume PDF in a new tab; LinkedIn/GitHub commands open profiles in a new tab"
    - "The header trigger button shows icon+⌘K on md+ and icon-only on mobile; tapping it opens the palette"
    - "Vitest tests cover open-via-keyboard, open-via-trigger, esc-dismiss, theme select, locale select, and nav select"
  artifacts:
    - path: "src/components/shared/command-palette.tsx"
      provides: "CommandPalette + CommandPaletteTrigger client components"
      min_lines: 80
      exports: ["CommandPalette", "CommandPaletteTrigger"]
    - path: "src/components/shared/command-palette.test.tsx"
      provides: "Vitest + RTL tests for palette behavior"
      contains: "describe("
    - path: "src/components/shared/index.ts"
      provides: "Barrel re-exports for CommandPalette + CommandPaletteTrigger"
      contains: "from './command-palette'"
    - path: "src/components/shared/header.tsx"
      provides: "Header with palette trigger between LocaleToggle and ThemeToggle"
      contains: "CommandPaletteTrigger"
    - path: "src/app/[locale]/layout.tsx"
      provides: "Layout that mounts CommandPalette inside NextIntlClientProvider"
      contains: "CommandPalette"
  key_links:
    - from: "src/components/shared/command-palette.tsx"
      to: "document keydown listener"
      via: "useEffect attaching e.key === 'k' && (e.metaKey || e.ctrlKey)"
      pattern: "addEventListener\\('keydown'"
    - from: "src/components/shared/command-palette.tsx"
      to: "src/components/shared/locale-toggle-action"
      via: "switchLocale server action import"
      pattern: "from '.*locale-toggle-action'"
    - from: "src/components/shared/command-palette.tsx"
      to: "src/lib/i18n/navigation"
      via: "locale-aware useRouter for Blog route"
      pattern: "from '@/lib/i18n/navigation'"
    - from: "src/components/shared/header.tsx"
      to: "src/components/shared/command-palette"
      via: "CommandPaletteTrigger import"
      pattern: "CommandPaletteTrigger"
    - from: "src/app/[locale]/layout.tsx"
      to: "src/components/shared/command-palette"
      via: "CommandPalette mounted inside NextIntlClientProvider"
      pattern: "CommandPalette"
---

<objective>
Build the Cmd+K command palette: a client component that owns open/close state, attaches a global keyboard listener, renders the Shadcn `CommandDialog` shell, exposes 14 commands across three groups (Navigate / Actions / Links), and ships a separate `CommandPaletteTrigger` button for the header. Wire the trigger into `header.tsx` and mount the palette in `app/[locale]/layout.tsx`. Add the new component to the curated `shared/index.ts` barrel. Cover the behavior with Vitest + RTL tests using the existing `src/test/render.tsx` helper.

Purpose: This is the user-facing payload of Phase 1 — satisfying all seven requirements (UX-01 through UX-07) in a single, focused plan now that Plan 1 has laid the i18n + Shadcn + scroll-target groundwork. The component must reuse existing patterns (`setTheme` reduced-motion branch from `theme-toggle.tsx`, `switchLocale` server action from `locale-toggle-action.ts`, locale-aware `useRouter` from `@/lib/i18n/navigation`) so the palette behaves identically to existing navigation/theme/locale UX paths.

Output: Working palette accessible from every page on the site via Cmd+K, Ctrl+K, or the header trigger button. Tests passing. Type-check clean. Biome clean. Visual + interaction verification by Luiz.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

@.planning/phases/01-cmd-k-command-palette/01-CONTEXT.md
@.planning/phases/01-cmd-k-command-palette/01-RESEARCH.md
@.planning/phases/01-cmd-k-command-palette/01-PATTERNS.md
@.planning/phases/01-cmd-k-command-palette/01-UI-SPEC.md
@.planning/phases/01-cmd-k-command-palette/01-P1-SUMMARY.md

@src/components/shared/theme-toggle.tsx
@src/components/shared/locale-toggle.tsx
@src/components/shared/locale-toggle-action.ts
@src/components/shared/header.tsx
@src/components/shared/index.ts
@src/app/[locale]/layout.tsx
@src/lib/i18n/navigation.ts
@src/data/contact.ts
@src/test/render.tsx
@src/components/shared/theme-toggle.test.tsx
@src/components/shared/locale-toggle.test.tsx

<interfaces>
<!-- Contracts and signatures the executor MUST respect — extracted from codebase. -->

From `src/components/shared/theme-toggle.tsx`:
- `const { resolvedTheme, setTheme } = useTheme();`
- `const isDark = resolvedTheme === 'dark';`
- The reduced-motion branch (lines 31-37) calls `setTheme(next)` directly with NO `startViewTransition` wrapping. **This is the EXACT code path the palette must reuse (D-04).** Do not import or call `document.startViewTransition`.

From `src/components/shared/locale-toggle-action.ts`:
- `export async function switchLocale(target: 'en' | 'pt'): Promise<void>` — Server Action with `'use server'`. Sets `NEXT_LOCALE` cookie + redirects to the path translated for `target`. Calling it from `onSelect` is valid in Next.js 16 client components (RESEARCH.md Pattern 4).

From `src/components/shared/locale-toggle.tsx`:
- `const current = useLocale();` reads active locale from `next-intl`.
- Existing pattern uses `formAction={switchLocale.bind(null, 'pt')}` inside a `<form>`. The palette uses the direct-call equivalent: `() => { setOpen(false); switchLocale('pt'); }` (RESEARCH.md §Pattern 4).

From `src/lib/i18n/navigation.ts`:
- `export const { Link, useRouter, usePathname, redirect } = createNavigation(routing);`
- `useRouter()` from this module auto-prefixes the active locale on `.push()` / `.replace()`. **Never import `useRouter` from `next/navigation` in palette code** — Biome's `noRestrictedImports` rule + locale-stripping behavior makes that incorrect.

From `src/data/contact.ts`:
- `resumePdf.en` = `/Luiz-Pansarini_Resume.pdf`
- `resumePdf.pt` = `/Luiz-Pansarini_Curriculo.pdf`
- `linkedin` = `https://linkedin.com/in/luizpansarini`
- `github` = `https://github.com/LuizHAP`
- Import as `import { contact } from '@/data/contact';` (or the precise named export shape used elsewhere in the repo — confirm by reading the file before adding the import).

From `src/components/ui/index.ts` (after Plan 1):
- Re-exports `Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut`. Import via `@/components/ui` for consistency with other shared components, OR via `@/components/ui/command` directly — match `theme-toggle.tsx`'s convention (`import { Button } from '@/components/ui';`).

From `src/components/shared/header.tsx` (current structure, lines 13-25):
- RSC — no `'use client'` directive, no `useState`. Header tag holds: brand `<Link>`, flex spacer, `<LocaleToggle />`, `<ThemeToggle />` in that order. The trigger must be inserted as a child between `<LocaleToggle />` and `<ThemeToggle />` per D-10. The trigger component itself must be a separate `'use client'` component since it owns the `onClick` that lifts open state.

From `src/app/[locale]/layout.tsx`:
- Tree (lines 55-68): `<NextIntlClientProvider>` → `<SkipToContent />` → `<Header />` → `<main>{children}</main>` → `<Footer />` → `<Toaster />` → `<EasterEgg />` (or similar singleton client component). Mount `<CommandPalette />` here as a sibling of `<Toaster />`, inside `NextIntlClientProvider`.

From `src/components/shared/index.ts` (current, alphabetical):
- `EasterEgg, Footer, Header, LocaleToggle, SkipToContent, ThemeProvider, ThemeToggle`. Insert `CommandPalette` and `CommandPaletteTrigger` alphabetically — both go between `EasterEgg` and `Footer`.

From `src/test/render.tsx`:
- `export function render(ui, options?: { locale?: 'en' | 'pt'; theme?: 'light' | 'dark' })` — wraps in `NextIntlClientProvider` (with the corresponding messages bundle) and `ThemeProvider`. Use this for every test in this plan.

Translation keys (already populated by Plan 1 in `messages/{en,pt}.json` under `commandPalette` namespace) — full list from UI-SPEC.md §Copywriting Contract:
- `title`, `description`, `placeholder`, `empty`, `triggerLabel`
- Groups: `groupNavigate`, `groupActions`, `groupLinks`
- Nav: `navHero`, `navAbout`, `navProjects`, `navSkills`, `navCareer`, `navContact`, `navBlog`
- Actions: `actionToggleTheme`, `actionSwitchPt`, `actionSwitchEn`
- Links: `linkResumePt`, `linkResumeEn`, `linkLinkedin`, `linkGithub`

Section anchor IDs (post-Plan-1):
- `#hero` (Plan 1 added), `#about`, `#projects`, `#skills`, `#career`, `#contact`
- `#personal-projects` and `#now` exist but are NOT in the D-03 spec — DO NOT add commands for them (out of scope this phase).
- Blog is a route, not an anchor: `useRouter().push('/blog')`.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement CommandPalette + CommandPaletteTrigger client components with full command set</name>
  <files>src/components/shared/command-palette.tsx, src/components/shared/command-palette.test.tsx, src/components/shared/index.ts</files>
  <read_first>
    - src/components/shared/theme-toggle.tsx (read in full: `useTheme` destructure, `isDark` derivation, and the reduced-motion branch at lines 31-37 — copy that exact `setTheme(next)` pattern. DO NOT use the `startViewTransition` branch.)
    - src/components/shared/locale-toggle.tsx (read in full: `useLocale()` usage, `switchLocale.bind` pattern; for the palette use the direct-call form per RESEARCH.md Pattern 4)
    - src/components/shared/locale-toggle-action.ts (server action signature: `switchLocale(target: 'en' | 'pt')`)
    - src/lib/i18n/navigation.ts (the locale-aware `useRouter` export — never import `useRouter` from `next/navigation`)
    - src/data/contact.ts (exact named export shape for `resumePdf`, `linkedin`, `github` — match the existing import style used in `contact.tsx`/`footer.tsx`)
    - src/components/ui/index.ts (post-Plan-1 — confirms Command/Dialog primitive exports available via barrel)
    - src/components/ui/command.tsx (post-Plan-1 — confirms `CommandDialog` prop surface, especially `title`, `description`, `showCloseButton`, `open`, `onOpenChange`)
    - src/components/shared/index.ts (curated barrel: alphabetical, one `export { X } from './x';` per line, no `export *`)
    - src/test/render.tsx (custom render wrapping NextIntlClientProvider + ThemeProvider; signature `(ui, { locale, theme })`)
    - src/components/shared/theme-toggle.test.tsx (test scaffolding analog: import shape, render-helper usage, userEvent setup)
    - src/components/shared/locale-toggle.test.tsx (canonical Server Action mocking pattern: `vi.mock('@/components/shared/locale-toggle-action', () => ({ switchLocale: vi.fn(async () => {}) }))`)
    - .planning/phases/01-cmd-k-command-palette/01-UI-SPEC.md §Component Specifications + §Interaction Contract + §Copywriting Contract (the canonical visual + interaction contract — every styling decision is sourced here)
    - .planning/phases/01-cmd-k-command-palette/01-PATTERNS.md §`src/components/shared/command-palette.tsx`
    - .planning/phases/01-cmd-k-command-palette/01-RESEARCH.md §Patterns 1-6 + §Common Pitfalls (especially P1 `e.preventDefault()`, P2 close-before-setTheme, P4 missing hero id, P6 locale-aware router)
  </read_first>
  <behavior>
    Behavior the tests must lock in (RED-first):
    - `Cmd+K` (Meta key) on the document opens the dialog (assert `screen.getByRole('dialog')` becomes present).
    - `Ctrl+K` on the document opens the dialog (assert same).
    - `Cmd+K` while open closes the dialog (toggle behavior).
    - The keydown listener calls `event.preventDefault()` (assert via a spy on the dispatched event's `preventDefault`).
    - The header trigger button has `aria-label` matching `t('commandPalette.triggerLabel')` and `onClick` opens the dialog.
    - On open, the dialog renders three group headings whose text matches `commandPalette.groupNavigate`, `commandPalette.groupActions`, `commandPalette.groupLinks`.
    - Every command item from the master list is rendered (14 items total: 7 nav + 3 actions + 4 links).
    - Selecting the theme command (a) closes the dialog before (b) calling `setTheme` (assert order via spies); `setTheme` is called with `'dark'` when `resolvedTheme === 'light'` and `'light'` when `resolvedTheme === 'dark'`.
    - Selecting "Switch to PT" calls the mocked `switchLocale` with argument `'pt'`; selecting "Switch to EN" calls it with `'en'`. Both locale commands are visible regardless of current locale (D-07).
    - Selecting "Blog" calls `useRouter().push('/blog')` (mock the `@/lib/i18n/navigation` `useRouter`).
    - Selecting a Navigate-to command (e.g. "About") calls `document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })` (spy on `Element.prototype.scrollIntoView`).
    - Selecting a Link command (Resume PT, Resume EN, LinkedIn, GitHub) calls `window.open(url, '_blank', 'noopener')` with the URLs from `src/data/contact.ts` (spy on `window.open`).
    - Pressing `Escape` while open closes the dialog (covered by Radix Dialog — assert by firing an Escape keydown).
    - The dialog has `showCloseButton={true}` (i.e. a close button with an accessible name is rendered).
  </behavior>
  <action>
    Create `src/components/shared/command-palette.tsx` as a single `'use client'` module exporting two named components:

    1. **`CommandPalette`** — The dialog shell + command list.
       - Imports: `'use client'` first line. Then React (`useEffect, useState`), `next-intl` (`useLocale, useTranslations`), `next-themes` (`useTheme`), `@/lib/i18n/navigation` (`useRouter`), `@/components/shared/locale-toggle-action` (`switchLocale`), `@/data/contact` (resume + social URLs — match the existing import shape used in the contact section), `@/components/ui` or `@/components/ui/command` (`CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator`), `lucide-react` icons (per UI-SPEC.md §Component Specifications Item 5: `Home, User, Code2, Layers, Briefcase, BookOpen, Mail, Sun, Moon, Languages, FileText, Linkedin, Github`).
       - Manage open/close state via a controlled prop pair `open: boolean; onOpenChange: (next: boolean) => void` — this lets `CommandPaletteRoot` (or the equivalent local wrapper) lift state so the header trigger can share it. Alternative: keep open state local and expose a small store/imperative ref. Recommended: lift state via the wrapper component pattern (RESEARCH.md §Pattern 6 Option A) — see "Wrapper component" bullet below.
       - Global keyboard listener: `useEffect` attaching `keydown` to `document`; if `e.key === 'k' && (e.metaKey || e.ctrlKey)`, call `e.preventDefault()` then `setOpen((prev) => !prev)`. Always remove the listener on cleanup. Use `e.key === 'k'` (lowercase) — Meta+Shift+K reports `'K'`, which we ignore.
       - Render `<CommandDialog open={open} onOpenChange={setOpen} title={t('title')} description={t('description')} showCloseButton={true}>` (titles and description are the next-intl strings, NOT inline literals). Per UI-SPEC: dialog gets `sm:max-w-[640px]`, `w-[calc(100%-32px)]` on mobile, `max-h-[min(480px,80svh)]`. Apply via `className` on `CommandDialog` if Shadcn's default does not already match — but the Shadcn template usually already sets `sm:max-w-[640px]` and `rounded-xl`, so prefer to NOT override unless verification shows otherwise.
       - Inside the dialog, render `<CommandInput placeholder={t('placeholder')} />` then `<CommandList>` containing `<CommandEmpty>{t('empty')}</CommandEmpty>` and three `<CommandGroup heading="...">` blocks separated by `<CommandSeparator />`. cmdk's built-in filter works against the command item label text by default — no `value` prop wiring required.
       - The 14 commands map to these `onSelect` handlers. Define a single helper `runCommand(action: () => void)` that calls `setOpen(false)` and then `requestAnimationFrame(() => action())` — this enforces the close-then-act sequence (D-05) so the theme swap does not flash through the dialog overlay, and keeps every command's behavior consistent. Apply `runCommand(...)` to every `onSelect` in every group.

       - **Navigate group** (heading = `t('groupNavigate')`). Items in order:
         1. `navHero` → `runCommand(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }))` (icon `Home`)
         2. `navAbout` → scroll to `#about` (icon `User`)
         3. `navProjects` → scroll to `#projects` (icon `Code2`)
         4. `navSkills` → scroll to `#skills` (icon `Layers`)
         5. `navCareer` → scroll to `#career` (icon `Briefcase`)
         6. `navBlog` → `runCommand(() => router.push('/blog'))` where `const router = useRouter()` from `@/lib/i18n/navigation` (icon `BookOpen`)
         7. `navContact` → scroll to `#contact` (icon `Mail`)

       - **Actions group** (heading = `t('groupActions')`). Items:
         1. `actionToggleTheme` → `runCommand(() => setTheme(isDark ? 'light' : 'dark'))`. Icon: `Sun` when `isDark`, `Moon` when light (UI-SPEC.md Item 5). Read `resolvedTheme` from `useTheme()` and derive `isDark = resolvedTheme === 'dark'` — same as `theme-toggle.tsx`. DO NOT call `document.startViewTransition` (D-04).
         2. `actionSwitchPt` → `runCommand(() => { switchLocale('pt'); })` (icon `Languages`). Always rendered regardless of `useLocale()` value (D-07).
         3. `actionSwitchEn` → `runCommand(() => { switchLocale('en'); })` (icon `Languages`). Always rendered regardless of current locale (D-07).

       - **Links group** (heading = `t('groupLinks')`). Items:
         1. `linkResumePt` → `runCommand(() => window.open(contact.resumePdf.pt, '_blank', 'noopener'))` (icon `FileText`)
         2. `linkResumeEn` → `runCommand(() => window.open(contact.resumePdf.en, '_blank', 'noopener'))` (icon `FileText`)
         3. `linkLinkedin` → `runCommand(() => window.open(contact.linkedin, '_blank', 'noopener'))` (icon `Linkedin`)
         4. `linkGithub` → `runCommand(() => window.open(contact.github, '_blank', 'noopener'))` (icon `Github`)

       - Use `noopener` (no `noreferrer` mandated, but if it's already the convention used by other social-link buttons in the repo, mirror their flags). Verify against `footer.tsx` / `contact.tsx` and align.
       - Each `<CommandItem>` carries the icon then the label text with `gap-2` between them per UI-SPEC.md §Component Specifications Item 5. The icon size is `h-4 w-4` and `text-muted-foreground` at rest (cmdk handles the selected-state tint via `[aria-selected=true]`).

    2. **`CommandPaletteTrigger`** — The header trigger button (D-08, D-09).
       - Same `'use client'` module. Props: `{ onOpen: () => void }`. Renders a Shadcn `Button` (`variant="ghost"`) with `aria-label={t('triggerLabel')}`, `onClick={onOpen}`, and `className="h-11 min-w-[44px] gap-1 px-2"` (44px touch target — UI-SPEC §Component Specifications Item 1). Inside: `<Search className="h-5 w-5" aria-hidden="true" />` from `lucide-react`, then `<span className="hidden md:inline text-xs text-muted-foreground">⌘K</span>`.
       - Use `Search` icon, not `Command` (UI-SPEC resolved this open question — universal recognition over programmer mental model).

    3. **Wrapper component** — In the same file, also export `CommandPaletteRoot` (a thin `'use client'` wrapper that holds the `useState` for `open` and renders `<CommandPaletteTrigger onOpen={() => setOpen(true)} />` alongside `<CommandPalette open={open} onOpenChange={setOpen} />`). This satisfies RESEARCH.md §Pattern 6 Option A. Header consumes `CommandPaletteTrigger` directly (via `header.tsx` Task 2), and `layout.tsx` consumes `CommandPalette` directly (via Task 2). **Alternative if simpler:** export just `CommandPalette` (which internally renders both trigger AND dialog when given a `slotTrigger` prop) — Claude's discretion as long as the header-trigger placement and global keyboard listener both work and tests pass.

    4. **Tests** — Create `src/components/shared/command-palette.test.tsx` covering all assertions in the `<behavior>` block. Use the standard test scaffolding from `theme-toggle.test.tsx` + `locale-toggle.test.tsx`:
       - `import { render, screen } from '@/test/render';`
       - `import userEvent from '@testing-library/user-event';`
       - `import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';`
       - Mock the Server Action: `vi.mock('@/components/shared/locale-toggle-action', () => ({ switchLocale: vi.fn(async () => {}) }));`
       - Mock the locale-aware router: `vi.mock('@/lib/i18n/navigation', async () => { const actual = await vi.importActual<typeof import('@/lib/i18n/navigation')>('@/lib/i18n/navigation'); return { ...actual, useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }) }; });` (or the simpler shape this repo already uses if such a mock exists in another test file).
       - Spy on `Element.prototype.scrollIntoView` (set to `vi.fn()` in `beforeEach`, restore in `afterEach`).
       - Spy on `window.open` similarly.
       - Render via `render(<CommandPaletteRoot />, { locale: 'en' })` for EN-locale assertions; add at least one PT-locale assertion to verify next-intl key resolution works for both bundles.
       - Use `userEvent.keyboard('{Meta>}k{/Meta}')` for Cmd+K and `userEvent.keyboard('{Control>}k{/Control}')` for Ctrl+K.
       - `screen.getByRole('dialog')` finds the Radix Dialog content (renders into `document.body` via portal — RTL searches the full body automatically).
       - Use `screen.getByRole('option', { name: /.../ })` or `screen.getByText(...)` to locate `CommandItem`s — cmdk renders items with `role="option"`.

    5. **Barrel** — Update `src/components/shared/index.ts` by adding the new exports alphabetically (between `EasterEgg` and `Footer`):
       - `export { CommandPalette, CommandPaletteTrigger } from './command-palette';`
       - If `CommandPaletteRoot` is also exported as a public symbol, include it in the same block.

    6. **Lint + type-check** — Run `pnpm exec biome check --write src/components/shared/command-palette.tsx src/components/shared/command-palette.test.tsx src/components/shared/index.ts` then `pnpm tsc --noEmit`.
  </action>
  <verify>
    <automated>pnpm vitest run src/components/shared/command-palette.test.tsx &amp;&amp; pnpm tsc --noEmit &amp;&amp; pnpm exec biome check src/components/shared/command-palette.tsx src/components/shared/command-palette.test.tsx src/components/shared/index.ts</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/shared/command-palette.tsx` exists; first non-blank line is `'use client';`
    - The file imports `useRouter` from `@/lib/i18n/navigation` AND does NOT import `useRouter` from `next/navigation` (grep: `grep -v '^//' src/components/shared/command-palette.tsx | grep -c "from 'next/navigation'"` returns 0)
    - The file contains an `addEventListener('keydown'` call (the global Cmd+K listener)
    - The file calls `e.preventDefault()` inside the keydown handler before toggling open state
    - The file does NOT contain `startViewTransition` (D-04 — palette never uses ViewTransition)
    - The file imports `switchLocale` from `'@/components/shared/locale-toggle-action'` (or the relative equivalent `'./locale-toggle-action'`)
    - The file imports resume + social URLs from `'@/data/contact'`
    - All 14 command items are rendered when the dialog is open (7 navigate + 3 actions + 4 links)
    - The header trigger button (whether exported as `CommandPaletteTrigger` or rendered inline by `CommandPaletteRoot`) has `className` containing `h-11 min-w-[44px]` AND uses the `Search` icon from `lucide-react`
    - `src/components/shared/index.ts` contains `export { CommandPalette` (and `CommandPaletteTrigger` if exported as a public symbol) `from './command-palette';` — single curated re-export block
    - `pnpm tsc --noEmit` exits 0
    - `pnpm exec biome check src/components/shared/command-palette.tsx src/components/shared/command-palette.test.tsx src/components/shared/index.ts` exits 0
    - `pnpm vitest run src/components/shared/command-palette.test.tsx` exits 0 and reports at least 10 passing test cases covering: Cmd+K opens, Ctrl+K opens, Cmd+K toggles closed, Esc closes, trigger button opens, theme command closes before setTheme, locale PT command calls switchLocale('pt'), locale EN command calls switchLocale('en'), Blog command calls router.push('/blog'), Navigate-to command calls scrollIntoView with `behavior: 'smooth'`, link commands call window.open with the contact data URLs and `'_blank', 'noopener'`
  </acceptance_criteria>
  <done>CommandPalette component file written, behavior-tested (RED→GREEN), barrel-exported, type-clean, biome-clean. Plan 2 Task 2 can now wire it into header + layout.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Wire CommandPaletteTrigger into header.tsx and mount CommandPalette in app/[locale]/layout.tsx</name>
  <files>src/components/shared/header.tsx, src/components/shared/header.test.tsx, src/app/[locale]/layout.tsx</files>
  <read_first>
    - src/components/shared/header.tsx (current RSC structure, lines 13-25 — brand, flex spacer, `<LocaleToggle />`, `<ThemeToggle />`)
    - src/components/shared/header.test.tsx (existing test scaffolding for header — extend it; do not regress existing assertions)
    - src/app/[locale]/layout.tsx (current tree, lines 55-68 — render order `<SkipToContent />`, `<Header />`, `<main>`, `<Footer />`, `<Toaster />`, plus any global singleton client components like `<EasterEgg />`)
    - src/components/shared/command-palette.tsx (from Task 1 — verify the exported symbols and decide which one Header consumes vs which one Layout consumes)
    - src/components/shared/index.ts (post-Task-1 — barrel re-exports including CommandPalette + CommandPaletteTrigger)
    - .planning/phases/01-cmd-k-command-palette/01-CONTEXT.md §"Header Trigger" D-10 (trigger position: `[LocaleToggle] [Trigger] [ThemeToggle]`)
    - .planning/phases/01-cmd-k-command-palette/01-PATTERNS.md §"src/components/shared/header.tsx" + §"src/app/[locale]/layout.tsx"
  </read_first>
  <behavior>
    Behavior tests must lock in:
    - Rendering `<Header />` shows the palette trigger button between `<LocaleToggle />` and `<ThemeToggle />` (assert via `screen.getByRole('button', { name: t('commandPalette.triggerLabel') })` and DOM order against the existing locale toggle and theme toggle buttons).
    - Clicking the trigger opens the dialog (assert `screen.getByRole('dialog')` becomes present after `userEvent.click`).
    - The header still renders the brand link, locale toggle, and theme toggle (regression — existing header tests stay green).
    - Layout: rendering the layout subtree includes the palette in the DOM (mount assertion — the global keyboard listener should be attachable).
  </behavior>
  <action>
    Two coordinated edits:

    1. **`src/components/shared/header.tsx`** —
       - Import the trigger from the barrel: add to the existing import block `import { CommandPaletteTrigger } from './command-palette';` (or via `@/components/shared` if the file already uses the package-style barrel). If wiring requires open-state lifting at the layout level instead, see "Alternative" below.
       - Insert `<CommandPaletteTrigger onOpen={...} />` (or just `<CommandPaletteTrigger />` if the component owns its own dispatch) between `<LocaleToggle />` and `<ThemeToggle />` per D-10. Final inline order: `<Link brand /> <div className="flex-1" /> <LocaleToggle /> <CommandPaletteTrigger ... /> <ThemeToggle />`.
       - **Open-state coordination**: Header is an RSC. The trigger and the palette (mounted in layout) need a shared open state. Two implementation paths:
         (a) **Lift state into `<CommandPaletteRoot />` mounted in layout**, and put a small `'use client'` shim in the header that imperatively opens the palette. Simplest realization: have `CommandPaletteRoot` register a singleton open-handler on a module-scoped ref (e.g. an `openPaletteRef.current?.()` pattern) that `CommandPaletteTrigger` calls. Equivalent: use a tiny zustand-free local store (`let openHandler: (() => void) | null = null; export function setOpenHandler(fn) { openHandler = fn; } export function openPalette() { openHandler?.(); }`) exported from `command-palette.tsx`. Header imports `<CommandPaletteTrigger />` (a `'use client'` component) which calls `openPalette()` on click.
         (b) **Render trigger AND palette together inside the header tree** as `<CommandPaletteRoot />` — but this requires the header to wrap a client component, which is fine because Next.js allows RSC parents to render client children. In this case `layout.tsx` does NOT need a separate `<CommandPalette />` mount, and the keyboard listener lives inside `CommandPaletteRoot`. This is the cleaner option for this repo's structure.
       - **Pick option (b) unless verification reveals a layout/portal issue.** Rationale: keeps the palette open-state and the trigger that opens it co-located in one client tree, avoids the module-scoped-singleton anti-pattern, and the Radix Dialog portal renders into `document.body` regardless of where the dialog mounts — so the palette overlay still covers the full viewport.
       - Update or write `src/components/shared/header.test.tsx` so it covers the trigger presence + dialog open-on-click without regressing existing assertions. The existing header test already uses the `render` helper from `src/test/render.tsx` — extend it.

    2. **`src/app/[locale]/layout.tsx`** —
       - If option (a) was chosen in Header: import `CommandPalette` from `@/components/shared` and render it as a sibling of `<Toaster />` (or wherever `<EasterEgg />` is rendered) inside `<NextIntlClientProvider>`. The mount location matters only for hook ordering — anywhere inside `NextIntlClientProvider` is correct.
       - If option (b) was chosen in Header: leave `layout.tsx` untouched EXCEPT verify that `<Header />` still renders inside `<NextIntlClientProvider>` (it currently does at line ~57). No new import required. **State this decision explicitly in the Task 2 SUMMARY.**

    3. **Lint + type-check** — Run biome + tsc as in Task 1.
  </action>
  <verify>
    <automated>pnpm vitest run src/components/shared/header.test.tsx src/components/shared/command-palette.test.tsx &amp;&amp; pnpm tsc --noEmit &amp;&amp; pnpm exec biome check src/components/shared/header.tsx src/app/[locale]/layout.tsx &amp;&amp; pnpm next build</automated>
  </verify>
  <acceptance_criteria>
    - `src/components/shared/header.tsx` imports `CommandPaletteTrigger` (or `CommandPaletteRoot`) from a relative `'./command-palette'` or package path `'@/components/shared'`
    - `src/components/shared/header.tsx` renders the trigger between `<LocaleToggle />` and `<ThemeToggle />` (regex/order check: in the JSX, `<LocaleToggle` appears before `<CommandPaletteTrigger` (or `<CommandPaletteRoot`) which appears before `<ThemeToggle`)
    - The trigger button renders with `aria-label` text matching the `commandPalette.triggerLabel` translation in the active locale
    - Clicking the trigger button opens a dialog (assert via header test using the `@/test/render` helper)
    - `pnpm vitest run src/components/shared/header.test.tsx` exits 0 and existing header assertions still pass
    - Either `src/app/[locale]/layout.tsx` contains `CommandPalette` (option a) OR the Task 2 SUMMARY documents that option (b) was chosen and no layout edit was needed
    - `pnpm tsc --noEmit` exits 0
    - `pnpm exec biome check src/components/shared/header.tsx src/app/[locale]/layout.tsx` exits 0
    - `pnpm next build` exits 0 (full production build succeeds — no SSR/RSC boundary errors)
  </acceptance_criteria>
  <done>Header shows the palette trigger in the prescribed position, the palette is mounted globally (via header tree or layout), the full production build passes, and all existing + new tests are green.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human verification — Cmd+K palette visual and interaction QA</name>
  <what-built>
    Cmd+K command palette accessible from any page on the site. Header trigger button between locale toggle and theme toggle. Three command groups (Navigate, Actions, Links). 14 total commands. Full keyboard accessibility + mobile dismiss via close button or backdrop tap. All wired into the existing i18n + theme stack.
  </what-built>
  <how-to-verify>
    Run `pnpm dev` and open `http://localhost:3000/en` (and after first round, `http://localhost:3000/pt`).

    **1. Keyboard shortcut (UX-01)**
    - Press **Cmd+K** (macOS) or **Ctrl+K** (Win/Linux). Palette opens centered on screen.
    - Press **Cmd+K** again. Palette toggles closed.
    - Open palette, press **Esc**. Palette closes; focus returns to whatever element had focus before opening.

    **2. Header trigger (UX-07 + UI-SPEC Item 1)**
    - On desktop (≥ md breakpoint, ~768px+), find the `[Search icon] ⌘K` button in the header between the PT/EN toggle and the theme toggle. Click it. Palette opens.
    - Resize to mobile (375px viewport — iPhone SE). The trigger collapses to icon-only (the ⌘K text hides). Tap it. Palette opens.
    - The trigger button is at least 44px tall and 44px wide (use DevTools box model to verify).

    **3. Navigate commands (UX-02)**
    - With palette open, select **Hero / Home** → page smooth-scrolls to the top hero section.
    - Reopen palette, select **About** → smooth-scrolls to About section.
    - Repeat for **Projects**, **Skills**, **Career**, **Contact**. Each command scrolls to the correct section.
    - Select **Blog**. The router navigates to `/en/blog` (or `/pt/blog` if testing the PT locale). The URL changes; the blog page loads. Palette closes during navigation.

    **4. Theme toggle command (UX-03, D-04, D-05)**
    - With palette open in light (Jedi) mode, select **Toggle theme**. Palette closes FIRST, then theme flips to Sith dark mode. No flash or flicker during the swap (the dialog overlay is gone before the theme applies). Repeat from dark→light. Verify the swap is instant (no radial reveal animation — that's reserved for the theme-toggle button itself, NOT the palette per D-04).

    **5. Locale switch commands (UX-04, D-06, D-07)**
    - In EN locale, open palette. Both "Switch to Portuguese" and "Switch to English" are visible (D-07). Select "Switch to Portuguese". Page reloads at `/pt/...`. UI strings (including palette strings) are now in PT.
    - In PT locale, open palette. Both locale commands still visible. Select "Switch to English". Page reloads at `/en/...`.
    - Verify the `NEXT_LOCALE` cookie is set in DevTools after each switch (DevTools → Application → Cookies).

    **6. Link commands (UX-05)**
    - Select **Resume — PT (PDF)**. New tab opens with `/Luiz-Pansarini_Curriculo.pdf`.
    - Select **Resume — EN (PDF)**. New tab opens with `/Luiz-Pansarini_Resume.pdf`.
    - Select **LinkedIn profile**. New tab opens to `https://linkedin.com/in/luizpansarini`.
    - Select **GitHub profile**. New tab opens to `https://github.com/LuizHAP`.
    - In each case the new tab has `rel="noopener"` semantics — confirm via DevTools → Inspect (or `window.opener` console probe in the new tab returns null).

    **7. Keyboard navigation (UX-06)**
    - Open palette. Press **Arrow Down** several times — selection moves through items in DOM order (across all three groups).
    - Press **Arrow Up** — selection moves back.
    - Type "the" in the search input — list filters live (cmdk built-in filter). Commands that don't match are hidden; "No results found." appears for nonsense queries.
    - Press **Enter** with a command selected — it executes (e.g. selecting "About" → scrolls to About).
    - Press **Tab** while palette is open — focus stays trapped inside the dialog (cycles between input and close button), never escapes to underlying page elements.

    **8. Mobile dismiss (UX-07)**
    - On mobile viewport (375px), open palette via the header trigger. Verify the **✕ close button** is visible top-right of the dialog. Tap it → palette closes.
    - Reopen palette. Tap the **backdrop** (area outside the dialog) → palette closes.

    **9. Bilingual copy review**
    - Open palette in **EN**: every group heading, item label, and the search placeholder + empty state read in natural English.
    - Switch to **PT**: every string reads in natural Portuguese. **Critically review the PT translations** — the researcher flagged them MEDIUM confidence (UI-SPEC §Copywriting Contract footnote, RESEARCH.md Assumption A1). Look especially at:
      - `"Painel de Comandos"` / `"Pesquise por um comando ou ação"` / `"Digite um comando ou pesquise..."` / `"Nenhum resultado encontrado."` / `"Abrir painel de comandos"`
      - `"Navegar para"` / `"Ações"` / `"Links"`
      - `"Início"` / `"Sobre"` / `"Projetos"` / `"Habilidades"` / `"Carreira"` / `"Contato"` / `"Blog"`
      - `"Alternar tema (Jedi / Sith)"` / `"Trocar para Português"` / `"Trocar para Inglês"`
      - `"Currículo — PT (PDF)"` / `"Resume — EN (PDF)"` / `"Perfil no LinkedIn"` / `"Perfil no GitHub"`
    - If any PT string reads unnaturally, note the corrected version when resuming so a follow-up edit can patch `messages/pt.json`.

    **10. Theme + locale combinations (a11y)**
    - Open the palette in all four combinations: en+light, en+dark, pt+light, pt+dark. Confirm:
      - The selected item highlight uses the Jedi blue (light) or Sith red (dark) accent.
      - The focus ring on the close button is visible (2px outline, 2px offset).
      - Group headings are readable against the popover background (no muddy contrast).
      - The dialog backdrop dims the page (`bg-black/80`) without obscuring the dialog itself.

    **11. Reduced motion**
    - In macOS System Settings → Accessibility → Display → Reduce motion (ON), or DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Open palette. The fade/zoom open animation is suppressed (dialog appears instantly). Selecting a Navigate-to command scrolls without smooth-scroll easing (snaps to position). Theme toggle still instant (D-04 already enforces no ViewTransition).

    **12. Production build sanity**
    - Stop the dev server. Run `pnpm next build` then `pnpm next start`. Repeat steps 1, 4, 5, 6 against the prod build to confirm no SSR/hydration mismatch.
  </how-to-verify>
  <resume-signal>
    Type **"approved"** if all 12 verification groups pass.
    If any PT string needs a correction, paste the corrected key+value pairs.
    If any interaction is broken, describe the specific step that failed and the actual vs expected behavior.
  </resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → Server Action (`switchLocale`) | Locale switch crosses the client→server boundary. Existing implementation in `locale-toggle-action.ts` already validates `target` against the `routing.locales` allowlist server-side. Palette reuses the same call; no new validation needed. |
| Browser → External hosts (LinkedIn, GitHub, resume PDFs) | Link commands use `window.open(url, '_blank', 'noopener')`. `noopener` prevents the opened tab from accessing `window.opener`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-P2-01 | Tampering | `switchLocale` server action invoked from palette | mitigate | Reuse existing implementation: server-side allowlist check against `routing.locales` (already present in `locale-toggle-action.ts`); same-origin referer validation already enforced server-side. Palette adds no new code path. |
| T-01-P2-02 | Tampering | Palette command labels rendered as `<CommandItem>` children | mitigate | All labels are static next-intl translation strings from `messages/{en,pt}.json` — no user-supplied content. next-intl escapes interpolated values by default; no `dangerouslySetInnerHTML` is used in the palette. |
| T-01-P2-03 | Information disclosure | External link commands opening Resume PDF / LinkedIn / GitHub in new tab | mitigate | Every `window.open` call uses `'noopener'` to prevent `window.opener` leakage. URLs are static constants in `src/data/contact.ts` — not user-controlled. |
| T-01-P2-04 | Denial of service | Global `keydown` listener on `document` | accept | Listener is a single event handler with O(1) work (key check + boolean toggle). Cleanup removes it on unmount. No way to weaponize a keyboard shortcut into a DoS surface in a single-user browser context. |
</threat_model>

<verification>
After all three tasks complete:
- `pnpm vitest run` exits 0 (all tests across all suites)
- `pnpm tsc --noEmit` exits 0
- `pnpm exec biome check src/` exits 0
- `pnpm next build` exits 0
- Human verification (Task 3) returns "approved" or returns specific actionable feedback that resolves in a follow-up patch
- Curl/manual sanity:
  - `curl -sI http://localhost:3000/en | grep -i 'content-type'` returns `text/html` (smoke check the dev server still serves the homepage)
- Coverage check: `pnpm vitest run --coverage --project=jsdom` reports `src/components/shared/command-palette.tsx` meeting the `COMPONENT_TARGET` thresholds (70% statements/functions, 60% branches) — Plan 1 already added the file to `COMPONENT_FILES`.
</verification>

<success_criteria>
All seven phase requirements satisfied:
- **UX-01** — Cmd+K / Ctrl+K opens palette from any page (covered by Task 1 keyboard listener, verified in Task 3 Step 1)
- **UX-02** — Palette has Navigate commands for Hero, About, Projects, Skills, Career, Blog, Contact (covered by Task 1 command list, verified in Task 3 Step 3)
- **UX-03** — Theme toggle command via direct `setTheme()` after dialog close (covered by Task 1 `runCommand` + D-04/D-05 enforcement, verified in Task 3 Step 4)
- **UX-04** — Locale switch commands invoke `switchLocale` server action (covered by Task 1 + Task 3 Step 5)
- **UX-05** — Quick links for Resume PT, Resume EN, LinkedIn, GitHub (covered by Task 1 + Task 3 Step 6)
- **UX-06** — Focus trap (Radix Dialog) + Esc dismiss + arrow nav + Enter executes (covered by Shadcn/cmdk primitives, verified in Task 3 Step 7)
- **UX-07** — Visible close button + backdrop tap dismiss on mobile (covered by `showCloseButton={true}`, verified in Task 3 Step 8)

Plus quality gates: tsc clean, biome clean, tests green, production build green, human visual + interaction sign-off.
</success_criteria>

<output>
After completion, create `.planning/phases/01-cmd-k-command-palette/01-P2-SUMMARY.md` documenting:
- Which open-state coordination option was chosen (a — module ref, or b — `CommandPaletteRoot` in header). Justify.
- Final list of icons used per command (in case any were swapped from UI-SPEC during implementation).
- Any PT translation corrections made post Task-3 verification.
- Any deviations from UI-SPEC styling (e.g. dialog width, max height) and why.
- Coverage numbers for `command-palette.tsx` from the final vitest run.
</output>
</content>
</invoke>