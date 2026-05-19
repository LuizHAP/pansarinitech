# Phase 6: MDX Component Toolkit Expansion - Research

**Researched:** 2026-05-19
**Domain:** Next.js RSC MDX components, Tailwind v4 CSS variable tokens, Vitest async RSC test patterns, bilingual i18n with next-intl
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** CodeFilename uses a wrapper pattern — `<CodeFilename filename="src/app/page.tsx">` wraps a fenced code block as children. Renders the filename bar above and passes children through. Existing `pre: PreWithCopyButton` fires naturally on the inner `<pre>`.

**D-02:** Unified block — outer container: `rounded-md overflow-hidden border border-border`. Filename bar: `border-b border-border`. `overflow-hidden` on the outer container clips the inner `<pre>` to the outer border-radius — no radius overrides on children needed.

**D-03:** File icon — `FileIcon` from `lucide-react` (already in the ecosystem) to the left of the filename string.

**D-04:** i18n is aria-label only — filename prop passed as-is (code paths don't translate). Only the screen-reader prefix is localized: `aria-label={${t('codeFilename.ariaPrefix')}: ${filename}}`. EN → "File: src/app/page.tsx", PT → "Arquivo: src/app/page.tsx".

**D-05:** Async RSC — same pattern as `callout.tsx`: `async function`, `getLocale` + `getTranslations` from `next-intl/server`, namespace `'mdx'`. Message key: `mdx.codeFilename.ariaPrefix`.

**D-06:** InlineBadge — custom `<span>` chip, NOT Shadcn `<Badge>`. `<span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ...">`. Renders inline in prose without breaking line height.

**D-07:** 4 semantic variants: `primary`, `secondary`, `muted`, `destructive`. Uses corresponding CSS variable token pairs. WCAG AA required on both Jedi and Sith themes.

**D-08:** `primary` is the default variant.

### Claude's Discretion

- InlineBadge is pure sync RSC — no `getTranslations`, no locale dependency.
- Pipeline prompt update — add "AVAILABLE MDX COMPONENTS" section to `scripts/generate-post-prompt.md` listing all 7 components with description and JSX usage example each. Place after the FRONTMATTER section.
- Message key `mdx.codeFilename.ariaPrefix` goes into the existing `mdx` namespace in both `messages/en.json` and `messages/pt.json`.
- Test pattern for CodeFilename: async RSC, mock `next-intl/server` with `vi.mock` (same pattern as `callout.test.tsx`). Verify: filename string rendered, FileIcon present (aria-hidden), aria-label contains translated prefix + filename. Threshold: 70/60/70/70.
- Test pattern for InlineBadge: pure sync RSC, raw `@testing-library/react`. Verify: renders children, applies correct variant class tokens for each of the 4 variants, defaults to `primary`. Threshold: 70/60/70/70.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MDX-01 | `<CodeFilename>` renders a filename/path label above a fenced code block — bilingual label support via next-intl, WCAG AA contrast on both Jedi and Sith themes | Async RSC pattern verified from `callout.tsx`; CSS tokens from `globals.css` OKLCH palette; `FileIcon` availability confirmed in lucide-react |
| MDX-02 | `<InlineBadge>` renders a small labeled chip inline in prose — 4 variant colors aligned to CSS variable theme tokens (primary, secondary, muted, destructive), WCAG AA compliant | Token structure verified from `globals.css`; secondary token gap identified (see Open Questions); `badge.tsx` destructive pattern shows correct token usage |
| MDX-03 | Both new components registered in `mdxComponents` and accessible in all MDX bodies | `src/components/mdx/index.ts` map structure verified; closed-map invariant documented |
| MDX-04 | `scripts/generate-post-prompt.md` documents all 7 MDX components so OpenAI pipeline uses them | Current prompt structure read; FRONTMATTER section identified as insertion point; all 5 existing components catalogued |
| MDX-05 | New MDX components have Vitest tests at ≥70/60/70/70 in `vitest.config.mts` `COMPONENT_FILES` | `vitest.config.mts` `COMPONENT_FILES` array and `COMPONENT_TARGET` constant verified; async and sync RSC mock patterns confirmed from existing tests |

</phase_requirements>

---

## Summary

Phase 6 is a focused component addition phase. The work is well-bounded: build two new React Server Components, register them in an existing closed map, write Vitest tests following established mock patterns, and update one markdown document. No new dependencies, no new infrastructure, no configuration changes — this phase extends an existing, working pattern.

The implementation uses patterns already established in the codebase. `CodeFilename` follows the async RSC + next-intl pattern from `callout.tsx`. `InlineBadge` follows the pure sync RSC pattern from `stat.tsx`. The test infrastructure (vitest + `vi.mock('next-intl/server')`) is already working for similar async RSC components. All external dependencies (`lucide-react`, `next-intl/server`, `cn()`, Tailwind CSS variable tokens) are already in the project.

One gap requires planner attention: the `--secondary` CSS custom property (used in the CONTEXT D-07 decision for InlineBadge's `secondary` variant) is not defined in `globals.css`. The existing Shadcn Badge and Button components reference `bg-secondary`/`text-secondary-foreground`, but these tokens have no value declared in the project palette. The planner must either add `--secondary` and `--secondary-foreground` token definitions to both `:root` and `.dark` blocks in `globals.css`, or revise the `secondary` variant token choice to use already-defined tokens (e.g., `bg-muted text-muted-foreground`).

**Primary recommendation:** Follow the patterns in `callout.tsx` (async RSC) and `stat.tsx` (sync RSC) exactly. The only novel work is the `secondary` token gap resolution and the pipeline prompt update.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CodeFilename rendering | Frontend Server (RSC) | — | Async RSC reads next-intl translations at request time; no client JS needed |
| InlineBadge rendering | Frontend Server (RSC) | — | Pure sync RSC, no interactivity, no locale dependency |
| mdxComponents registration | Frontend Server (RSC) | — | Consumed by `compileMDX` (next-mdx-remote/rsc) during RSC render pass |
| i18n aria-label (CodeFilename) | Frontend Server (RSC) | — | `getTranslations` from `next-intl/server`; locale resolved server-side |
| WCAG AA contrast (both variants) | CSS / Design tokens | — | Token values in `globals.css` OKLCH palette; no JS involved |
| Pipeline prompt documentation | Static file (scripts/) | — | `scripts/generate-post-prompt.md` is a plain markdown file read by the GitHub workflow |

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lucide-react` | `^1.14.0` | `FileIcon` for CodeFilename bar | Already installed; `FileIcon` confirmed available [VERIFIED: node_modules CJS export] |
| `next-intl` | `^4.11.0` | `getLocale` + `getTranslations` for async RSC | Already installed; same pattern as `callout.tsx` [VERIFIED: codebase] |
| `clsx` + `tailwind-merge` via `cn()` | — | Conditional class merging | Already in `@/lib/utils`; used in all MDX components [VERIFIED: codebase] |
| Tailwind CSS v4 | `^4.2.4` | CSS variable token classes (`text-primary`, `bg-muted`, etc.) | Already in project; all tokens except `secondary` verified in `globals.css` [VERIFIED: codebase] |

**No new packages to install for this phase.**

### Supporting (test-only, already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `4.1.5` | Test runner | All new tests; already configured |
| `@testing-library/react` | `^16.3.2` | DOM assertion for RSC | `render()` for sync; `render(await Component(...))` for async |
| `@vitejs/plugin-react` | `6.0.1` | JSX transform in vitest | Already in `vitest.config.mts` |

---

## Architecture Patterns

### System Architecture Diagram

```
MDX file body
    │
    ▼
compileMDX (next-mdx-remote/rsc)
    │  reads mdxComponents map
    ▼
┌─────────────────────────────────────────────┐
│         mdxComponents (index.ts)            │
│   CodeFilename  ←── async RSC (getTransl.)  │
│   InlineBadge   ←── sync RSC (pure)         │
│   Callout/Note/Warning ←── async RSC        │
│   Stat          ←── sync RSC                │
│   pre: PreWithCopyButton ←── client island  │
└─────────────────────────────────────────────┘
    │
    ▼
React tree rendered server-side
    │  CSS variable tokens applied
    ▼
HTML output (Jedi or Sith theme via .dark class)
```

### Recommended Project Structure

New files to create:
```
src/components/mdx/
├── code-filename.tsx       # NEW — async RSC
├── code-filename.test.tsx  # NEW — async RSC test
├── inline-badge.tsx        # NEW — sync RSC
├── inline-badge.test.tsx   # NEW — sync RSC test
├── index.ts                # UPDATE — register both new components
callout.tsx                 # READ-ONLY reference
stat.tsx                    # READ-ONLY reference
```

Files to update:
```
messages/en.json            # Add mdx.codeFilename.ariaPrefix: "File"
messages/pt.json            # Add mdx.codeFilename.ariaPrefix: "Arquivo"
vitest.config.mts           # Add both new files to COMPONENT_FILES array
scripts/generate-post-prompt.md  # Add AVAILABLE MDX COMPONENTS section
src/app/globals.css         # Add --secondary/--secondary-foreground tokens (if secondary variant is kept)
```

### Pattern 1: Async RSC with next-intl (CodeFilename model)

**What:** Component calls `getLocale` + `getTranslations` from `next-intl/server`. No `"use client"` directive. Function is `async`. The RSC render pipeline awaits it.
**When to use:** When the component needs localized strings (even if just for aria-labels).
**Example (from `callout.tsx` — codebase verified):**
```typescript
// Source: src/components/mdx/callout.tsx [VERIFIED: codebase]
import { getLocale, getTranslations } from 'next-intl/server';

export async function Callout({ type = 'info', children }: Props) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'mdx' });
  // ...
}
```

**CodeFilename implementation shape (from CONTEXT.md decisions):**
```typescript
// Source: CONTEXT.md D-01..D-05 + callout.tsx pattern [VERIFIED: codebase]
import { FileIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export async function CodeFilename({
  filename,
  children,
}: {
  filename: string;
  children: ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'mdx' });

  return (
    <div
      className="rounded-md overflow-hidden border border-border"
      aria-label={`${t('codeFilename.ariaPrefix')}: ${filename}`}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
        <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground font-mono">{filename}</span>
      </div>
      {children}
    </div>
  );
}
```

### Pattern 2: Pure Sync RSC (InlineBadge model)

**What:** Pure function component, no async, no next-intl dependency. Children provided by the MDX author.
**When to use:** When there's nothing to translate at the component level.
**Example (from `stat.tsx` — codebase verified):**
```typescript
// Source: src/components/mdx/stat.tsx [VERIFIED: codebase]
export function Stat({ number, label }: { number: string; label: string }) {
  return (
    <p className="my-6 flex flex-col items-start gap-1">
      <span className="text-4xl font-bold leading-none tracking-tight">{number}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </p>
  );
}
```

**InlineBadge implementation shape (from CONTEXT.md decisions):**
```typescript
// Source: CONTEXT.md D-06..D-08 + stat.tsx pattern [VERIFIED: codebase]
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'muted' | 'destructive';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: 'border-primary/30 text-primary',
  secondary: 'bg-secondary text-secondary-foreground',   // ⚠ see Open Questions
  muted: 'border-border text-muted-foreground',
  destructive: 'border-destructive/30 text-destructive',
};

export function InlineBadge({
  variant = 'primary',
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        VARIANT_STYLES[variant],
      )}
    >
      {children}
    </span>
  );
}
```

### Pattern 3: Async RSC Test Mock

**What:** In jsdom, async RSC components cannot be awaited by RTL render. Pattern: call the async function directly, `await` it, then pass the resolved JSX to `render()`.
**Example (from `callout.test.tsx` — codebase verified):**
```typescript
// Source: src/components/mdx/callout.test.tsx [VERIFIED: codebase]
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    if (key === 'codeFilename.ariaPrefix') return 'File';
    return key;
  }),
}));

// In each test:
const jsx = await CodeFilename({ filename: 'src/app/page.tsx', children: <pre /> });
const { getByRole } = render(jsx);
```

### Pattern 4: Sync RSC Test (no mock needed)

**What:** Call the component as a plain function, pass result to `render()`.
**Example (from `stat.test.tsx` — codebase verified):**
```typescript
// Source: src/components/mdx/stat.test.tsx [VERIFIED: codebase]
import { render } from '@testing-library/react';
import { Stat } from './stat';

const { container } = render(Stat({ number: '47', label: 'engineers onboarded' }));
const numberSpan = container.querySelector('.text-4xl');
expect(numberSpan).toBeInTheDocument();
```

### Pattern 5: mdxComponents Registration

**What:** Closed map in `src/components/mdx/index.ts`. Only named keys are MDX-callable. Security invariant: do not open the map.
**Example (from `index.ts` — codebase verified):**
```typescript
// Source: src/components/mdx/index.ts [VERIFIED: codebase]
export const mdxComponents = {
  Callout,
  Note,
  Warning,
  Stat,
  pre: PreWithCopyButton,
  // ADD:
  CodeFilename,
  InlineBadge,
};
```

### Anti-Patterns to Avoid

- **Using `importOriginal` for `next-intl` in async RSC tests:** Not needed here. Only needed when `vi.mock('next-intl')` is used (the non-server module) — `callout.test.tsx` mocks `next-intl/server` directly and does NOT need `importOriginal`. [VERIFIED: codebase]
- **`"use client"` on CodeFilename:** Both new components are pure RSC. Adding `"use client"` would break `getTranslations` usage.
- **Shadcn `<Badge>` component for InlineBadge:** Shadcn Badge is a `<div>` by default; would break inline prose flow. Decision D-06 explicitly chose a custom `<span>`.
- **Wrapping InlineBadge in a `<NextIntlClientProvider>` in tests:** InlineBadge has no locale dependency. Using `renderWithLocale` would add unnecessary overhead.
- **Adding `CodeFilename` or `InlineBadge` to the `pre:` override slot:** `pre:` is reserved for `PreWithCopyButton`. The `CodeFilename` wrapper owns the outer container; the inner `<pre>` triggers `PreWithCopyButton` naturally.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS class merging | Custom merge logic | `cn()` from `@/lib/utils` | Already wraps `clsx` + `tailwind-merge`; handles Tailwind v4 conflict resolution |
| i18n string lookup | Custom translation function | `getTranslations` from `next-intl/server` | Type-safe; integrates with locale routing; already in project |
| Async RSC test mock | Custom Vitest plugin | `vi.mock('next-intl/server', ...)` pattern | Already proven in `callout.test.tsx` |
| Icon assets | Custom SVG file | `FileIcon` from `lucide-react` | Tree-shakable; already used in codebase; matches design system |
| Per-component contrast tokens | Hand-coded hex values | CSS variable tokens in `globals.css` | Automatic Jedi/Sith theme swap; WCAG AA already verified for project palette |

**Key insight:** This phase contains zero novel infrastructure. Every pattern, tool, and token already exists in the project. The risk surface is in the CSS token gap (secondary) and getting the async RSC mock right for CodeFilename tests.

---

## Common Pitfalls

### Pitfall 1: `vi.mock` placement before imports
**What goes wrong:** `vi.mock('next-intl/server', ...)` is placed after the component import — the mock doesn't intercept because `vi.mock` is hoisted by Vitest to the top of the file.
**Why it happens:** Forgetting that Vitest hoists `vi.mock` calls regardless of source order.
**How to avoid:** Always put `vi.mock(...)` before the component import, OR just know the hoisting happens automatically and write tests as `callout.test.tsx` does. [VERIFIED: codebase pattern]
**Warning signs:** Tests pass in isolation but fail when run as a group; `getTranslations` throws "not in RSC context".

### Pitfall 2: `overflow-hidden` interaction with rehype-pretty-code figure
**What goes wrong:** `CodeFilename`'s outer `overflow-hidden` clips the `[data-rehype-pretty-code-figure]` element's horizontal scroll, breaking long code lines on iPhone SE.
**Why it happens:** `globals.css` Phase 3 rule (`[data-rehype-pretty-code-figure] pre { overflow-x: auto; }`) expects the figure to be able to scroll. `overflow-hidden` on a parent clips all child overflow.
**How to avoid:** Apply `overflow-hidden` for border-radius clipping, but ensure the `pre` inside can still scroll horizontally. The safest approach: use `overflow-hidden` only for `border-radius` clipping on the container corners, but allow the `pre` child to have `overflow-x: auto`. Since `overflow-hidden` would clip horizontal scroll too, **use `rounded-md` on the outer div but only set `overflow-hidden` if the inner `pre` doesn't need to scroll** — or apply `overflow-x: clip` instead of `overflow: hidden`. [ASSUMED: based on CSS cascade knowledge; verify by rendering on 375px viewport]
**Warning signs:** Long code lines inside `<CodeFilename>` are clipped and cannot scroll horizontally on mobile.

### Pitfall 3: `--secondary` token undefined
**What goes wrong:** InlineBadge `secondary` variant uses `bg-secondary text-secondary-foreground`, but `--secondary` CSS custom property is not defined in `globals.css`. The badge renders with a transparent/invisible background.
**Why it happens:** `globals.css` defines only the tokens it lists in `@theme inline`. `--secondary` is absent. Shadcn Badge and Button reference it but the token was never added to this project's palette.
**How to avoid:** Before implementing InlineBadge, add `--secondary` and `--secondary-foreground` values to both `:root` and `.dark` blocks in `globals.css`, OR revise the `secondary` variant to use `bg-muted text-muted-foreground` (which IS defined). [VERIFIED: globals.css audit]
**Warning signs:** `secondary` variant InlineBadge is invisible or has no background in browser.

### Pitfall 4: mdxComponents key case sensitivity
**What goes wrong:** MDX component names are case-sensitive. If `CodeFilename` is registered as `codeFilename`, the MDX author using `<CodeFilename>` gets an error.
**Why it happens:** JSX requires PascalCase for custom components; lowercase are treated as native HTML elements.
**How to avoid:** Register as `CodeFilename` and `InlineBadge` (PascalCase) in the map. [VERIFIED: existing components use PascalCase — `Callout`, `Note`, `Warning`, `Stat`]
**Warning signs:** MDX bodies render nothing (or a native HTML fallback) for the new components.

### Pitfall 5: WCAG AA contrast on Sith theme for `primary` InlineBadge
**What goes wrong:** `text-primary` in Sith (dark) theme = `oklch(54% 0.21 28)` (saber red) against the `background` (`oklch(10% 0.01 250)`) achieves ~5:1 contrast. But the inline prose context uses `foreground` background color in typography. Verify contrast against `prose` `<p>` background, not just `background`.
**Why it happens:** In `@tailwindcss/typography` prose, `p` elements have the page background — which is `background` in this project. So the contrast is `text-primary` vs `background`. The Sith primary was verified at 5:1 against pure white and ~5:1 against near-black. Against the Sith background (`oklch 10%`) the contrast should be adequate for red text.
**How to avoid:** The Sith red was already WCAG-verified (see `globals.css` comments, axe-core CI). The `destructive` dark variant is `oklch(65% 0.22 28)` — also verify this specifically against prose background. [VERIFIED: globals.css comments confirm Sith primary verification history]
**Warning signs:** axe-core Playwright tests fail with contrast violations on InlineBadge variants.

---

## Code Examples

Verified patterns from official sources:

### Async RSC mock pattern for next-intl/server
```typescript
// Source: src/components/mdx/callout.test.tsx [VERIFIED: codebase]
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    if (key === 'codeFilename.ariaPrefix') return 'File';
    return key;
  }),
}));

import { render } from '@testing-library/react';
import { CodeFilename } from './code-filename';

it('renders filename string with FileIcon and correct aria-label', async () => {
  const jsx = await CodeFilename({
    filename: 'src/app/page.tsx',
    children: <pre>code</pre>,
  });
  const { getByText, container } = render(jsx);
  expect(getByText('src/app/page.tsx')).toBeInTheDocument();
  // aria-hidden FileIcon: check for svg element
  const svg = container.querySelector('svg[aria-hidden="true"]');
  expect(svg).toBeInTheDocument();
  // container wrapping div should have aria-label with translated prefix
  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper.getAttribute('aria-label')).toBe('File: src/app/page.tsx');
});
```

### InlineBadge variant test pattern
```typescript
// Source: src/components/mdx/stat.test.tsx pattern [VERIFIED: codebase]
import { render } from '@testing-library/react';
import { InlineBadge } from './inline-badge';

it('applies primary variant classes by default', () => {
  const { container } = render(InlineBadge({ children: 'label' }));
  const span = container.querySelector('span');
  expect(span?.className).toContain('text-primary');
  expect(span?.className).toContain('border-primary');
});

it('applies muted variant classes', () => {
  const { container } = render(InlineBadge({ variant: 'muted', children: 'label' }));
  const span = container.querySelector('span');
  expect(span?.className).toContain('text-muted-foreground');
});
```

### vitest.config.mts COMPONENT_FILES addition
```typescript
// Source: vitest.config.mts [VERIFIED: codebase]
// Add to COMPONENT_FILES array:
'src/components/mdx/code-filename.tsx',
'src/components/mdx/inline-badge.tsx',
// Both use COMPONENT_TARGET (70/60/70/70) — no override needed
```

### messages/en.json mdx namespace addition
```json
// Source: messages/en.json existing mdx namespace [VERIFIED: codebase]
"mdx": {
  "callout": { "info": "Note:", "warn": "Warning:", "error": "Error:" },
  "copyCode": { "button": "Copy code", "success": "Code copied", "error": "Couldn't copy — please use Cmd+C" },
  "toc": { "label": "Contents" },
  "codeFilename": { "ariaPrefix": "File" }
}
```

### messages/pt.json mdx namespace addition
```json
// Source: messages/pt.json existing mdx namespace [VERIFIED: codebase]
"mdx": {
  "callout": { "info": "Nota:", "warn": "Aviso:", "error": "Erro:" },
  "copyCode": { "button": "Copiar código", "success": "Código copiado", "error": "Não foi possível copiar — use Cmd+C" },
  "toc": { "label": "Conteúdo" },
  "codeFilename": { "ariaPrefix": "Arquivo" }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `"use client"` wrapper for all interactive MDX | Server-first: async RSC unless client interactivity needed | Phase 3 | CodeFilename and InlineBadge stay server-only |
| `gray-matter` + custom MDX parsing | `next-mdx-remote/rsc` `compileMDX` | Phase 3 | mdxComponents map is the integration point |
| Open component map (any component usable in MDX) | Closed map (T-03-01 security mitigation) | Phase 3 | New components must be explicitly registered |
| Tailwind `.config.js` | `@theme inline` in `globals.css` (CSS-first v4) | Phase 1 | Token names like `text-primary` map to CSS vars |

**No deprecated patterns in play for this phase.**

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `overflow-hidden` on CodeFilename outer div may clip horizontal scroll of nested `pre` | Common Pitfalls #2 | Long code lines clipped on mobile; need to test on 375px viewport |
| A2 | `secondary` CSS custom property being undefined causes `bg-secondary` to render as transparent | Common Pitfalls #3 / Open Questions | If Tailwind v4 somehow provides a fallback, the pitfall is moot — but audit confirms no definition in `globals.css` |

---

## Open Questions (RESOLVED)

1. **`--secondary` token missing from globals.css**
   - What we know: `globals.css` does not define `--secondary` or `--secondary-foreground`. The `@theme inline` block maps only `background`, `foreground`, `primary`, `primary-foreground`, `card`, `card-foreground`, `muted`, `muted-foreground`, `border`, `input`, `ring`, `destructive`, `accent`, `accent-foreground`, `popover`, `popover-foreground`. No `secondary`.
   - What's unclear: CONTEXT.md D-07 specifies the `secondary` InlineBadge variant uses `bg-secondary text-secondary-foreground`. Without the CSS variable, this renders as transparent/invisible. Whether to: (a) add `--secondary` tokens to `globals.css` for both Jedi and Sith, or (b) replace the secondary variant with existing token classes (`bg-muted text-muted-foreground`).
   - Recommendation: Option (b) is safer — it keeps the palette consistent without needing to define and WCAG-verify new color values. Use `bg-muted text-muted-foreground` for the `secondary` variant, which uses already-verified tokens. If option (a) is chosen, add token definitions to `globals.css` before implementing InlineBadge and run axe-core to verify WCAG AA.
   - **RESOLVED:** Option (b) adopted — InlineBadge `secondary` variant uses `bg-muted text-muted-foreground` (D-09 in CONTEXT.md supersedes D-07's secondary token pair). This keeps the palette consistent with verified tokens; `bg-secondary` is undefined in `globals.css` and would render transparent.

2. **`overflow-hidden` vs horizontal scroll for CodeFilename**
   - What we know: CONTEXT.md D-02 specifies `overflow-hidden` on the outer container for border-radius clipping. `globals.css` Phase 3 sets `[data-rehype-pretty-code-figure] pre { overflow-x: auto }` for mobile scroll.
   - What's unclear: Whether `overflow-hidden` on the CodeFilename wrapper clips the horizontal scroll of the `rehype-pretty-code` `<pre>` child.
   - Recommendation: Test on a 375px viewport. If clipping occurs, replace `overflow-hidden` with `overflow-x-clip` (CSS `overflow-x: clip` clips visual overflow without affecting scroll containers) or wrap the inner content in a separate container. Alternative: use only `rounded-md` on the outer div without `overflow-hidden`, and apply `rounded-none` overrides to the child `pre` if needed.
   - **RESOLVED:** Accept D-02 `overflow-hidden` as planned. Executor must test on a 375px viewport during execution — if horizontal scroll is clipped, apply `overflow-x-clip` fallback per recommendation above.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code changes (new component files, message JSON additions, test files, one markdown document update). No external CLI tools, services, or runtimes beyond the already-running project stack.

Pre-conditions verified:
- `pnpm test:unit` — 229 tests passing [VERIFIED: ran locally]
- `lucide-react` `FileIcon` — confirmed available [VERIFIED: node_modules CJS export]
- `next-intl` `4.11.0` — installed [VERIFIED: package.json]
- `vitest` `4.1.5` — installed [VERIFIED: package.json]
- `COMPONENT_TARGET` constant (`{ statements: 70, branches: 60, functions: 70, lines: 70 }`) — confirmed in `vitest.config.mts` [VERIFIED: codebase]

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes (closed mdxComponents map) | Closed map invariant — do NOT add `{ ...mdxComponents, ...anyExternalMap }` pattern |
| V5 Input Validation | yes (filename prop) | `filename` is always a string from MDX frontmatter/authoring — no user-supplied input at runtime; no sanitization needed beyond TypeScript types |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| MDX component injection via open map | Tampering / Elevation | Closed `mdxComponents` map — only explicitly registered components are MDX-callable (T-03-01, Phase 3 decision) |
| XSS via `filename` prop | Tampering | `filename` is rendered as JSX children (React escapes strings by default). No `dangerouslySetInnerHTML`. |

---

## Sources

### Primary (HIGH confidence)
- `src/components/mdx/callout.tsx` — async RSC + next-intl pattern [VERIFIED: codebase read]
- `src/components/mdx/stat.tsx` — sync RSC pattern [VERIFIED: codebase read]
- `src/components/mdx/callout.test.tsx` — async RSC mock pattern with `vi.mock('next-intl/server')` [VERIFIED: codebase read]
- `src/components/mdx/stat.test.tsx` — sync RSC test pattern [VERIFIED: codebase read]
- `src/components/mdx/index.ts` — closed mdxComponents map structure [VERIFIED: codebase read]
- `src/components/mdx/pre-with-copy-button.tsx` — `group relative` outer div pattern [VERIFIED: codebase read]
- `src/app/globals.css` — OKLCH CSS variable token palette; absence of `--secondary` confirmed [VERIFIED: codebase read]
- `messages/en.json` + `messages/pt.json` — existing `mdx` namespace structure [VERIFIED: codebase read]
- `vitest.config.mts` — `COMPONENT_FILES` array, `COMPONENT_TARGET` constant [VERIFIED: codebase read]
- `vitest.setup.ts` — existing jsdom stubs (no additional stubs needed) [VERIFIED: codebase read]
- `scripts/generate-post-prompt.md` — existing prompt structure; FRONTMATTER section as insertion point [VERIFIED: codebase read]
- `package.json` — `lucide-react ^1.14.0`, `next-intl ^4.11.0`, `vitest 4.1.5` [VERIFIED: codebase read]
- `node_modules/lucide-react` — `FileIcon` export confirmed [VERIFIED: node CJS require]
- Test run — 229 tests, 34 files, all passing [VERIFIED: `pnpm test:unit` ran]

### Secondary (MEDIUM confidence)
- `src/components/ui/badge.tsx` — destructive variant token pattern (`bg-destructive/10 text-destructive`) — cross-reference for InlineBadge destructive variant [VERIFIED: codebase read]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions verified from package.json
- Architecture patterns: HIGH — patterns directly lifted from existing working components
- Pitfalls: HIGH (token gap: VERIFIED) / MEDIUM (overflow-hidden scroll interaction: ASSUMED, needs viewport test)
- Test patterns: HIGH — callout.test.tsx and stat.test.tsx are working reference implementations

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable — no external dependencies changing in this phase)
