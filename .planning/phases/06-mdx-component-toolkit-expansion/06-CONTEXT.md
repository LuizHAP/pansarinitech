# Phase 6: MDX Component Toolkit Expansion - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build two new MDX components (`CodeFilename` and `InlineBadge`), register both in the `mdxComponents` map, write Vitest tests for both at the 70/60/70/70 threshold, and update `scripts/generate-post-prompt.md` to document all 7 MDX components so the OpenAI pipeline can reference them in generated posts.

Does NOT include authoring the blog post (Phase 7), changing existing component behavior, or any SEO work.

</domain>

<decisions>
## Implementation Decisions

### CodeFilename — authoring shape
- **D-01:** **Wrapper pattern** — `<CodeFilename filename="src/app/page.tsx">` wraps a fenced code block as children. The component renders the filename bar above and passes children through. The existing `pre: PreWithCopyButton` override in `mdxComponents` fires naturally on the inner `<pre>` — no conflict, no special handling needed.

### CodeFilename — visual structure
- **D-02:** **Unified block** — outer container gets `rounded-md overflow-hidden border border-border`. The filename bar gets `border-b border-border`. `overflow-hidden` on the outer container clips the inner `<pre>` block to the outer border-radius automatically — no radius overrides on children needed.
- **D-03:** **File icon + path** — `FileIcon` from `lucide-react` (already imported in `callout.tsx`) to the left of the filename string. Same icon set, no new dependency.

### CodeFilename — i18n
- **D-04:** **aria-label only** — the filename prop is always passed as-is (code paths don't translate). Only the screen-reader prefix gets localized: `aria-label={${t('codeFilename.ariaPrefix')}: ${filename}}`. Example: EN → "File: src/app/page.tsx", PT → "Arquivo: src/app/page.tsx".
- **D-05:** **Async RSC** — same pattern as `callout.tsx`: `async function`, `getLocale` + `getTranslations` from `next-intl/server`, namespace `'mdx'`. Message key: `mdx.codeFilename.ariaPrefix` in both `messages/en.json` and `messages/pt.json`.

### InlineBadge — anatomy
- **D-06:** **Custom `<span>` chip** — NOT Shadcn `<Badge>`. A thin custom component: `<span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ...">`. Renders inline in prose without breaking line height. Shadcn `<Badge>` is `<div>` by default and would require `asChild` wrapping to be inline-safe.
- **D-07:** **4 semantic variants**: `primary`, `secondary`, `muted`, `destructive` — matches MDX-02 spec exactly. Each variant uses the corresponding CSS variable token pair (`text-primary border-primary/30`, `text-secondary-foreground bg-secondary`, `text-muted-foreground border-border`, `text-destructive border-destructive/30`). WCAG AA contrast required on both Jedi (light) and Sith (dark) themes.
- **D-08:** `primary` is the default variant (no `variant` prop required for the common case).
- **D-09:** **`secondary` variant token override** — `--secondary` is not defined in `globals.css` (the `@theme inline` block has no `secondary` entry), so `bg-secondary text-secondary-foreground` specified in D-07 would render transparent. The `secondary` variant MUST use `bg-muted text-muted-foreground` instead. This supersedes D-07's secondary token pair only; all other D-07 variant tokens remain unchanged.

### Claude's Discretion
- **InlineBadge is pure sync RSC** — no `getTranslations`, no locale dependency. The label content is always provided by the author as `children`; nothing to translate at the component level.
- **Pipeline prompt update** — add a structured "AVAILABLE MDX COMPONENTS" section to `scripts/generate-post-prompt.md` listing all 7 components (Callout, Note, Warning, Stat, PreWithCopyButton is implicit via `pre`, CodeFilename, InlineBadge) with a short description and a JSX usage example each. Place this section after the FRONTMATTER section so the model sees it before writing the body.
- **message key placement** — `mdx.codeFilename.ariaPrefix` goes into the existing `mdx` namespace in both `messages/en.json` and `messages/pt.json` (alongside `mdx.callout.*` and `mdx.copyCode.*` keys already there).
- **Test pattern for CodeFilename** — async RSC, mock `next-intl/server` with `vi.mock` (same pattern as `callout.test.tsx`). Verify: filename string rendered, FileIcon present (aria-hidden), aria-label contains the translated prefix + filename. Threshold: 70/60/70/70 (`COMPONENT_TARGET`).
- **Test pattern for InlineBadge** — pure sync RSC, raw `@testing-library/react` (no locale wrapper). Verify: renders children, applies correct variant class tokens for each of the 4 variants, defaults to `primary`. Threshold: 70/60/70/70.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing MDX components (patterns to follow)
- `src/components/mdx/callout.tsx` — Async RSC template: `getLocale` + `getTranslations`, lucide icon, CSS variable tokens. `CodeFilename` follows this pattern.
- `src/components/mdx/stat.tsx` — Sync RSC template: pure function, no deps. `InlineBadge` follows this pattern.
- `src/components/mdx/pre-with-copy-button.tsx` — Client island pattern. `CodeFilename` wraps this — understanding the `group relative` outer div is important.
- `src/components/mdx/index.ts` — `mdxComponents` map. Both new components get registered here.

### i18n message files
- `messages/en.json` — Add `mdx.codeFilename.ariaPrefix: "File"`. Check existing `mdx.callout.*` and `mdx.copyCode.*` keys for namespace structure.
- `messages/pt.json` — Add `mdx.codeFilename.ariaPrefix: "Arquivo"`.

### Test infrastructure
- `src/components/mdx/callout.test.tsx` — Async RSC mock pattern for `next-intl/server`. Reference for `CodeFilename` tests.
- `src/components/mdx/stat.test.tsx` — Pure sync RSC test pattern. Reference for `InlineBadge` tests.
- `vitest.config.mts` — `COMPONENT_FILES` array. Both new files (`code-filename.tsx`, `inline-badge.tsx`) must be added here at `COMPONENT_TARGET` (70/60/70/70).
- `vitest.setup.ts` — jsdom stubs. Extend here if new stubs are needed.

### Requirements
- `.planning/REQUIREMENTS.md` — MDX-01 through MDX-05 (component specs, registration, pipeline prompt, test coverage).

### Pipeline prompt
- `scripts/generate-post-prompt.md` — Current prompt for the OpenAI automated pipeline. MDX-04 requires adding an "AVAILABLE MDX COMPONENTS" section documenting all 7 components.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lucide-react` `FileIcon` — for `CodeFilename` filename bar
- `lucide-react` `Info`, `AlertTriangle`, `XCircle` — already imported in Callout; `FileIcon` follows same usage pattern
- `cn()` from `@/lib/utils` — already used in Callout for conditional class merging; use in both new components
- `src/test/render.tsx` `renderWithLocale` — for client component tests (not needed here — both new components are RSC/sync)

### Established Patterns
- **Async RSC with next-intl:** `async function`, `getLocale + getTranslations({ locale, namespace: 'mdx' })` — used in `callout.tsx` and `post-card.tsx`. CodeFilename follows this.
- **Closed `mdxComponents` map:** Only listed components are MDX-callable (T-03-01 mitigation). Add both new names; do NOT open the map.
- **CSS variable token pairs:** `border-primary/30 text-primary` (info/primary), `text-muted-foreground border-border` (muted), `text-destructive border-destructive/30` (destructive) — used in Callout's `STYLES` record. Extend same tokens for InlineBadge variants.
- **`overflow-hidden` for radius clipping:** Standard Tailwind pattern for nested rounded elements. `CodeFilename` outer div handles all radius; children don't need their own rounding.

### Integration Points
- `src/components/mdx/index.ts` — Register `CodeFilename` and `InlineBadge` in `mdxComponents` and re-export
- `vitest.config.mts` `COMPONENT_FILES` — Add both new component files
- `messages/en.json` + `messages/pt.json` — Add `mdx.codeFilename.ariaPrefix`
- `scripts/generate-post-prompt.md` — Add "AVAILABLE MDX COMPONENTS" section

</code_context>

<specifics>
## Specific Ideas

- `CodeFilename` filename bar background should use `bg-muted/50` (matches rehype-pretty-code's typical code block header styling — consistent with the Shiki theme already in use).
- `InlineBadge` `secondary` variant: use `bg-secondary text-secondary-foreground` (Shadcn's secondary tokens) rather than a border-only approach — gives better visual weight for secondary labels inline in prose.
- For the pipeline prompt update, list components in usage-frequency order: Callout → Note → Warning → CodeFilename → InlineBadge → Stat → (note that `pre` copy button is automatic, no explicit import needed).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 6-mdx-component-toolkit-expansion*
*Context gathered: 2026-05-19*
