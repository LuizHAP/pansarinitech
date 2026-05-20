# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.3 — Blog Enrichment + Quality Hardening

**Shipped:** 2026-05-20
**Phases:** 3 (Phases 5–7) | **Plans:** 9
**Timeline:** 2026-05-19 → 2026-05-20 (2 days, 29 commits)
**Test suite at close:** 241 tests, 36 test files

### What Was Built

- **Phase 5 — Test Coverage Sweep.** `vitest.config.mts` COMPONENT_FILES expanded from 17 to 26 entries + json-ld.tsx at PURE_100 threshold. 10 new test files covering MDX components (callout, note, warning, stat, pre-with-copy-button), json-ld.tsx, and blog-layer components (post-card, toc-mobile, toc-sidebar). Fixed a subtle coverage gap in note/warning tests. `pnpm test:unit:coverage` exits 0 as a CI gate before Playwright.
- **Phase 6 — MDX Component Toolkit.** Two new MDX components: `<CodeFilename>` (async RSC, bilingual aria-label, `FileIcon`) and `<InlineBadge>` (sync RSC, 4 semantic variants). Registered in the closed `mdxComponents` map — available in all MDX bodies without any import. Pipeline prompt extended with `## AVAILABLE MDX COMPONENTS` section documenting all 7 components with JSX examples.
- **Phase 7 — Blog Post + SEO Hardening.** "View Transitions API on the theme toggle" post authored bilingual (EN + PT), code-heavy, using 2 CodeFilename + 3 InlineBadge + 1 Callout blocks. `buildMetadata()` extended to emit `alternates.languages` on every route (Next 16 auto-emits hreflang). `AUTHOR_PERSON` in json-ld.tsx extended with `url` + `sameAs` for Google Knowledge Graph. 241 tests passing.

### What Worked

- **Two-day sprint intensity.** All 9 plans shipped in 2 calendar days — the phase sizes were well-calibrated. Phase 5 (4 plans) and Phase 6 (3 plans) on day 1; Phase 7 (2 plans) on day 2. No plan took more than ~1 hour.
- **SUMMARY.md files as instant progress evidence.** At milestone close, all SUMMARY.md files existed, making it trivial to verify completion — even when ROADMAP.md was stale on Phase 6's status.
- **Closed `mdxComponents` map.** Registering new components once in index.ts made them available everywhere immediately. The "no imports inside MDX bodies" contract held across all 3 phases.
- **TDD discipline in Phase 7.** Writing seo.test.ts assertions before implementing `alternates.languages` in seo.ts caught the stale `toBeUndefined()` assertions that would have passed incorrectly.

### What Was Inefficient

- **ROADMAP.md not updated after Phase 6 commit.** The `9c9170a` commit added Phase 6 functionality but didn't update the ROADMAP.md checklist (Phase 6 remained `0/3 Not started`). Caught at milestone close but could have caused confusion. **Fix for v1.4:** Add ROADMAP update to the executor's exit checklist.
- **REQUIREMENTS.md traceability table never updated.** All 14 rows stayed `Pending` throughout the milestone — fixed at close but wasted effort. **Fix for v1.4:** Update traceability table in each plan's SUMMARY commit.
- **STATE.md roadmap snapshot inconsistency.** The snapshot showed Phase 6 as `[ ]` but `completed_plans: 9` — both can't be right. The progress counter was correct; the snapshot was stale. Snapshot is now redundant with the `<details>` blocks in ROADMAP.md.

### Patterns Established

- **Delegate-component coverage pattern:** `Note()/Warning()` → call directly to register function coverage → assert `.type === Callout` for delegation contract → use `Callout()` for rendering assertions. Documents a testing pattern for all future alias/delegate components.
- **`import { X }; export { X }` over bare re-export:** When a symbol needs to be both re-exported and used as a local value in the same module, a bare `export { X } from '...'` doesn't bind it locally. Add explicit `import` first.
- **Pipeline prompt as a first-class artifact:** The `## AVAILABLE MDX COMPONENTS` section in `generate-post-prompt.md` is now a dependency of all future blog-post phases — it must be updated when new components are added.

### Key Lessons

1. **Update ROADMAP.md in the same commit as the feature.** The SUMMARY commit pattern (docs commit after feature commit) should also include ROADMAP checklist updates — otherwise the plan tracking drifts from reality.
2. **Phase size of 2–4 plans is the sweet spot.** Phase 5 (4 plans) was the maximum comfortable size; each plan stayed under 30 minutes. Phase 7 (2 plans) was the minimum — both were medium-complexity plans that warranted separation.
3. **Closed maps scale well.** The `mdxComponents` closed map pattern (introduced in v1.0) paid off again — Phase 6's additions required exactly one file change to register two new components everywhere.

### Cost Observations

- Sessions: 3 (Phase 5, Phase 6, Phase 7)
- Notable: Phase 6 was the highest-value session — three plans shipped atomically in a single commit (`9c9170a`)

---

## Milestone: v1.0 — Public Launch

**Shipped:** 2026-05-02
**Phases:** 5 | **Plans:** 11 | **Tasks:** 14
**Timeline:** 2026-04-30 → 2026-05-02 (3 calendar days, 38 commits)
**Codebase:** ~6,000 LOC TS/TSX/CSS/MDX/MJS in `src/` + `content/` + `tests/`

### What Was Built

- **Phase 1 — Foundation.** Bilingual i18n (next-intl 4.11) + Jedi/Sith theming (next-themes + Tailwind v4 OKLCH) + a11y baseline (axe matrix, skip-to-content, semantic HTML) + locale-aware 404 via catch-all + `notFound()`. Biome single-binary toolchain replaced ESLint+Prettier mid-flight.
- **Phase 2 — Static Content Sections.** Full bilingual deployable portfolio (Hero/About/Career/Skills/Now/Contact + Footer) from typed `data/*.ts` modules. iPhone SE 375px Playwright gate (16/16) + Vercel Analytics + Speed Insights + per-locale `<html lang>` (Lighthouse a11y 1.0).
- **Phase 3 — MDX Pipeline + Project Case Studies.** `next-mdx-remote@^6` RSC pipeline + 3 bilingual case studies (Heavy Machinery e-commerce, no-code → Next.js migration, Magazine Luiza Superapp) with build-time syntax highlighting via Shiki dual-theme.
- **Phase 4 — Blog + SEO + Dynamic OG.** Bilingual blog (listing + dynamic [slug]) as ● SSG + first launch post (1489 EN / 1663 PT words) + 6 dynamic Sith-red OG images via `next/og` + multilingual sitemap with hreflang reciprocity + env-gated robots + favicons + manifest + production-only console easter egg + `generateMetadata` on every route.
- **Phase 5 — Hardening.** Native View Transitions API radial-reveal on theme toggle (~420ms clip-path circle from click coordinate) with 200ms `vt-fade` reduced-motion fallback + zero-polyfill instant-swap fallback. Playwright E2E suite covering 6 critical flows (locale, theme, navigation, downloads, 404, projects) wired as a gating CI step on a dedicated chromium project (runs once, not 4× across the axe matrix), retries cut from 2 to 1.

### What Worked

- **Coarse-grained phasing (5 phases, 1-3 plans each).** Each phase had a single thesis ("foundation", "deployable portfolio without MDX", "MDX + cases", "blog + SEO", "post-launch polish"). Easy to verify at the phase boundary; rollbacks would have been cheap.
- **Phase 2 deployability lock.** Forcing Phase 2 to ship a real bilingual portfolio (no MDX) before Phase 3 added the MDX pipeline meant Phase 1 was stress-tested on real content immediately. Caught the contrast-fix loop early (Sith primary darkened to oklch(54%) for AA).
- **Closed `mdxComponents` map reused across Phases 3 and 4.** Adding `pre: PreWithCopyButton` once enabled copy buttons in BOTH projects and blog with no per-content opt-in. The factory pattern (single `compileMDX` call site) prevented version drift across content types.
- **Single shared CI pipeline accumulating gates per phase.** a11y matrix (Phase 1) → iPhone SE (Phase 2) → Sith contrast (Phase 2) → MDX parity (Phase 3) → metadata + sitemap verification (Phase 4) → e2e (Phase 5). Every phase added a regression net the next phase couldn't break silently.
- **Verifier signing overrides at phase boundaries.** Each VERIFICATION.md has `overrides_applied` with `accepted_by`/`accepted_at`. Made the milestone audit trivial — no archaeology needed to know what was deviated and why.
- **Specifying out-of-scope decisions in CONTEXT.md before planning.** Phase 5's D-12 explicitly deferred Cmd+K, custom domain, RSS, etc. Verifier didn't flag them as gaps; audit didn't either. Clear scope contracts prevented retrospective scope creep.
- **`next build && next start` for E2E (Phase 5 D-07).** Production-bundle tests caught what `next dev` would have hidden (Edge runtime, RSC behavior, real headers).

### What Was Inefficient

- **REQUIREMENTS.md traceability table never updated mid-phase.** All 53 REQ-IDs sat at `Pending` until milestone completion forced a bulk-update. The information was authoritative in VERIFICATION.md frontmatter; the table was a stale shadow. **Lesson:** either auto-sync via a phase-completion hook, or stop maintaining the parallel table.
- **SUMMARY.md frontmatter inconsistency.** Some plans filled `requirements_completed`, others omitted it. Forced milestone audit to fall back to VERIFICATION.md as the source of truth. **Lesson:** make the field required and templated.
- **Reduced-motion fade direction bug shipped (Phase 5 WR-01).** Code review caught it post-merge: NEW pseudo-element faded out, OLD faded in. End-state correct, perceived 200ms inverted. Fixed in commit `4624d2c` but a tiny manual visual smoke test before merge would have caught it. **Lesson:** for visual-effect plans, add a 30-second "click it once" smoke test to plan acceptance criteria.
- **Phase 5 image-load race in e2e (WR-02).** Test asserted `img.complete && img.naturalWidth > 0` immediately after `scrollIntoViewIfNeeded`, racing next/image lazy load. Caught by code review, fixed with `expect.poll`. **Lesson:** any image readiness assertion in Playwright should default to `expect.poll` — there is no "instant" image load.
- **Multiple aborted attempts to download FT Aurebesh OFL binary (Phase 1 + 2).** Fontesk distribution-gate returned HTML form-page instead of binary. Fell back to AurekFonts MIT. **Lesson:** when a planning task depends on third-party asset download, prove the asset is fetchable before locking it in the plan.
- **next/image `priority` deprecation surfaced mid-Phase-2 instead of in research.** Caught by build warning. Replaced with `preload`. **Lesson:** for major Next versions (14→15→16), allocate a 1-hour deprecation sweep in Phase 1 research.

### Patterns Established

- **Catch-all `[locale]/[...rest]/page.tsx` calling `notFound()`** as the locale-aware 404 boundary (vs cookie-sniffing redirect). Reusable any time root not-found needs to delegate to a locale-aware page in Next 16.
- **Single-spec-single-project Playwright pattern** (Phase 5 D-08): when a spec should NOT run on the multi-config matrix (e.g., axe locale × theme), use `testIgnore` on existing projects + `testMatch` on a dedicated project. Prevents N× redundant runs.
- **Closed `mdxComponents` map + factory pattern** for any content pipeline reused across 2+ content types. Single edit point, single dep.
- **Anchored regex in Playwright `getByRole`** (e.g., `/^pt$/i` not `/pt/i`) to prevent collisions with substrings like "Newsletter (PT)" that may appear in future redesigns.
- **VT pseudo-element reduced-motion override idiom** — `@media (prefers-reduced-motion: reduce) @supports (view-transition-name: root) { ::view-transition-* { animation: ... !important } }`. Pitfall 2 mitigation pattern (universal `*` selector does NOT cascade into UA shadow DOM).
- **JS-layer reduced-motion bypass in addition to CSS** — for animations triggered by JS APIs (View Transitions, scroll, etc.), skip the snapshot machinery entirely under RM rather than just suppressing the visual.
- **`localized 404 status assertion`** — always assert `response?.status() === 404` (not just visible copy) — locks in the SEO crossover invariant that catch-all routes must not return 200 with a 404 body.
- **Conventional-commit scoped-by-phase** (`feat(05-01): ...`, `chore(04-03): ...`) made milestone audit's git-grep scoping reliable.

### Key Lessons

1. **Verify by behavior, not by table.** REQUIREMENTS.md's traceability table is a parallel data source that drifts silently. The authoritative source is VERIFICATION.md frontmatter, which is generated at the same time as the work. Either auto-sync the table from VERIFICATION.md or drop the table.
2. **Visual smoke tests belong in the plan, not the post-merge code review.** WR-01 (reverse-fade direction) would have been caught by 30 seconds of clicking the toggle. For any animation/motion plan, the acceptance criterion should include `[ ] Manually clicked it once and confirmed perceived behavior matches intent`.
3. **Make scope contracts explicit before planning.** Phase 5's CONTEXT.md "Out of Scope" section made the verifier and the milestone auditor both ignore Cmd+K/custom-domain/RSS without flagging them. The decision-record was load-bearing for audit signal-to-noise.
4. **Production-bundle tests are non-negotiable for SSR/RSC apps.** `next dev` lies. Phase 5 D-07 lock prevented an entire class of post-merge regressions.
5. **Single CI pipeline accumulating gates beats per-phase pipelines.** Every previous phase's tests must run on every future phase's PR. Catches integration regressions that no individual phase would notice.
6. **Override-acceptance with signature is critical for milestone audit.** Each VERIFICATION.md has `overrides_applied` with `accepted_by`/`accepted_at`. Without those, the audit would have to investigate every deviation as a potential gap.

### Cost Observations

- **Model mix:** Predominantly Opus 4.7 (1M context) for orchestration; Sonnet 4.6 for executor/verifier subagents per phase config.
- **Sessions:** 1 dense 3-day window (single-developer, conversational pace).
- **Notable:** The `gsd-executor` per-plan subagent pattern kept the orchestrator context lean (~10-15%) even across 38 commits and 11 plans. Worktree mode would have helped on a multi-developer setup but was disabled for this single-developer cycle (`workflow.use_worktrees=false`); sequential execution within waves was fine because most plans had no inter-plan parallelism.

---

---

## Milestone: v1.2 — UX Polish + Automated Content Pipeline

**Shipped:** 2026-05-15
**Phases:** 4 | **Plans:** 9
**Timeline:** 2026-05-13 → 2026-05-15 (3 days, ~44 commits)
**Codebase:** ~135 files changed, 9,192 insertions, 386 deletions

### What Was Built

- **Phase 1 — Cmd+K Command Palette.** Shadcn Command + Dialog primitives via CLI (radix-ui monorepo import normalization, cmdk@1.1.1 ESM inline for vitest), full `commandPalette` i18n namespace (22 keys EN+PT), `CommandPalette` + `CommandPaletteTrigger` client components with 14 commands (navigation, theme, locale, quick-links), wired into Header. 22-test RTL suite verifying all interaction paths (Cmd+K, Esc, click, mobile close button).
- **Phase 2 — UX Polish.** `CopyEmailButton` `AnimatePresence` + `Check` icon swap resolving TD-07; Skills focus rings + NowPreview link micro-interactions; Personal Projects screenshot wiring + scroll-reveal stagger animation consistent with site system.
- **Phase 3 — Automated Content Pipeline.** `generate-post-prompt.md` external template + `.pipeline-state.json` topic-rotation state. GitHub Actions `generate-post.yml` (cron + dispatch, assert-files-exist gate, `pnpm verify:posts`, HHMM branch suffix). Pivoted to OpenAI gpt-4o (`generate-post-openai.mjs`) when Anthropic credits unavailable — `===FILE:/===ENDFILE` delimiter scheme for multi-file output parsing. First end-to-end PR created successfully.
- **Phase 4 — SEO Enrichment.** Shared `JsonLd` RSC (`dangerouslySetInnerHTML` + `<` → `<` XSS escape), `AUTHOR_PERSON` constant, `export const SITE_URL` from `seo.ts`. Article schema on blog post pages, WebPage schema on project post pages. Prose heading overrides (`prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20`) on both post pages. 3 code review criticals fixed post-execution (XSS escape, locale guard gap, relative heroImage resolved to absolute URL).

### What Worked

- **Parallel-wave executor subagents kept orchestrator context lean.** Despite `use_worktrees=false` (sequential), each plan ran in a fresh 200K context window. The orchestrator stayed at ~10% across 9 plans.
- **Code review agent caught real bugs (CR-01 XSS).** Running `gsd-code-review` after execution (not before) surfaced a genuine XSS vector (`</script>` termination in JSON-LD) that wouldn't be obvious from plan inspection. The review-then-fix loop added ~15 min but prevented a security issue from shipping.
- **External prompt file (`scripts/generate-post-prompt.md`) over heredoc in YAML.** Eliminated YAML-escape complexity in CI config; made the prompt independently reviewable in PRs. Decision from RESEARCH.md held throughout execution.
- **`===FILE:/===ENDFILE` delimiter scheme.** Multi-file LLM output parsed reliably without tool calls. A novel pattern established in Phase 3 that handles any multi-file text generation task.

### What Was Inefficient

- **Claude CLI → OpenAI pivot in Phase 3 Plan 03.** The plan was written for Claude CLI; pivot to OpenAI gpt-4o required mid-plan deviation (new `generate-post-openai.mjs`, `===FILE:/===ENDFILE` scheme). If the API credits situation had been verified pre-planning, the plan would have been written for OpenAI from the start. **Lesson:** for plans depending on a specific LLM API key, verify key availability in discuss/plan phase before writing the plan.
- **3 code review criticals in a 2-file change (Phase 4).** All 3 were introduced by the plan itself (XSS escape omitted, locale guard not carried from blog to project page, relative heroImage passed verbatim). The plan's `<verify>` blocks covered build/test but not security patterns. **Lesson:** JSON-LD serialization and auth guards should be in plan acceptance criteria as named security checks, not implicit.
- **REQUIREMENTS.md traceability table had "Pending" for all Phase 1 + some Phase 2 requirements** even after execution, requiring bulk-update at archive time. Cross-validates the v1.0 lesson — the table is perpetually stale.

### Patterns Established

- **`JsonLd` RSC pattern:** `import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld'`; render as first child of `<article>`; serialize with `.replace(/</g, '\\u003c')` for XSS safety.
- **Prose heading overrides pattern:** append `prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20` inline to existing prose wrapper `className` — no wrapper div changes needed.
- **Multi-file LLM output via delimiter scheme:** `===FILE:/{path}===` ... content ... `===ENDFILE===` with a `splitOnDelimiter` parser. Reusable for any multi-file generation workflow.
- **Assert-before-validate ordering in CI:** run `test -f {expected_file}` BEFORE calling the validation script — catches silent zero-file writes (LLM exits 0 but doesn't write files).
- **Locale guard consistency:** every `async function Page({params})` in `app/[locale]/` must include `if (!routing.locales.includes(locale)) notFound()` at the top, mirroring `generateMetadata` — missing it is a code review critical.

### Key Lessons

1. **Verify external API key availability before planning.** If the plan depends on a specific AI CLI or API key, confirm the credential exists and has credits in discuss-phase before writing the plan.
2. **Name security patterns explicitly in plan acceptance criteria.** JSON-LD serialization (`</script>` escape), locale guards, URL resolution (absolute vs relative) should be first-class acceptance criteria items, not implied by "pnpm build exits 0".
3. **Code review agent catches real production bugs.** Running it is not ceremony — CR-01 (XSS) and CR-03 (relative URL in structured data) were genuine issues that would have been invisible in test output.
4. **REQUIREMENTS.md traceability table confirmed stale again (v1.0 lesson cross-validated).** All Phase 1 rows sat at "Pending" throughout the milestone. The authoritative source is VERIFICATION.md frontmatter.

### Cost Observations

- **Model mix:** Claude Sonnet 4.6 throughout (both orchestrator and subagents).
- **Sessions:** 2 sessions across 3 days (2026-05-13 for Phases 1-2, 2026-05-15 for Phases 3-4).
- **Notable:** `workflow.use_worktrees=false` with sequential plans was fine for a solo developer. No merge conflicts. The sequential cost was ~15-20 min/plan vs parallel — acceptable for 9 small plans.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 5 | Baseline — 5-phase coarse-grained plan with verify-on-each + audit-before-archive |
| v1.2 | 2 | 4 | Smaller phases (1-3 plans each), code-review gate added post-execution, pivot to OpenAI mid-pipeline |

### Cumulative Quality

| Milestone | Playwright Specs | a11y Coverage | Zero-Dep Additions |
|-----------|------------------|----------------|---------------------|
| v1.0 | 4 (a11y matrix, iPhone SE, Sith contrast, e2e) | 24 axe combos × en/pt × light/dark × home/404 | Inline GitHub/LinkedIn SVGs (no brand-icon library), inline `<Script>` console easter egg |
| v1.2 | 4 (unchanged — all pass) | 200 unit + component tests (Vitest) | cmdk@1.1.1, OpenAI Node SDK (runtime only), `json-ld.tsx` RSC |

### Top Lessons (Cross-Milestone)

1. **REQUIREMENTS.md table drifts; VERIFICATION.md frontmatter is the authoritative source** — confirmed v1.0 and v1.2. Either auto-sync or drop the table.
2. **Visual smoke tests belong in the plan, not post-merge code review** — v1.0 (animation direction bug). Code review belongs in the loop, but "click it once" is cheaper than a review cycle.
3. **Verify external credentials before planning** — v1.2 (Anthropic credits, OpenAI pivot). A 30-second credential check in discuss-phase prevents a mid-plan deviation.
4. **Name security patterns explicitly in plan acceptance criteria** — v1.2 (XSS escape, locale guard, absolute URL). Security issues are invisible to build/test pipelines.

---
*Last updated: 2026-05-15 after v1.2 UX Polish + Automated Content Pipeline*
