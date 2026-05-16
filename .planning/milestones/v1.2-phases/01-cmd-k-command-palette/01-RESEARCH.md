# Phase 1: Cmd+K Command Palette - Research

**Researched:** 2026-05-12
**Domain:** Shadcn Command / cmdk / keyboard palette in Next.js 16 App Router
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use Shadcn Command + cmdk — install via `npx shadcn@latest add command dialog`. Adds `<Command>`, `<CommandInput>`, `<CommandList>`, `<CommandItem>`, `<CommandGroup>`, `<CommandSeparator>` to `src/components/ui/`.
- **D-02:** Include a live search/filter input (`<CommandInput>`) — cmdk's built-in filtering.
- **D-03:** Group commands into labeled sections: "Navigate to", "Actions", "Links".
- **D-04:** Skip ViewTransition from palette — call `setTheme()` directly (the `prefers-reduced-motion` branch in `theme-toggle.tsx`).
- **D-05:** Close palette first, then swap theme — dismiss dialog before calling `setTheme()`.
- **D-06:** Reuse the existing `switchLocale` server action from `locale-toggle-action.ts`.
- **D-07:** Always show both PT and EN locale commands regardless of active locale.
- **D-08:** Add a search/command icon button in the header — opens the palette on click/tap.
- **D-09:** Desktop (md+) show icon + ⌘K text; mobile show icon only.
- **D-10:** Position between locale toggle and theme toggle: `[PT/EN] [⌘K trigger] [ThemeToggle]`.

### Claude's Discretion

- Component file: `src/components/shared/command-palette.tsx`
- Render the palette in `src/app/[locale]/layout.tsx`
- Keyboard listener: `useEffect` with `keydown` on `document` checking `e.key === 'k' && (e.metaKey || e.ctrlKey)`
- Add `id="hero"` to `<section>` in `hero.tsx`
- Add named exports to `src/components/ui/index.ts` after Shadcn install
- Palette animation: Claude's call (Shadcn Dialog defaults + Tailwind)
- Icon choice: `Search` or `Command` from `lucide-react`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | User can open a command palette with Cmd+K / Ctrl+K from anywhere on the site | `useEffect` + `document.addEventListener('keydown')` pattern verified via Context7; `e.preventDefault()` required |
| UX-02 | Palette lists navigation commands — jump to Hero, About, Projects, Skills, Blog, Contact | Scroll targets verified: `#about`, `#projects`, `#skills`, `#contact`, `#career`, `#now`; `#hero` missing (must add); Blog = route navigation via `useRouter` |
| UX-03 | Palette has a theme toggle command — switch Jedi/Sith inline | `setTheme()` direct call (D-04); sequence: close palette → call `setTheme(next)` (D-05) |
| UX-04 | Palette has a locale switch command — PT ↔ EN | `switchLocale(target)` server action; form-action bind pattern already established in `locale-toggle.tsx` |
| UX-05 | Palette has quick-link commands — Resume PT, Resume EN, LinkedIn, GitHub | Resume paths from `contact.ts`: `/Luiz-Pansarini_Resume.pdf`, `/Luiz-Pansarini_Curriculo.pdf`; LinkedIn + GitHub from `contact.ts` |
| UX-06 | Keyboard-accessible: focus trap, Escape to dismiss, arrow key navigation, Enter executes | Radix Dialog handles focus trap + Escape; cmdk handles arrow nav + Enter; verified via Shadcn source |
| UX-07 | Visible dismiss target for mobile users | `showCloseButton={true}` on `CommandDialog`; Shadcn new-york-v4 template defaults to `showCloseButton={true}` |
</phase_requirements>

---

## Summary

This phase adds a Cmd+K command palette using Shadcn's Command component (backed by `cmdk@1.1.1`) wrapped in a Shadcn Dialog. The technical path is well-paved: cmdk handles all keyboard navigation (arrow keys, Enter, Esc, filtering), Radix Dialog provides focus trap and Escape dismiss, and the global keyboard shortcut is a single `useEffect` pattern verified in both cmdk's official docs and Shadcn's example code.

The codebase is well-prepared. The `setTheme()` call path exists in `theme-toggle.tsx` (reduced-motion branch, lines 31-37). The `switchLocale` server action in `locale-toggle-action.ts` is ready to be called directly from the palette. Section anchor IDs are mostly in place — only `id="hero"` is missing from the `<section>` element in `hero.tsx` (currently only `id="hero-heading"` exists on the `<h1>`). Blog navigation is a route change (`/{locale}/blog`), not an anchor scroll, and requires `useRouter` from `@/lib/i18n/navigation`.

The install is `npx shadcn@latest add command dialog`. Both `command.tsx` and `dialog.tsx` are absent from `src/components/ui/`. The `radix-ui@^1.4.3` monorepo bundle (already installed) exports `Dialog`, so `dialog.tsx` will import from `radix-ui` matching the project's established pattern. `cmdk` itself is not yet installed and will be added by the Shadcn CLI.

**Primary recommendation:** Use `CommandDialog` from `src/components/ui/command.tsx` (the Shadcn new-york-v4 template) as the palette shell. Wire the `open` state in `src/components/shared/command-palette.tsx` with a `useEffect` keyboard listener, expose a `triggerButton` via a separate prop or sibling export, and render the component in `src/app/[locale]/layout.tsx` inside the `NextIntlClientProvider`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Palette open/close state | Browser/Client | — | `useState` in `command-palette.tsx`; purely local UI state |
| Global keyboard shortcut listener | Browser/Client | — | `document.addEventListener` in `useEffect`; must be client-side |
| Focus trap, Esc dismiss, ARIA role=dialog | Browser/Client (Radix) | — | Radix Dialog primitive owns this; no app-level code needed |
| Command search/filter | Browser/Client (cmdk) | — | cmdk filters `CommandItem` children against `CommandInput` value natively |
| Scroll-to-section navigation | Browser/Client | — | `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })` |
| Route navigation (Blog) | Browser/Client | — | `useRouter().push('/{locale}/blog')` via `@/lib/i18n/navigation` |
| Theme swap | Browser/Client | — | `setTheme(next)` from `next-themes`; synchronous client-side |
| Locale swap | API/Backend (Server Action) | Browser (redirect) | `switchLocale(target)` sets cookie + redirects; server-side with browser reload |
| Header trigger button | Browser/Client | — | Button in `header.tsx`; shares `open` state with palette via lifted state or prop |
| Translation strings | RSC + Client bridge | — | `useTranslations('commandPalette')` via `NextIntlClientProvider` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `cmdk` | `1.1.1` | Command menu primitive — keyboard nav, filtering, ARIA | Industry standard (used by Linear, Vercel, GitHub); Shadcn builds on it |
| `@radix-ui/react-dialog` (via `radix-ui` bundle) | `1.4.3` (bundle) | Modal focus trap, Esc dismiss, backdrop overlay | Already installed as `radix-ui`; Shadcn command.tsx imports `Dialog` from `radix-ui` |
| `next-themes` | `^0.4.6` | `setTheme()` for theme swap command | Already installed |
| `next-intl` | `^4.11.0` | `useTranslations`, `useLocale` for palette strings + locale commands | Already installed |

[VERIFIED: npm registry — cmdk@1.1.1, radix-ui@1.4.3 confirmed installed/latest]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `^1.14.0` | `Search` / `Command` icon for header trigger, section icons in palette | Already installed; use `Search` or `Command` for the trigger button |
| `motion` | `^12.38.0` | Optional palette animation | Only if Shadcn Dialog's built-in CSS fade proves insufficient (Claude's discretion) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `CommandDialog` (Shadcn wrapper) | Raw `Command.Dialog` from cmdk | Shadcn adds `dialog.tsx` wrapping Radix Dialog, proper ARIA labels, `showCloseButton` — prefer Shadcn |
| `useEffect` keyboard listener | `useKeyboardEvent` hook | No additional library needed; `useEffect` is 3 lines and idiomatic |
| Route navigation for Blog via `useRouter` | `<Link>` click simulation | `useRouter().push()` is the correct imperative API from inside a client handler |

**Installation:**
```bash
npx shadcn@latest add command dialog
```
This installs `cmdk` as a direct dependency and generates `src/components/ui/command.tsx` + `src/components/ui/dialog.tsx`.

---

## Architecture Patterns

### System Architecture Diagram

```
User (keyboard/tap)
       │
       ▼
[document keydown listener]         [Header trigger button]
  e.key === 'k' + metaKey/ctrlKey      onClick
       │                                  │
       └──────────────┬───────────────────┘
                      │ setOpen(true)
                      ▼
          [CommandPalette — client component]
          open: boolean state
                      │
                      ▼
          [CommandDialog (Shadcn)]
          wraps Radix Dialog (focus trap, Esc dismiss, backdrop)
                      │
                      ▼
          [CommandInput] ──── cmdk filtering
                      │
          [CommandList]
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    [Group: Navigate]  [Group: Actions]  [Group: Links]
     • Hero (scroll)    • Toggle theme    • Resume PT (a href)
     • About (scroll)   • Switch to PT    • Resume EN (a href)
     • Projects (scroll)• Switch to EN    • LinkedIn (window.open)
     • Skills (scroll)                    • GitHub (window.open)
     • Career (scroll)
     • Now (scroll)
     • Contact (scroll)
     • Blog (router.push)
                      │
       onSelect handler executes:
       setOpen(false) → action()
```

### Recommended Project Structure

```
src/
├── components/
│   ├── shared/
│   │   ├── command-palette.tsx   # New: the palette + keyboard listener
│   │   ├── header.tsx            # Modified: add trigger button + shared open state
│   │   └── index.ts              # Modified: add CommandPalette export
│   └── ui/
│       ├── command.tsx           # New: generated by `npx shadcn@latest add command`
│       ├── dialog.tsx            # New: generated by `npx shadcn@latest add dialog`
│       └── index.ts              # Modified: add Command exports + Dialog exports
├── components/sections/
│   └── hero.tsx                  # Modified: add id="hero" to <section>
└── messages/
    ├── en.json                   # Modified: add commandPalette namespace
    └── pt.json                   # Modified: add commandPalette namespace
```

### Pattern 1: Global Keyboard Shortcut + CommandDialog

**What:** A `'use client'` component manages `open` state, attaches a `keydown` listener to `document`, and renders `CommandDialog` from Shadcn.

**When to use:** Any always-available palette that opens from a global shortcut.

**Example:**
```tsx
// Source: Context7 /dip/cmdk + Shadcn examples/radix/command-dialog.tsx
'use client';
import { CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('commandPalette');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('title')}
      description={t('description')}
      showCloseButton={true}
    >
      <CommandInput placeholder={t('placeholder')} />
      <CommandList>
        <CommandEmpty>{t('empty')}</CommandEmpty>
        <CommandGroup heading={t('groupNavigate')}>
          {/* ... */}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Pattern 2: Close-Then-Act Sequence (D-05)

**What:** `onSelect` closes the dialog BEFORE executing the action. Required for theme swap (D-05) so the visual change applies to the full page without the overlay competing.

**When to use:** Any action that causes a visible UI change (theme swap, scroll, navigation).

**Example:**
```tsx
// Source: derived from D-05 decision and Shadcn CommandItem pattern
function handleSelect(action: () => void) {
  // Close dialog first, then execute action in a microtask
  setOpen(false);
  // Theme and scroll actions need one frame after close animation
  // For instant setTheme (no VT), requestAnimationFrame is sufficient
  requestAnimationFrame(action);
}

// Theme item:
<CommandItem onSelect={() => handleSelect(() => setTheme(next))}>
  {t('toggleTheme')}
</CommandItem>
```

> Note: `requestAnimationFrame` gives the dialog close animation one frame to start before the theme swap happens. For scroll targets, one frame prevents the palette from intercepting scroll events.

### Pattern 3: Scroll Navigation

**What:** Smooth-scroll to a section anchor using `scrollIntoView`.

**When to use:** "Navigate to" commands for sections on the current page.

**Example:**
```tsx
// Source: [ASSUMED] — standard DOM API
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}
// Note: prefers-reduced-motion is handled by globals.css
// `scroll-behavior: auto !important` under the RM media query suppresses smooth scroll
```

> The project's `globals.css` already enforces `scroll-behavior: auto !important` under `prefers-reduced-motion: reduce`, so `behavior: 'smooth'` is safe to use unconditionally.

### Pattern 4: Locale Switch via Server Action

**What:** Call `switchLocale(target)` directly as a form action or programmatic call.

**When to use:** Locale switch commands in the palette.

**Example:**
```tsx
// Source: existing locale-toggle.tsx pattern
import { switchLocale } from '@/components/shared/locale-toggle-action';

// In a CommandItem onSelect:
<CommandItem onSelect={() => { setOpen(false); switchLocale('en'); }}>
  {t('switchToEn')}
</CommandItem>
```

> `switchLocale` is a Server Action (`'use server'`). Calling it from a client component is valid — Next.js serializes the call. It sets the `NEXT_LOCALE` cookie and redirects (page reload), so the palette will unmount naturally. No need for explicit `setOpen(false)` before the redirect, but it's harmless and consistent.

### Pattern 5: Blog Route Navigation

**What:** Navigate to `/{locale}/blog` using locale-aware router.

**When to use:** "Blog" command — not a section scroll, it's a route change.

**Example:**
```tsx
// Source: existing lib/i18n/navigation.ts pattern
import { useRouter } from '@/lib/i18n/navigation';

const router = useRouter();
// In onSelect:
<CommandItem onSelect={() => { setOpen(false); router.push('/blog'); }}>
  {t('navBlog')}
</CommandItem>
// useRouter from @/lib/i18n/navigation auto-prefixes the active locale
```

### Pattern 6: Header State Sharing

**What:** The header trigger button and the palette share `open` state. Two options:

**Option A — Lift state to a shared wrapper (recommended):**
```tsx
// CommandPaletteRoot renders both the trigger button and the CommandPalette
'use client';
export function CommandPaletteRoot() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CommandPaletteTrigger onOpen={() => setOpen(true)} />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
// header.tsx renders <CommandPaletteRoot /> between <LocaleToggle /> and <ThemeToggle />
```

**Option B — Separate component with context/global store:**
Overkill for this use case. Option A is the clean, minimal approach.

### Anti-Patterns to Avoid

- **Importing `next/link` directly in command-palette.tsx:** Biome enforces `@/lib/i18n/navigation` for all `Link` usage. The palette uses `router.push()` for Blog (no `<Link>` element), so this is not an issue, but be aware.
- **Calling `setTheme()` inside `startViewTransition` from the palette:** D-04 explicitly forbids this — call `setTheme()` directly (the reduced-motion branch pattern).
- **Rendering `<CommandPalette />` inside `<Header />`:** Header is not a client component; palette must be rendered in `layout.tsx` or a client wrapper alongside the header, not inside it.
- **Forgetting `e.preventDefault()` in the keydown listener:** Without it, browsers intercept Cmd+K for URL bar focus (Chrome). [VERIFIED: Context7 cmdk README — `e.preventDefault()` is in the canonical example]
- **Missing `id="hero"` on the `<section>` element:** Currently only `id="hero-heading"` exists on `<h1>`. `document.getElementById('hero')` returns `null` without this fix. Must add `id="hero"` to the `<section>` in `hero.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard navigation in list | Custom `keydown` handler on list items | cmdk `CommandList` + `CommandItem` | cmdk handles roving tabindex, arrow up/down, Home/End, search |
| Focus trap | Custom focus management | Radix Dialog (via `CommandDialog`) | Edge cases: portals, nested dialogs, dynamic children |
| Command search/filter | Custom string matching | cmdk built-in filtering | cmdk normalizes, dedupes, and scores; handles accents, multi-word |
| Accessible dialog ARIA | Manual `role="dialog"` + `aria-modal` | Radix Dialog primitive | Screen reader announcements, focus return on close |
| Backdrop click dismiss | Custom overlay + click handler | Radix Dialog `onOpenChange` | Already wired via `CommandDialog`'s `onOpenChange` prop |
| Escape key dismiss | Custom keydown handler | Radix Dialog | Radix intercepts Esc before propagation; no conflict with palette shortcut |

**Key insight:** cmdk + Radix Dialog together cover the entire accessibility surface. The palette component's job is wiring data (commands, their labels, their actions) — not building keyboard infrastructure.

---

## Section Anchor IDs — Full Inventory

Verified by grepping `src/components/sections/` for `id=` attributes:

| Section | Component | `id` on `<section>` | Status |
|---------|-----------|---------------------|--------|
| Hero | `hero.tsx` | MISSING (`id="hero-heading"` is on `<h1>`) | Must add `id="hero"` |
| About | `about.tsx` | `id="about"` | Ready |
| Featured Projects | `featured-projects-teaser.tsx` | `id="projects"` | Ready |
| Personal Projects | `personal-projects.tsx` | `id="personal-projects"` | Ready |
| Career Timeline | `career-timeline.tsx` | `id="career"` | Ready |
| Skills | `skills.tsx` | `id="skills"` | Ready |
| Now Preview | `now-preview.tsx` | `id="now"` | Ready |
| Contact | `contact.tsx` | `id="contact"` | Ready |

[VERIFIED: grep across all section files]

**Homepage section order** (from `src/app/[locale]/page.tsx`):
Hero → About → FeaturedProjectsTeaser → PersonalProjects → CareerTimeline → Skills → NowPreview → Contact

**Navigate-to commands in palette** (D-03 specifies Hero, About, Projects, Skills, Blog, Contact):
- Hero → scroll to `#hero` (after adding id)
- About → scroll to `#about`
- Projects → scroll to `#projects`
- Skills → scroll to `#skills`
- Career → scroll to `#career` (not in D-03 spec, but id exists — include or omit is Claude's discretion)
- Blog → route: `router.push('/blog')` (separate page, locale-prefixed)
- Contact → scroll to `#contact`

**Sections with ids NOT in the D-03 spec** (`#personal-projects`, `#now`, `#career`): Including them adds value without violating any decision. Claude's discretion.

---

## Translation Keys Needed

The palette needs a new `commandPalette` namespace in both `messages/en.json` and `messages/pt.json`. No existing namespace covers palette-specific strings.

### Proposed `commandPalette` namespace

```json
// messages/en.json addition
"commandPalette": {
  "title": "Command Palette",
  "description": "Search for a command or action",
  "placeholder": "Type a command or search...",
  "empty": "No results found.",
  "triggerLabel": "Open command palette",
  "groupNavigate": "Navigate to",
  "groupActions": "Actions",
  "groupLinks": "Links",
  "navHero": "Home",
  "navAbout": "About",
  "navProjects": "Projects",
  "navSkills": "Skills",
  "navCareer": "Career",
  "navContact": "Contact",
  "navBlog": "Blog",
  "actionToggleTheme": "Toggle theme (Jedi / Sith)",
  "actionSwitchPt": "Switch to Portuguese",
  "actionSwitchEn": "Switch to English",
  "linkResumePt": "Resume — PT (PDF)",
  "linkResumeEn": "Resume — EN (PDF)",
  "linkLinkedin": "LinkedIn profile",
  "linkGithub": "GitHub profile"
}
```

```json
// messages/pt.json addition
"commandPalette": {
  "title": "Painel de Comandos",
  "description": "Pesquise por um comando ou ação",
  "placeholder": "Digite um comando ou pesquise...",
  "empty": "Nenhum resultado encontrado.",
  "triggerLabel": "Abrir painel de comandos",
  "groupNavigate": "Navegar para",
  "groupActions": "Ações",
  "groupLinks": "Links",
  "navHero": "Início",
  "navAbout": "Sobre",
  "navProjects": "Projetos",
  "navSkills": "Habilidades",
  "navCareer": "Carreira",
  "navContact": "Contato",
  "navBlog": "Blog",
  "actionToggleTheme": "Alternar tema (Jedi / Sith)",
  "actionSwitchPt": "Trocar para Português",
  "actionSwitchEn": "Trocar para Inglês",
  "linkResumePt": "Currículo — PT (PDF)",
  "linkResumeEn": "Resume — EN (PDF)",
  "linkLinkedin": "Perfil no LinkedIn",
  "linkGithub": "Perfil no GitHub"
}
```

[ASSUMED: Portuguese strings are author-authored translations — must be verified/corrected by Luiz before shipping]

---

## Quick-Link Data

Resume paths verified from `src/data/contact.ts`:

```ts
resumePdf: {
  en: '/Luiz-Pansarini_Resume.pdf',
  pt: '/Luiz-Pansarini_Curriculo.pdf',
},
linkedin: 'https://linkedin.com/in/luizpansarini',
github: 'https://github.com/LuizHAP',
```

[VERIFIED: src/data/contact.ts read directly]

---

## Testing Approach

`nyquist_validation: false` in config — test infrastructure section omitted per config. Testing notes for planner reference only.

### Vitest + RTL Test Strategy for CommandPalette

The existing test infrastructure uses the custom `render` wrapper from `src/test/render.tsx` (wraps in `NextIntlClientProvider` + `ThemeProvider`). The `command-palette.tsx` is a client component that needs both providers.

**Key test challenges with cmdk:**

1. **`document.addEventListener` in `useEffect`:** Test keyboard shortcut by firing a `keydown` event on `document` using `userEvent` or RTL's `fireEvent`.

2. **Server Action mock:** `locale-toggle-action.ts` has `'use server'` — must be mocked exactly as `locale-toggle.test.tsx` does: `vi.mock('./locale-toggle-action', () => ({ switchLocale: vi.fn(async () => {}) }))`.

3. **Shadcn Dialog portal:** Radix Dialog renders into `document.body` via a portal. Use `screen.getByRole('dialog')` after opening, which RTL finds in the full document body. No special configuration needed.

4. **cmdk filtering:** Do NOT test cmdk's internal filtering logic (it's library code). Test that items are rendered and that `onSelect` handlers fire.

5. **`vitest.config.mts` coverage gate:** New component files must be added to `COMPONENT_FILES` array and will get the `COMPONENT_TARGET` threshold (70% statements/functions, 60% branches). The `command-palette.tsx` and the updated `header.tsx` must both be added.

**Example test pattern:**
```tsx
// Source: derived from existing locale-toggle.test.tsx pattern
vi.mock('@/components/shared/locale-toggle-action', () => ({
  switchLocale: vi.fn(async () => {}),
}));

it('opens palette on Cmd+K', async () => {
  render(<CommandPaletteRoot />, { locale: 'en' });
  
  // Initially closed
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  
  // Fire keydown on document
  await userEvent.keyboard('{Meta>}k{/Meta}');
  
  // Dialog should now be visible
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

---

## Common Pitfalls

### Pitfall 1: Missing `e.preventDefault()` on Cmd+K

**What goes wrong:** Chrome intercepts Cmd+K to focus the address bar; Firefox may intercept it too. The palette opens but the URL bar also receives focus.
**Why it happens:** Cmd+K is a browser-reserved shortcut in some contexts.
**How to avoid:** Always call `e.preventDefault()` before `setOpen()` in the keydown handler.
**Warning signs:** Console logs show the listener firing, but the URL bar gets focused simultaneously.

[VERIFIED: cmdk README canonical example includes `e.preventDefault()`]

### Pitfall 2: Calling `setTheme()` Before Closing the Dialog

**What goes wrong:** Theme changes apply while the dialog overlay is visible, creating a visual flash — the backdrop and palette contents briefly render in the new theme while transitioning out.
**Why it happens:** `setTheme()` is synchronous and applies immediately to `<html>`.
**How to avoid:** D-05: set `open` to `false` first, then call `setTheme()` in a `requestAnimationFrame` callback.
**Warning signs:** A visible flash/flicker on the backdrop during theme change from palette.

### Pitfall 3: Server Action Called from Wrong Context

**What goes wrong:** `switchLocale` may throw if called without the cookie/headers context that `next/headers` requires.
**Why it happens:** Server Actions must be invoked as form actions or via React's server-function call mechanism from a client component — direct import and invocation is the correct approach in Next.js 15+.
**How to avoid:** Call `switchLocale('pt')` directly in `onSelect` — this is the exact pattern used in `locale-toggle.tsx` with `formAction={switchLocale.bind(null, 'pt')}`. The direct-call equivalent is equally valid from a client handler in Next.js 16.
**Warning signs:** `Error: Invariant: headers() expects to be called in a React Server Component` — means the action is being called during SSR, not from a user interaction.

### Pitfall 4: `id="hero"` Missing Causes Silent Scroll Failure

**What goes wrong:** `document.getElementById('hero')` returns `null`; `?.scrollIntoView()` silently no-ops.
**Why it happens:** `hero.tsx` only has `id="hero-heading"` on the `<h1>`, not `id="hero"` on the `<section>`.
**How to avoid:** Add `id="hero"` to the `<section>` element in `hero.tsx` before implementing scroll nav.
**Warning signs:** "Hero" palette command does nothing visually.

[VERIFIED: grep of hero.tsx confirms `id="hero-heading"` on `<h1>`, no `id` on `<section>`]

### Pitfall 5: Radix Dialog inside Radix Dialog (sheet + palette)

**What goes wrong:** If the user has `<Sheet>` or another Radix Dialog open and triggers Cmd+K, nested dialogs may conflict with focus management.
**Why it happens:** Radix Dialog captures focus globally.
**How to avoid:** The Esc key will dismiss the innermost dialog first (correct behavior). No code change needed — Radix handles nesting via the `DialogContext` stack.
**Warning signs:** Esc dismisses both dialogs at once, or focus returns to wrong element.

### Pitfall 6: `useRouter` from `next/navigation` vs `@/lib/i18n/navigation`

**What goes wrong:** Using `next/navigation`'s `useRouter` directly strips the locale prefix from the blog route, breaking navigation. Biome will also error with `noRestrictedImports`.
**Why it happens:** The Biome rule blocks `next/link` but `next/navigation` is not in the restrict list. However, the locale-aware router must be used for correct routing.
**How to avoid:** Always import `useRouter` from `@/lib/i18n/navigation`, not `next/navigation`.
**Warning signs:** Blog navigation routes to `/blog` instead of `/en/blog` or `/pt/blog`.

[VERIFIED: biome.jsonc read — `next/link` is restricted; `@/lib/i18n/navigation` is the project convention per `src/lib/i18n/navigation.ts`]

### Pitfall 7: `cmdk` Not in `vitest.config.mts` `server.deps.inline`

**What goes wrong:** vitest fails to import `cmdk` in jsdom environment with ESM module errors.
**Why it happens:** `cmdk` is ESM-only; `next-intl` is already in `server.deps.inline` for this reason.
**How to avoid:** After installing `cmdk`, add `'cmdk'` to `server.deps.inline` in `vitest.config.mts` alongside `next-intl`.
**Warning signs:** `SyntaxError: Cannot use import statement in a module` or `ERR_REQUIRE_ESM` in test output.

[ASSUMED — based on `next-intl` being in `server.deps.inline` for the same reason; cmdk ESM status should be verified when running first test]

### Pitfall 8: `command.tsx` generated with wrong Dialog import path

**What goes wrong:** Shadcn generates `command.tsx` with `import { Dialog } from '@/components/ui/dialog'`. If the project uses a barrel re-export pattern, this may need adjustment.
**Why it happens:** Shadcn's generated code imports dialog directly by file path.
**How to avoid:** Verify the generated `command.tsx` import path after `npx shadcn@latest add command dialog`. The project can keep the direct import (it's within `ui/`) or adjust to match conventions.
**Warning signs:** TypeScript error about missing module `@/components/ui/dialog` if the barrel is not updated.

---

## Code Examples

### CommandDialog with keyboard shortcut

```tsx
// Source: Context7 /dip/cmdk README + Shadcn examples/radix/command-dialog.tsx
'use client';
import { useEffect, useState } from 'react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={true}>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate to">
          <CommandItem onSelect={() => { setOpen(false); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}>
            About
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Header trigger button (D-08, D-09)

```tsx
// Source: derived from existing header.tsx + locale-toggle.tsx 44px touch target pattern
// Desktop: icon + "⌘K" text. Mobile: icon only.
<Button
  type="button"
  variant="ghost"
  aria-label={t('commandPalette.triggerLabel')}
  onClick={() => setOpen(true)}
  className="h-11 min-w-[44px] gap-1 px-2"
>
  <Search className="h-5 w-5" aria-hidden="true" />
  <span className="hidden md:inline text-xs text-muted-foreground">⌘K</span>
</Button>
```

### setTheme with close-first sequence (D-04, D-05)

```tsx
// Source: theme-toggle.tsx lines 31-37 (reduced-motion branch — exact code path to reuse)
const { resolvedTheme, setTheme } = useTheme();
const isDark = resolvedTheme === 'dark';

// In CommandItem onSelect:
<CommandItem onSelect={() => {
  const next = isDark ? 'light' : 'dark';
  setOpen(false);
  requestAnimationFrame(() => setTheme(next));
}}>
  Toggle theme (Jedi / Sith)
</CommandItem>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Command.Dialog` from raw `cmdk` | `CommandDialog` from `shadcn/ui` wrapping Radix Dialog | Shadcn added dialog wrapper in 2024 | Adds `showCloseButton`, `title`, `description`, ARIA labels out of the box |
| `@radix-ui/react-dialog` separate package | `radix-ui` monorepo bundle (v1.4+) | 2024 — `radix-ui@1.x` bundled | Import via `import { Dialog } from 'radix-ui'` — this project already does this |
| cmdk `<Command.Root>` API | `<Command>` functional component | cmdk@1.0 renamed (API identical) | Import as `import { Command as CommandPrimitive } from 'cmdk'` in generated Shadcn file |

**Deprecated/outdated:**
- `@radix-ui/react-dialog` standalone: this project uses `radix-ui` monorepo bundle; generated `dialog.tsx` should import `Dialog` from `'radix-ui'`, not `@radix-ui/react-dialog`. Verify this in the generated output and adjust if needed.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Portuguese translation strings in `commandPalette` namespace are accurate | Translation Keys | Shipped strings may be grammatically wrong; Luiz must review before merge |
| A2 | `cmdk` requires adding to `server.deps.inline` in vitest.config.mts for ESM compatibility | Pitfall 7, Testing | If wrong, tests work without the change; low risk |
| A3 | `requestAnimationFrame` provides sufficient delay between dialog close and `setTheme()` to avoid visual flash | Pattern 2, Pitfall 2 | If insufficient, may need `setTimeout(fn, 100)` or trigger after Radix close animation callback |
| A4 | `switchLocale(target)` called directly from `onSelect` (not via form action) works in Next.js 16 client components | Pattern 4 | If wrong, need to wrap in a `<form>` with `formAction` like `locale-toggle.tsx` does |

---

## Open Questions (RESOLVED — see 01-UI-SPEC.md)

1. **Should "Personal Projects", "Career", and "Now" also appear as Navigate-to commands?**
   - What we know: D-03 spec says Hero, About, Projects, Skills, Blog, Contact; but `#personal-projects`, `#career`, and `#now` IDs exist
   - What's unclear: Whether palette should expose every section or only the main ones
   - Recommendation: Claude's discretion — including all sections adds value; keep them unlabeled by default and let user prune in review

2. **`requestAnimationFrame` delay for theme swap sufficient?**
   - What we know: Shadcn Dialog close animation uses CSS transitions
   - What's unclear: Whether the dialog overlay visually updates before the theme swap when using `requestAnimationFrame` vs `setTimeout`
   - Recommendation: Use `requestAnimationFrame`; if tester observes flash, fall back to `setTimeout(fn, 150)` to match Radix Dialog's 150ms close animation

3. **Which icon for the header trigger — `Search` or `Command`?**
   - What we know: Both `Search` and `Command` are in `lucide-react`; context is "open command palette"
   - What's unclear: Which icon best communicates the action to non-technical users
   - Recommendation: `Search` (more universally recognized); `Command` is the programmer's mental model

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code/config changes only. No external services or CLI tools beyond the already-verified project stack. `npx shadcn@latest add command dialog` requires network access to the Shadcn registry (standard development environment assumption).

---

## Security Domain

`security_enforcement` is not set in `.planning/config.json` — treat as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Palette executes pre-authorized actions only |
| V3 Session Management | No | No session state changes |
| V4 Access Control | No | All palette commands are publicly accessible portfolio actions |
| V5 Input Validation | Minimal | `CommandInput` text never reaches server; cmdk filters client-side |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via locale switch | Tampering | `switchLocale` validates against `routing.locales` allowlist; referer validated against same-origin (already implemented in `locale-toggle-action.ts`) |
| XSS via palette command labels | Tampering | All command labels are translation strings (static JSON) + static data constants — no user-supplied content rendered as HTML |

**Security note:** The palette's `switchLocale` call reuses the existing server action which already has server-side locale validation (`routing.locales` allowlist check) and same-origin referer validation. No new security surface is introduced.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/dip/cmdk` — keyboard shortcut pattern, `Command.Dialog` API, `e.preventDefault()` requirement
- Shadcn GitHub `apps/v4/registry/new-york-v4/ui/command.tsx` — canonical `command.tsx` source for Tailwind v4 style, `CommandDialog` `showCloseButton` prop
- Shadcn GitHub `apps/v4/examples/radix/command-dialog.tsx` — canonical keyboard-shortcut + dialog example
- `src/components/shared/theme-toggle.tsx` — `setTheme()` direct call pattern (reduced-motion branch)
- `src/components/shared/locale-toggle-action.ts` — `switchLocale` server action signature
- `src/components/shared/locale-toggle.tsx` — `useLocale()` usage, form-action bind pattern
- `src/components/shared/header.tsx` — current header structure (insert point)
- `src/app/[locale]/layout.tsx` — confirmed render location for palette
- `src/components/ui/index.ts` + `src/components/shared/index.ts` — barrel export patterns
- `src/components/sections/hero.tsx` — confirmed `id="hero"` missing from `<section>`
- Grep of all section files — confirmed anchor IDs
- `messages/en.json` — confirmed `commandPalette` namespace is absent (must add)
- `vitest.config.mts` — confirmed `COMPONENT_FILES` coverage gate pattern, `server.deps.inline` includes `next-intl`
- `biome.jsonc` — confirmed `next/link` restriction rule, test file overrides
- `src/app/globals.css` — confirmed `scroll-behavior: auto !important` under RM media query
- npm registry — cmdk@1.1.1 is current, React 18/19 peer deps satisfied

### Secondary (MEDIUM confidence)
- `src/data/contact.ts` — resume PDF paths, LinkedIn, GitHub URLs verified
- `src/app/[locale]/page.tsx` — homepage section order confirmed
- `src/lib/i18n/navigation.ts` — `useRouter` export confirmed

### Tertiary (LOW confidence — flagged)
- A2 (cmdk ESM vitest): based on `next-intl` needing `server.deps.inline`; cmdk ESM status not confirmed by running a test
- A3 (requestAnimationFrame delay): based on Radix Dialog animation timing knowledge; not measured in this project

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry, Shadcn source read from GitHub
- Architecture: HIGH — all integration points read from codebase directly
- Pitfalls: HIGH for P1-P6; MEDIUM for P7-P8 (assumptions about vitest ESM behavior + Shadcn generated paths)
- Translation strings: LOW — Portuguese translations assumed correct, must be reviewed

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable dependencies; cmdk and Shadcn are slow-moving)
