# Phase 5: Test Coverage Sweep - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 5-test-coverage-sweep
**Areas discussed:** pre-with-copy-button depth, json-ld.tsx 100% scope

---

## pre-with-copy-button depth

### Test interaction strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Full behavioral | Mock clipboard + toast, simulate click, verify state — covers extractCodeText branches and full flow | ✓ |
| Smoke + logic split | Render + aria-label via RTL. Extract extractCodeText as separate unit test. No clipboard mock. | |

**User's choice:** Full behavioral

---

### Mock strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Sonner + clipboard | `vi.mock('sonner')` + `vi.stubGlobal` for `navigator.clipboard.writeText`. Established pattern from copy-email-button.test.tsx. | ✓ |
| Clipboard only | Don't mock sonner — toast will be no-op in jsdom naturally. | |

**User's choice:** Sonner + clipboard (recommended)

---

### Coverage threshold

| Option | Description | Selected |
|--------|-------------|----------|
| 70/60/70/70 (standard) | Consistent with other components. 60% branch floor accommodates unreachable clipboard-unavailable edges. | ✓ |
| 100/80/100/100 (strict) | Requires testing clipboard-unavailable fallback (secure context). More work. | |

**User's choice:** 70/60/70/70 (standard component threshold)

---

## json-ld.tsx 100% scope

### What to include in tests

| Option | Description | Selected |
|--------|-------------|----------|
| Script tag (mandatory) | Render + verify `type="application/ld+json"` + JSON content in script tag | ✓ |
| XSS escape `<` → `<` | Render schema with `<` and verify it doesn't appear raw. Documents security intent. | ✓ |
| Exports AUTHOR_PERSON + SITE_URL | Import and assert AUTHOR_PERSON shape. Verify SITE_URL is a string. | ✓ |

**User's choice:** All three

---

### Render approach

| Option | Description | Selected |
|--------|-------------|----------|
| RTL render direto | `import { render } from '@testing-library/react'` (no locale wrapper). JsonLd has no next-intl or context deps. Simpler. | ✓ |
| Chamar como função síncrona | Call `JsonLd({ schema })` directly without RTL and inspect JSX. | |

**User's choice:** RTL render direto (recommended)

---

## Claude's Discretion

- **Async RSC mock strategy** (callout.tsx, post-card.tsx, note.tsx, warning.tsx): `vi.mock('next-intl/server', ...)` pattern — user did not discuss, left to Claude.
- **toc-mobile.tsx, toc-sidebar.tsx, stat.tsx**: Pure sync server components — raw RTL render, left to Claude.
- **personal-projects.tsx**: Config-only change (add to COMPONENT_FILES) — user did not discuss.
- **coverage config granularity**: json-ld.tsx goes into LIB_DATA_FILES for PURE_100, not COMPONENT_FILES — left to Claude.

## Deferred Ideas

None — discussion stayed within Phase 5 scope.
