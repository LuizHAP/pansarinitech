---
plan: 06-01
phase: 06-mdx-component-toolkit-expansion
status: completed
completed_at: "2026-05-19"
---

# Plan 06-01 Summary — CodeFilename + InlineBadge Components

## What Was Built

**Task 1: CodeFilename async RSC**
- Created `src/components/mdx/code-filename.tsx` following `callout.tsx` pattern exactly
- Async RSC: `getLocale()` + `getTranslations({ locale, namespace: 'mdx' })` from `next-intl/server`
- Outer div: `rounded-md overflow-hidden border border-border` with `aria-label={t('codeFilename.ariaPrefix')}: ${filename}}`
- Filename bar: `bg-muted/50 px-4 py-2` with `FileIcon` (aria-hidden) + mono span
- Children passed through directly (no extra wrapper)
- Added `"codeFilename": { "ariaPrefix": "File" }` to `messages/en.json`
- Added `"codeFilename": { "ariaPrefix": "Arquivo" }` to `messages/pt.json`

**Task 2: InlineBadge sync RSC**
- Created `src/components/mdx/inline-badge.tsx` following `stat.tsx` pattern
- Pure sync RSC, no `next-intl` dependency
- 4 variants via `VARIANT_STYLES` record: `primary`, `secondary`, `muted`, `destructive`
- `secondary` uses `bg-muted text-muted-foreground` (NOT `bg-secondary` — token undefined in globals.css per D-09)
- Renders `<span>` (inline-safe, doesn't break line height)

**Registration:**
- Updated `src/components/mdx/index.ts`: imports + exports `CodeFilename` and `InlineBadge`, added both to `mdxComponents` closed map

## Verification

- `pnpm tsc --noEmit` — exits 0 ✓
- `CodeFilename` appears 4× in `index.ts` (import, map key, named export) ✓
- `InlineBadge` appears 4× in `index.ts` ✓
- `codeFilename` key in both message files ✓
- `bg-secondary` count in `inline-badge.tsx` = 0 ✓

## Decisions Applied

- D-01 through D-05: CodeFilename wrapper pattern, unified block, FileIcon, async RSC, aria-label i18n only
- D-06 through D-09: InlineBadge custom span, 4 variants, primary default, secondary token override
- T-06-01: Closed map maintained (no dynamic keys)
- T-06-02: filename prop rendered via JSX text (React escapes HTML entities)
- T-06-03: BadgeVariant union type enforced at compile time
