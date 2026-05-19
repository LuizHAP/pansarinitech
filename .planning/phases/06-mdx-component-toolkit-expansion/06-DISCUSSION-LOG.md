# Phase 6: MDX Component Toolkit Expansion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 06-mdx-component-toolkit-expansion
**Areas discussed:** CodeFilename shape, InlineBadge base, CodeFilename i18n scope

---

## CodeFilename Shape

### Authoring pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Wrapper | `<CodeFilename filename="...">` wraps fenced code block as children | ✓ |
| Standalone label | `<CodeFilename filename="..." />` placed before a code block — two separate elements | |
| rehype plugin | Meta string extraction at build time — no MDX component needed | |

**User's choice:** Wrapper
**Notes:** PreWithCopyButton fires naturally on the inner `<pre>` — no conflict.

### Visual structure

| Option | Description | Selected |
|--------|-------------|----------|
| Unified block | Shared outer border, `overflow-hidden` clips inner pre to outer radius | ✓ |
| Separate bar above | Distinct element with its own rounded borders, small gap above code block | |

**User's choice:** Unified block

### File icon

| Option | Description | Selected |
|--------|-------------|----------|
| File icon + path | `FileIcon` from lucide-react to the left of the filename | ✓ |
| Plain text only | Just the filename string | |

**User's choice:** File icon + path

---

## InlineBadge Base

### Component base

| Option | Description | Selected |
|--------|-------------|----------|
| Custom `<span>` chip | Thin custom component, inline-safe, no Shadcn dependency wrapping needed | ✓ |
| Shadcn `<Badge>` | Reuse installed Badge, requires `asChild` + `<span>` child to be inline-safe | |

**User's choice:** Custom `<span>` chip

### Variant set

| Option | Description | Selected |
|--------|-------------|----------|
| 4 semantic variants | primary, secondary, muted, destructive — matches MDX-02 spec | ✓ |
| primary + muted only | Smaller surface area, add more later | |

**User's choice:** 4 semantic variants (primary, secondary, muted, destructive)

---

## CodeFilename i18n Scope

### What gets translated

| Option | Description | Selected |
|--------|-------------|----------|
| aria-label only | Filename as-is; only the screen-reader prefix is localized | ✓ |
| Optional translated title | Author can pass a `title` prop alongside `filename` | |
| No i18n | Pure sync RSC — no getTranslations, filename always the same | |

**User's choice:** aria-label only

### Implementation pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Async RSC with getTranslations | Same pattern as Callout — message key in `mdx` namespace | ✓ |
| Sync RSC with getLocale only | Static prefix record keyed by locale | |

**User's choice:** Async RSC with getTranslations

---

## Claude's Discretion

- **InlineBadge is pure sync RSC** — no locale dependency; label content is always author-provided children
- **Pipeline prompt update format** — "AVAILABLE MDX COMPONENTS" section with usage examples, placed after FRONTMATTER section
- **Message key placement** — `mdx.codeFilename.ariaPrefix` in existing `mdx` namespace alongside `mdx.callout.*` and `mdx.copyCode.*`
- **Test patterns** — CodeFilename: async RSC mock (`vi.mock('next-intl/server')`); InlineBadge: raw RTL

## Deferred Ideas

None — discussion stayed within phase scope.
