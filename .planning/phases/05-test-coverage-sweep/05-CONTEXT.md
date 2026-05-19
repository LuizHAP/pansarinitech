# Phase 5: Test Coverage Sweep - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand `vitest.config.mts` coverage scope to every component currently at zero coverage: five MDX components, `json-ld.tsx`, three blog-layer components, and `personal-projects.tsx`. Write tests for each file and ensure `pnpm test:coverage` exits 0 with all per-file thresholds passing.

Does NOT include building new components, changing component behavior, or migrating the test framework.

</domain>

<decisions>
## Implementation Decisions

### pre-with-copy-button.tsx test strategy
- **D-01:** Use **full behavioral testing** — simulate a click on the copy button, assert `navigator.clipboard.writeText` was called with the extracted code text, and verify the `✓` icon appears after copying.
- **D-02:** Mock both `sonner` (`vi.mock('sonner')`) and `navigator.clipboard.writeText` (`vi.stubGlobal`) — follow the pattern established in `copy-email-button.test.tsx`.
- **D-03:** Threshold stays at **70/60/70/70** (standard component). The 60% branch floor accommodates unreachable clipboard-unavailable edge cases without requiring secure-context simulation.

### json-ld.tsx test scope (100/100/100/100 required)
- **D-04:** Render with raw `@testing-library/react` (no locale wrapper) — `JsonLd` has no `next-intl` or context dependency.
- **D-05:** Test suite MUST cover three behaviors:
  1. Rendered `<script>` tag has `type="application/ld+json"` and inner HTML matching `JSON.stringify(schema)`.
  2. A schema containing `<` has the character replaced with `<` in the output (XSS escape behavior — documents security intent).
  3. Exported constants: `AUTHOR_PERSON` shape (`@type: 'Person'`, `name: 'Luiz Pansarini'`) and `SITE_URL` is a non-empty string.

### Claude's Discretion
- **Async RSC mock strategy** (callout.tsx, post-card.tsx): Use `vi.mock('next-intl/server', () => ({ getLocale: vi.fn().mockResolvedValue('en'), getTranslations: vi.fn().mockResolvedValue((key: string) => key) }))` — same module-mock pattern used in `easter-egg.test.tsx` for `next/script`. Threshold 70/60/70/70; no need for 100%.
- **toc-mobile.tsx, toc-sidebar.tsx, stat.tsx**: Pure sync server components with no async or context. Render with raw `@testing-library/react`, assert the rendered output matches props. 70/60/70/70.
- **note.tsx, warning.tsx**: Thin Callout aliases. Render with mocked `next-intl/server` (same mock as callout). Assert the correct type/icon class is applied.
- **personal-projects.tsx**: Already has adequate tests. Just add `'src/components/sections/personal-projects.tsx'` to `COMPONENT_FILES` in `vitest.config.mts`. No new tests needed unless coverage gaps emerge.
- **coverage config granularity**: All new files use `COMPONENT_TARGET` (70/60/70/70) except `json-ld.tsx` which gets `PURE_100`. No new override constants.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test infrastructure
- `vitest.config.mts` — Coverage config (`LIB_DATA_FILES`, `COMPONENT_FILES`, `PURE_100`, `COMPONENT_TARGET`). New files go into `COMPONENT_FILES`; json-ld.tsx goes into `LIB_DATA_FILES` (pure-logic threshold).
- `vitest.setup.ts` — jsdom stubs (`matchMedia`, `IntersectionObserver`, `ResizeObserver`, `scrollIntoView`). Add new stubs here if components need them.
- `src/test/render.tsx` — `renderWithLocale` wrapper (NextIntlClientProvider + ThemeProvider). Use for client components; use raw RTL for server components.

### Existing test patterns to follow
- `src/components/shared/easter-egg.test.tsx` — `vi.mock()` pattern for Next.js modules
- `src/components/shared/theme-provider.test.tsx` — raw RTL render (no locale wrapper) pattern
- `src/components/sections/copy-email-button.test.tsx` — clipboard mock + sonner mock pattern
- `src/components/sections/personal-projects.test.tsx` — `renderWithLocale` + next-intl client pattern

### Components to cover
- `src/components/mdx/callout.tsx` — async RSC, `getTranslations` from next-intl/server
- `src/components/mdx/note.tsx` — alias of Callout type="info"
- `src/components/mdx/warning.tsx` — alias of Callout type="warn"
- `src/components/mdx/stat.tsx` — pure sync RSC, no deps
- `src/components/mdx/pre-with-copy-button.tsx` — client, clipboard + sonner + useTranslations
- `src/components/json-ld.tsx` — server RSC, dangerouslySetInnerHTML
- `src/components/blog/post-card.tsx` — async RSC, `getTranslations` from next-intl/server
- `src/components/blog/toc-mobile.tsx` — pure sync server component
- `src/components/blog/toc-sidebar.tsx` — pure sync server component
- `src/components/sections/personal-projects.tsx` — client, already has tests (config-only change)

### Requirements
- `.planning/REQUIREMENTS.md` — TEST-01 through TEST-05 (thresholds, scope, CI gate)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/test/render.tsx` — `renderWithLocale(ui, { locale, theme })` — use for client components that consume `useTranslations`
- `vitest.setup.ts` — existing jsdom stubs; extend here for new stubs
- `copy-email-button.test.tsx` — clipboard + toast mock pattern directly reusable for `pre-with-copy-button`

### Established Patterns
- **Module mocks for Next.js deps:** `vi.mock('next/script', ...)` pattern → extend to `vi.mock('next-intl/server', ...)`
- **Pure threshold constant:** `PURE_100 = { statements: 100, branches: 100, functions: 100, lines: 100 }` — reuse for json-ld.tsx; add to `LIB_DATA_FILES` array (not COMPONENT_FILES)
- **Raw RTL render:** Used in `theme-provider.test.tsx` and `easter-egg.test.tsx` for server/non-context components
- **Unreachable branch override:** `UNREACHABLE_NULL_COALESCE` pattern exists for edge cases; can extend if new unreachable branches are found

### Integration Points
- `vitest.config.mts` `COMPONENT_FILES` array — add personal-projects.tsx here
- `vitest.config.mts` `LIB_DATA_FILES` array — add json-ld.tsx here (for PURE_100 threshold)
- CI workflow — coverage gate already runs `pnpm test:coverage`; no CI changes needed unless new environment variables are required

</code_context>

<specifics>
## Specific Ideas

- For `pre-with-copy-button.tsx`: The `extractCodeText` recursive function has real branches (string, number, array, ReactElement with/without `data-line`). The behavioral test (render → click → assert clipboard) naturally exercises most branches. No need for a separate unit test of `extractCodeText` unless branch coverage drops below 60%.
- For `json-ld.tsx`: The XSS escape test should pass a schema like `{ title: '<script>alert(1)</script>' }` and assert the output does NOT contain raw `<` — documents the security behavior rather than just asserting string equality.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-test-coverage-sweep*
*Context gathered: 2026-05-19*
