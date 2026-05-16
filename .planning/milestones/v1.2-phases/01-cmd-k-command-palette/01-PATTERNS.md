# Phase 1: Cmd+K Command Palette - Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 10 (2 new, 8 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/shared/command-palette.tsx` | component (client) | event-driven | `src/components/shared/theme-toggle.tsx` | role-match (client component with useTheme + useTranslations + event handler) |
| `src/components/ui/command.tsx` | UI primitive | request-response | `src/components/ui/sheet.tsx` | role-match (Radix-based Shadcn primitive with `'use client'`, radix-ui import, data-slot pattern) |
| `src/components/ui/dialog.tsx` | UI primitive | request-response | `src/components/ui/sheet.tsx` | exact (both are Radix Dialog wrappers with identical structure) |
| `src/components/shared/header.tsx` | component (RSC) | request-response | `src/components/shared/header.tsx` (self) | exact (file is being modified) |
| `src/app/[locale]/layout.tsx` | layout (RSC) | request-response | `src/app/[locale]/layout.tsx` (self) | exact (file is being modified) |
| `src/components/sections/hero.tsx` | component (RSC) | request-response | `src/components/sections/hero.tsx` (self) | exact (trivial one-attribute addition) |
| `src/components/ui/index.ts` | barrel export | — | `src/components/ui/index.ts` (self) | exact (extending existing pattern) |
| `src/components/shared/index.ts` | barrel export | — | `src/components/shared/index.ts` (self) | exact (extending existing pattern) |
| `messages/en.json` | i18n messages | — | `messages/en.json` (self) | exact (adding new namespace) |
| `messages/pt.json` | i18n messages | — | `messages/pt.json` (self) | exact (adding new namespace) |

---

## Pattern Assignments

### `src/components/shared/command-palette.tsx` (NEW — client component, event-driven)

**Primary analog:** `src/components/shared/theme-toggle.tsx`
**Secondary analog:** `src/components/shared/locale-toggle.tsx`

**Imports pattern** — follow `theme-toggle.tsx` lines 1–17:
```tsx
'use client';
import { Button } from '@/components/ui';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
// Plus palette-specific imports:
import { useRouter } from '@/lib/i18n/navigation';
import { switchLocale } from '@/components/shared/locale-toggle-action';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
```

**`'use client'` directive** — first line, before imports (as in `theme-toggle.tsx` line 12 and `locale-toggle.tsx` line 1).

**useTranslations pattern** — from `theme-toggle.tsx` line 21:
```tsx
const t = useTranslations('commandPalette');
```

**useTheme pattern** — from `theme-toggle.tsx` lines 20–22:
```tsx
const { resolvedTheme, setTheme } = useTheme();
const isDark = resolvedTheme === 'dark';
```

**setTheme (reduced-motion branch) — the exact code path to reuse** from `theme-toggle.tsx` lines 31–36:
```tsx
// This is the branch the palette MUST use (D-04 — no ViewTransition from palette):
if (
  typeof document === 'undefined' ||
  !('startViewTransition' in document) ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  setTheme(next);
  return;
}
```
For the palette, call `setTheme(next)` directly — never wrap in `startViewTransition`. No coordinate capture needed.

**useLocale + switchLocale pattern** — from `locale-toggle.tsx` lines 6–7:
```tsx
import { useLocale, useTranslations } from 'next-intl';
import { switchLocale } from './locale-toggle-action';
// ...
const current = useLocale();
```

**Global keyboard listener pattern** — no existing analog; use the pattern from RESEARCH.md §Pattern 1:
```tsx
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  };
  document.addEventListener('keydown', down);
  return () => document.removeEventListener('keydown', down);
}, []);
```

**Close-then-act sequence for theme swap** (D-05) — no existing analog; from RESEARCH.md §Pattern 2:
```tsx
const next = isDark ? 'light' : 'dark';
setOpen(false);
requestAnimationFrame(() => setTheme(next));
```

**44px touch target on trigger button** — from `locale-toggle.tsx` line 14 and `theme-toggle.tsx` line 67:
```tsx
// LocaleToggle uses: 'inline-flex h-11 min-w-[44px] items-center justify-center px-2'
// ThemeToggle uses: className="h-11 w-11"
// Header trigger must follow the same h-11 + min-w-[44px] rule:
<Button
  type="button"
  variant="ghost"
  aria-label={t('triggerLabel')}
  onClick={() => setOpen(true)}
  className="h-11 min-w-[44px] gap-1 px-2"
>
  <Search className="h-5 w-5" aria-hidden="true" />
  <span className="hidden md:inline text-xs text-muted-foreground">⌘K</span>
</Button>
```

**CommandPaletteRoot lifted-state pattern** (from RESEARCH.md §Pattern 6, Option A):
```tsx
// CommandPaletteRoot renders both trigger + palette; placed in layout.tsx so it
// is not inside <Header /> (Header is RSC — see anti-pattern note below).
export function CommandPaletteRoot() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CommandPaletteTrigger onOpen={() => setOpen(true)} />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
```

**Critical anti-pattern to avoid:** Do NOT render `<CommandPalette />` inside `<Header />`. Header is an RSC (no `'use client'`, no `useState`). Palette must live in `layout.tsx` inside `NextIntlClientProvider`.

---

### `src/components/ui/command.tsx` (NEW — Shadcn UI primitive, generated)

**Analog:** `src/components/ui/sheet.tsx` (lines 1–131)

**Generated by:** `npx shadcn@latest add command dialog` — do not hand-write.

**Radix import pattern** — from `sheet.tsx` line 3:
```tsx
import { Dialog as SheetPrimitive } from 'radix-ui';
// command.tsx will use:
import { Command as CommandPrimitive } from 'cmdk';
// dialog.tsx import (for the CommandDialog wrapper) will use:
import { Dialog } from 'radix-ui';
```
Project uses the `radix-ui` monorepo bundle (not individual `@radix-ui/react-*` packages). Verify the generated `command.tsx` imports `Dialog` from `'radix-ui'`, not `'@radix-ui/react-dialog'`. Adjust if Shadcn generates the latter.

**`'use client'` directive** — first line, from `sheet.tsx` line 1.

**`data-slot` attribute pattern** — from `sheet.tsx` line 11:
```tsx
<SheetPrimitive.Root data-slot="sheet" {...props} />
// command.tsx will use data-slot="command", data-slot="command-input", etc.
```

**`cn()` utility import** — from `sheet.tsx` line 7:
```tsx
import { cn } from '@/lib/utils';
```

**`showCloseButton` prop pattern** — from `sheet.tsx` lines 47–48, 64–73:
```tsx
showCloseButton?: boolean;
// ...
{showCloseButton && (
  <SheetPrimitive.Close data-slot="sheet-close" asChild>
    <Button variant="ghost" className="absolute top-3 right-3" size="icon-sm">
      <XIcon />
      <span className="sr-only">Close</span>
    </Button>
  </SheetPrimitive.Close>
)}
```
`CommandDialog` in the generated `command.tsx` already includes `showCloseButton={true}` as described in RESEARCH.md §UX-07. Shadcn new-york-v4 template defaults to this.

**Named function exports (not `export default`)** — from `sheet.tsx` lines 121–130:
```tsx
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  // ...
};
```

**Overlay animation classes pattern** — from `sheet.tsx` line 35:
```tsx
'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0'
```
Dialog/Command overlay will follow the same Tailwind v4 data-attribute animation tokens.

---

### `src/components/ui/dialog.tsx` (NEW — Shadcn UI primitive, generated)

**Analog:** `src/components/ui/sheet.tsx` (same pattern, sheet IS built on Radix Dialog)

**Generated by:** `npx shadcn@latest add command dialog` — do not hand-write.

All patterns identical to `command.tsx` above:
- `'use client'` first line
- `import { Dialog } from 'radix-ui'` (verify this; sheet.tsx line 3 confirms `radix-ui` monorepo usage)
- `data-slot` attributes on every sub-component
- `cn()` from `@/lib/utils`
- Named function exports block at end of file

---

### `src/components/shared/header.tsx` (MODIFIED — add trigger button between LocaleToggle and ThemeToggle)

**Current file:** `src/components/shared/header.tsx` lines 1–28

**Current structure** (lines 13–25):
```tsx
<header className="sticky top-0 z-50 h-14 border-b border-border bg-muted px-4 md:px-6">
  <div className="mx-auto flex h-full max-w-6xl items-center gap-4">
    <Link href="/" aria-label={t('brandAriaLabel')} className="text-base font-semibold text-foreground">
      Luiz Pansarini
    </Link>
    <div className="flex-1" />
    <LocaleToggle />
    <ThemeToggle />
  </div>
</header>
```

**Target structure after modification** — insert `<CommandPaletteTrigger />` between `<LocaleToggle />` and `<ThemeToggle />`:
```tsx
<LocaleToggle />
<CommandPaletteTrigger onOpen={...} />   {/* NEW — receives onOpen prop from CommandPaletteRoot */}
<ThemeToggle />
```

**Header is RSC** — no `'use client'` directive. The trigger button that needs `onClick` state must be a separate client component (`CommandPaletteTrigger`) or `CommandPaletteRoot` must render both the trigger and palette at the layout level, passing a prop to header. See RESEARCH.md §Pattern 6 — Option A is the clean path: `CommandPaletteRoot` lives in `layout.tsx` and injects the trigger into the header slot via a prop or sibling render.

**Import pattern for new shared component** — follow existing imports at `header.tsx` lines 1–7:
```tsx
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from './locale-toggle';
import { ThemeToggle } from './theme-toggle';
// Add:
// import { CommandPaletteTrigger } from './command-palette';
```

---

### `src/app/[locale]/layout.tsx` (MODIFIED — add `<CommandPalette />` inside NextIntlClientProvider)

**Current file:** `src/app/[locale]/layout.tsx` lines 1–76

**Render location** — inside `<NextIntlClientProvider>` (line 55), after `<Header />` or before `<main>`. Current tree (lines 55–68):
```tsx
<NextIntlClientProvider messages={messages} locale={locale}>
  <SkipToContent />
  <Header />
  <main id="main-content" tabIndex={-1} className="scroll-mt-14 min-h-[calc(100vh-56px)]">
    {children}
  </main>
  <Footer />
  <Toaster />
</NextIntlClientProvider>
```

**Pattern to follow** — `<Toaster />` (line 66) and `<EasterEgg />` (line 70) both demonstrate rendering global-singleton client components from this layout. `<CommandPalette />` follows the same pattern:
```tsx
<NextIntlClientProvider messages={messages} locale={locale}>
  <SkipToContent />
  <Header />
  <main id="main-content" tabIndex={-1} className="scroll-mt-14 min-h-[calc(100vh-56px)]">
    {children}
  </main>
  <Footer />
  <Toaster />
  <CommandPalette />   {/* or <CommandPaletteRoot /> if trigger state is lifted here */}
</NextIntlClientProvider>
```

**Import pattern** — follow existing shared-component imports at line 10:
```tsx
import { EasterEgg, Footer, Header, SkipToContent, ThemeProvider } from '@/components/shared';
// Add CommandPalette (or CommandPaletteRoot) to this destructure after barrel export is added.
```

---

### `src/components/sections/hero.tsx` (MODIFIED — add `id="hero"` to `<section>`)

**Current file:** `src/components/sections/hero.tsx` lines 27–68

**Current `<section>` tag** (lines 28–31):
```tsx
<section
  aria-labelledby="hero-heading"
  className="mx-auto flex max-w-5xl ..."
>
```

**Change:** Add `id="hero"` attribute — single-attribute addition, no structural change:
```tsx
<section
  id="hero"
  aria-labelledby="hero-heading"
  className="mx-auto flex max-w-5xl ..."
>
```

**Note:** `id` attribute convention — lowercase, matches the section scroll-target pattern used in all other sections (`id="about"`, `id="projects"`, `id="skills"`, `id="contact"`, `id="career"`, `id="now"`).

---

### `src/components/ui/index.ts` (MODIFIED — add Command + Dialog exports)

**Current file:** `src/components/ui/index.ts` lines 1–45

**Barrel export pattern** — curated named re-exports, no `export *`. From existing file lines 30–44:
```ts
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
```

**Command exports to add** — after Shadcn generates `command.tsx`, add:
```ts
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';
```

**Dialog exports to add** — after Shadcn generates `dialog.tsx`, add:
```ts
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog';
```

**Ordering rule** — alphabetical by component name (current file is in alphabetical order: Alert → Badge → Button → Card → Dropdown → Reveal → Separator → Sheet → Skeleton → Toaster → Toggle → Tooltip). Command → Dialog inserts between Card/Dropdown and Dropdown/Reveal alphabetically.

---

### `src/components/shared/index.ts` (MODIFIED — add CommandPalette export)

**Current file:** `src/components/shared/index.ts` lines 1–7:
```ts
export { EasterEgg } from './easter-egg';
export { Footer } from './footer';
export { Header } from './header';
export { LocaleToggle } from './locale-toggle';
export { SkipToContent } from './skip-to-content';
export { ThemeProvider } from './theme-provider';
export { ThemeToggle } from './theme-toggle';
```

**Pattern:** One `export { X } from './x'` per line, alphabetical, no `export *`.

**Line to add** — `CommandPalette` (or `CommandPaletteRoot`) alphabetically between the existing entries:
```ts
export { CommandPalette } from './command-palette';
// or if lifting trigger state:
export { CommandPaletteRoot } from './command-palette';
```
Alphabetically: after `export { EasterEgg }` and before `export { Footer }`.

---

### `messages/en.json` (MODIFIED — add `commandPalette` namespace)

**Current file:** `messages/en.json` — top-level JSON object with namespaces.

**Namespace insertion pattern** — from existing entries, each namespace is a flat or shallow-nested object. Insert `"commandPalette"` alphabetically between `"blog"` and `"career"`:

```json
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

**Source for translation keys:** RESEARCH.md §Translation Keys Needed — exact strings from research. Strings are HIGH confidence (EN) and MEDIUM confidence (PT — must be verified by Luiz).

---

### `messages/pt.json` (MODIFIED — add `commandPalette` namespace)

**Same structure as `en.json`** — insert `"commandPalette"` at the same alphabetical position:

```json
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

**PT string confidence:** MEDIUM — research-assumed translations. Luiz must review before merge (RESEARCH.md §Assumptions A1).

---

## Shared Patterns

### `'use client'` directive
**Source:** `src/components/shared/theme-toggle.tsx` line 12, `src/components/shared/locale-toggle.tsx` line 1, `src/components/ui/sheet.tsx` line 1
**Apply to:** `command-palette.tsx`, `command.tsx`, `dialog.tsx`
**Rule:** First line of file, before any imports.

### Button usage (ghost variant, 44px touch target)
**Source:** `src/components/shared/theme-toggle.tsx` lines 59–72; `src/components/shared/locale-toggle.tsx` line 14
```tsx
// ThemeToggle icon button:
<Button type="button" variant="ghost" size="icon" aria-label={t('label')} className="h-11 w-11">

// LocaleToggle touch target (inline styles — prefer Button for trigger):
const baseBtn = 'inline-flex h-11 min-w-[44px] items-center justify-center px-2 text-sm';

// Header trigger (copy this pattern):
<Button type="button" variant="ghost" aria-label={t('triggerLabel')} className="h-11 min-w-[44px] gap-1 px-2">
```
**Apply to:** Header trigger button inside `command-palette.tsx`.

### useTranslations namespace pattern
**Source:** `src/components/shared/theme-toggle.tsx` line 21; `src/components/shared/locale-toggle.tsx` line 11
```tsx
const t = useTranslations('commandPalette');  // namespace matches messages/en.json key
```
**Apply to:** `command-palette.tsx`.

### Radix import from monorepo bundle
**Source:** `src/components/ui/sheet.tsx` line 3
```tsx
import { Dialog as SheetPrimitive } from 'radix-ui';
// Not: import * as SheetPrimitive from '@radix-ui/react-dialog'
```
**Apply to:** `dialog.tsx` (verify generated file uses `radix-ui` not `@radix-ui/react-dialog`).

### cn() utility
**Source:** `src/components/ui/sheet.tsx` line 7
```tsx
import { cn } from '@/lib/utils';
```
**Apply to:** `command.tsx`, `dialog.tsx`.

### Locale-aware router import
**Source:** RESEARCH.md §Pitfall 6 (verified against `src/lib/i18n/navigation.ts`)
```tsx
import { useRouter } from '@/lib/i18n/navigation';
// NOT: import { useRouter } from 'next/navigation'
```
**Apply to:** `command-palette.tsx` for Blog route navigation.

### Server Action import from client component
**Source:** `src/components/shared/locale-toggle.tsx` line 7
```tsx
import { switchLocale } from './locale-toggle-action';
```
**Apply to:** `command-palette.tsx` for locale switch commands.

### Barrel export format
**Source:** `src/components/shared/index.ts` lines 1–7; `src/components/ui/index.ts` lines 1–45
```ts
export { ComponentName } from './component-file';   // named, no export *
```
**Apply to:** Both barrel files when adding new exports.

---

## Testing Patterns

### Test file structure
**Source:** `src/components/shared/theme-toggle.test.tsx` (closest analog — client component with hooks + user interaction)

**Import pattern** (lines 1–4):
```tsx
import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';
```

**Render helper** — always use `src/test/render.tsx`'s `render` (wraps in `NextIntlClientProvider` + `ThemeProvider`). Accepts `{ locale: 'en' | 'pt', theme: 'light' | 'dark' }`:
```tsx
render(<CommandPalette />, { locale: 'en', theme: 'light' });
```

**Server Action mock pattern** — from `locale-toggle.tsx` usage (mock in test as):
```tsx
vi.mock('@/components/shared/locale-toggle-action', () => ({
  switchLocale: vi.fn(async () => {}),
}));
```

**Keyboard event test pattern** (for global `document` listener):
```tsx
// Fire keydown on document (not on element — listener is on document):
await userEvent.keyboard('{Meta>}k{/Meta}');
// Then assert dialog is visible:
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

**vitest.config.mts coverage gate** — add new files to `COMPONENT_FILES` array (line 16):
```ts
const COMPONENT_FILES = [
  // ... existing files ...
  'src/components/shared/command-palette.tsx',  // ADD
  // header.tsx is already in COMPONENT_FILES at line 28
];
```
Threshold will auto-apply `COMPONENT_TARGET` (70% statements/functions, 60% branches).

**cmdk ESM compatibility** — add `'cmdk'` to `server.deps.inline` in `vitest.config.mts` line 67 (alongside `'next-intl'`):
```ts
server: {
  deps: {
    inline: ['next-intl', 'github-slugger', 'cmdk'],  // ADD 'cmdk'
  },
},
```
This is flagged as MEDIUM confidence (RESEARCH.md §Assumption A2) — verify when first test runs.

---

## No Analog Found

No files are without an analog. All files have close matches within the codebase.

---

## Quick Reference: Data Dependencies

| Data | Source | Used In |
|------|--------|---------|
| `resumePdf.en` + `resumePdf.pt` | `src/data/contact.ts` | `command-palette.tsx` quick links |
| `linkedin` URL | `src/data/contact.ts` | `command-palette.tsx` quick links |
| `github` URL | `src/data/contact.ts` | `command-palette.tsx` quick links |
| Section anchor IDs | Verified via grep: `#hero` (add), `#about`, `#projects`, `#personal-projects`, `#career`, `#skills`, `#now`, `#contact` | `command-palette.tsx` navigate-to commands |
| Blog route | `/{locale}/blog` via `useRouter` from `@/lib/i18n/navigation` | `command-palette.tsx` Blog command |

---

## Metadata

**Analog search scope:** `src/components/shared/`, `src/components/ui/`, `src/app/[locale]/`, `src/components/sections/`, `messages/`, `src/test/`
**Files read:** 16 source files
**Pattern extraction date:** 2026-05-12
