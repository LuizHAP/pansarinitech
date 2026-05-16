# Phase 2: UX Polish — Testing, Interactions & Animations - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 7 files to be created or modified
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sections/copy-email-button.tsx` | component | event-driven | `src/components/sections/copy-email-button.tsx` (self — additive) | exact |
| `src/components/sections/copy-email-button.test.tsx` | test | event-driven | `src/components/sections/copy-email-button.test.tsx` (self — additive) | exact |
| `src/data/personal-projects.ts` | data/config | CRUD | `src/data/personal-projects.ts` (self — field population) | exact |
| `src/components/sections/skills.tsx` | component | event-driven | `src/components/sections/contact.tsx` | role-match (focus-ring pattern) |
| `src/components/sections/now-preview.tsx` | component | request-response | `src/components/sections/featured-projects-teaser.tsx` | role-match (link hover pattern) |
| `public/screenshots/` | static asset dir | file-I/O | `public/personal-projects/starlimp.png` (existing sibling dir) | structural-match |

---

## Pattern Assignments

### `src/components/sections/copy-email-button.tsx` (component, event-driven)

**Analog:** Self — this file is the modification target. Patterns extracted directly.

**Imports pattern** (lines 1–16 of current file):
```typescript
'use client';

import { CopyIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
```

**Addition — AnimatePresence imports** (insert before existing lucide import):
```typescript
import { AnimatePresence, motion } from 'motion/react';
import { Check, CopyIcon } from 'lucide-react';
```

**Core pattern — current icon render** (line 80):
```typescript
<CopyIcon className="size-4" aria-hidden="true" />
```

**Core pattern — replacement with AnimatePresence icon swap**
(source: RESEARCH.md Pattern 1 + motion/react official API, consistent with `childVariant` easing in `reveal-group.tsx` lines 12–13):
```typescript
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
```

**Easing source:** `ease: 'easeOut'` matches `reveal-group.tsx` line 12: `transition: { duration: 0.4, ease: 'easeOut' }`.

**Reduced-motion handling:** No per-component `useReducedMotion()` needed. `layout.tsx` line 54 wraps the entire tree in `<MotionConfig reducedMotion="user">` — motion reads `prefers-reduced-motion` automatically for all `motion.*` elements.

**MotionConfig location** (`src/app/[locale]/layout.tsx` lines 54–68):
```typescript
<MotionConfig reducedMotion="user">
  <NextIntlClientProvider messages={messages} locale={locale}>
    ...
  </NextIntlClientProvider>
</MotionConfig>
```

**Focus-ring pattern to preserve** (line 77 of current file):
```
focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50
```

**Button aria pattern to preserve** (line 74):
```typescript
aria-live="polite"
```

**No `--success` CSS variable:** Confirmed absent from `globals.css`. Use `text-green-600 dark:text-green-400` directly on the wrapping `motion.span`.

---

### `src/components/sections/copy-email-button.test.tsx` (test, event-driven)

**Analog:** Self — additive. Append Test 7 inside the existing `describe` block.

**Top-level mock pattern to extend** (lines 7–10, current file):
```typescript
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));
```

**New mock to add at module level** (hoist alongside the sonner mock; Vitest auto-hoists `vi.mock` calls):
```typescript
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Check: () => <span data-testid="check-icon" />,
    CopyIcon: () => <span data-testid="copy-icon" />,
  };
});
```

**beforeEach pattern to match** (lines 18–35, current file — no changes needed):
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: vi.fn().mockReturnValue(false),
  });
});
```

**Existing clipboard-success test pattern to mirror** (Test 3, lines 56–72):
```typescript
it('Test 3 (clipboard success): calls writeText with the email and shows success toast', async () => {
  const user = userEvent.setup();
  const writeTextSpy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: writeTextSpy },
  });
  render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });
  await user.click(screen.getByRole('button'));
  expect(writeTextSpy).toHaveBeenCalledWith(TEST_EMAIL);
  expect(toast.success).toHaveBeenCalledWith('Email copied');
  expect(screen.getByRole('button')).toHaveTextContent('Email copied');
});
```

**New Test 7 pattern** (append inside `describe`, after Test 6):
```typescript
it('Test 7 (icon swap): Check icon renders and CopyIcon is absent after clipboard success', async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });

  // Before click: CopyIcon present, Check absent
  expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button'));

  // After click: Check present, CopyIcon absent
  expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument();
});
```

**Render helper import** (line 12 of current file — unchanged):
```typescript
import { act, render, screen } from '@/test/render';
```

**Render helper wrapper** (`src/test/render.tsx` lines 22–31 — provides NextIntlClientProvider + ThemeProvider):
```typescript
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="UTC">
      <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
```

---

### `src/data/personal-projects.ts` (data/config, CRUD)

**Analog:** Self — field population only. No interface changes needed.

**Interface shape** (lines 3–15 of current file):
```typescript
export interface PersonalProject {
  id: string;
  name: string;
  description: { en: string; pt: string };
  stack: string[];
  status: ProjectStatus;
  screenshot?: string; // relative path under /personal-projects/
  liveUrl?: string;
  githubUrl?: string;
  accentColor: string;
}
```

**Existing entry with screenshot** (lines 19–31 — the Starlimp pattern to copy for the 4 new entries):
```typescript
{
  id: 'starlimp',
  name: 'Starlimp Jundiaí',
  // ...
  screenshot: '/personal-projects/starlimp.png',
  accentColor: 'from-blue-500/20 to-cyan-500/20',
},
```

**Entries requiring `screenshot` field** (ids: `doacao`, `notificame`, `mtgprice`, `redzone-boss`):
```typescript
// Pattern to add to each of the 4 entries:
screenshot: '/screenshots/[id].png',
// Keep accentColor — it serves as fallback if next/image fails
```

**Naming convention** (from CONTEXT.md §Specific Ideas):
- `public/screenshots/doacao.png`
- `public/screenshots/notificame.png`
- `public/screenshots/mtgprice.png`
- `public/screenshots/redzone-boss.png`

Note the path prefix is `/screenshots/` (not `/personal-projects/`) — these are new screenshot assets, separate from the existing `public/personal-projects/` directory.

**`ProjectScreenshot` branch logic** (`personal-projects.tsx` lines 37–59 — no changes to this component):
```typescript
function ProjectScreenshot({ project }: { project: PersonalProject }) {
  if (project.screenshot) {
    return (
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        <Image
          src={project.screenshot}
          alt={project.name}
          width={640}
          height={400}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }
  // gradient fallback — only shown when screenshot field is absent
  return (
    <div className={`aspect-[16/10] w-full bg-gradient-to-br ${project.accentColor} ...`}>
      ...
    </div>
  );
}
```

**Asset sequencing requirement** (from RESEARCH.md Pitfall 4): `public/screenshots/` directory and PNG files must exist before updating `personal-projects.ts`. `next/image` with local paths does not validate file existence at build time — missing files produce runtime 404s, not build errors.

---

### `src/components/sections/skills.tsx` (component, event-driven)

**Analog:** `src/components/sections/contact.tsx` — focus-ring pattern reference.

**DEV-1: Current focus-ring** (line 57 of `skills.tsx`):
```typescript
'flex-none rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
```

**Required focus-ring** (from `contact.tsx` lines 73, 90, 103, 114 — all buttons/links use this pattern):
```typescript
focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50
```

**Fix:** Change `ring-2` to `ring-3` and append `/50` to `ring-ring`. One-line change in the filter chip className array at line 57.

**Complete corrected chip base class** (after fix):
```typescript
'flex-none rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
```

**Contact button pattern for reference** (`contact.tsx` line 90):
```typescript
className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
```

**Do not touch:** `stagger={0.04}` on `RevealGroup` (line 73 of `skills.tsx`) — D-11 forbids harmonizing stagger values.

---

### `src/components/sections/now-preview.tsx` (component, request-response)

**Analog:** `src/components/sections/featured-projects-teaser.tsx` — established primary-link hover pattern.

**DEV-2: Current link pattern** (`now-preview.tsx` line 31):
```typescript
className="underline decoration-primary underline-offset-2 hover:opacity-80"
```

**Required link pattern** (from `featured-projects-teaser.tsx` lines 47, 56 — canonical nav/primary link):
```typescript
className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
```

**Fix:** Update `now-preview.tsx` line 31 — change `underline-offset-2` to `underline-offset-4`, add `decoration-2`, replace `hover:opacity-80` with `hover:decoration-foreground`.

**Corrected `now-preview.tsx` Link className** (after fix):
```typescript
className="underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
```

Note: `font-semibold text-foreground` from the FeaturedProjects nav link are optional additions — the NowPreview link is inline prose (not a nav CTA), so those weight/color classes may be omitted if they break the paragraph flow. The mandatory changes are `underline-offset-4`, `decoration-2`, and `hover:decoration-foreground`.

---

### `public/screenshots/` (static asset directory, file-I/O)

**Analog:** `public/personal-projects/` (existing directory with `starlimp.png`).

**No code to write** — this is a directory creation + asset placement step. The planner must include a human hand-off task: Luiz provides PNG assets at ≤1280px wide, executor places them, then updates `personal-projects.ts`.

**`next/image` consumption pattern** (already in `personal-projects.tsx` lines 41–48):
```typescript
<Image
  src={project.screenshot}       // e.g. '/screenshots/doacao.png'
  alt={project.name}
  width={640}
  height={400}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
  className="h-full w-full object-cover object-top ..."
/>
```

---

## Shared Patterns

### Focus Ring Standard
**Source:** `src/components/sections/contact.tsx` lines 73, 90, 103, 114
**Apply to:** All interactive elements (buttons, `<a>` tags) across all homepage sections
```typescript
focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50
```

### Card Hover Standard
**Source:** `src/components/sections/personal-projects.tsx` line 84 and `featured-projects-teaser.tsx` line 67
**Apply to:** Any card wrapper that is a link or has hover affordance
```typescript
transition hover:-translate-y-0.5 hover:shadow-md
```

### Primary Inline Link Standard
**Source:** `src/components/sections/featured-projects-teaser.tsx` lines 47, 56
**Apply to:** Standalone "view all" / "read more" links that are primary navigation intent
```typescript
underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground
```

### Animation — Scroll Reveal
**Source:** `src/components/ui/reveal-group.tsx` full file
**Apply to:** All section grids and lists (already applied everywhere in scope)
```typescript
// RevealGroup wraps the grid; RevealItem wraps each card
<RevealGroup className="..." stagger={0.07}>
  <RevealItem key={...}>
    ...
  </RevealItem>
</RevealGroup>

// childVariant (for motion.div items inside RevealGroup):
export const childVariant: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
```

### Animation — Reduced Motion
**Source:** `src/app/[locale]/layout.tsx` line 54
**Apply to:** All `motion.*` usage — global, no per-component action needed
```typescript
<MotionConfig reducedMotion="user">
  {/* all motion elements inside respect prefers-reduced-motion automatically */}
</MotionConfig>
```

### CSS Tokens — No `--success` Variable
**Source:** `src/app/globals.css` full file — verified absent
**Conclusion:** Use Tailwind utility classes for success color:
```typescript
className="text-green-600 dark:text-green-400"
```

---

## No Analog Found

All files in this phase have either direct self-analogs (additive modifications) or close role-match analogs. No files are greenfield without any existing reference.

---

## Sections Confirmed In-Spec (No Changes Needed)

From the UX-12 audit documented in RESEARCH.md:

| Section | Status |
|---|---|
| Hero (`hero.tsx`) | In-spec — `ring-3 ring-ring/50` on both CTAs |
| About (`about.tsx`) | In-spec — no interactive elements |
| FeaturedProjects (`featured-projects-teaser.tsx`) | In-spec — canonical card hover + link pattern |
| Career (`career-timeline.tsx`) | In-spec — Radix Tooltip handles keyboard interaction |
| PersonalProjects (`personal-projects.tsx`) | In-spec — card hover + link patterns correct |
| Contact (`contact.tsx`) | In-spec — all 5 items use `ring-3 ring-ring/50` |

---

## Metadata

**Analog search scope:** `src/components/sections/`, `src/components/ui/`, `src/data/`, `src/app/`, `src/test/`, `public/`
**Files read:** 11 source files
**Pattern extraction date:** 2026-05-13
