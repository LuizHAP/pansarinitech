---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: UX Polish + Automated Content Pipeline
status: executing
last_updated: "2026-05-15T22:01:11.093Z"
last_activity: 2026-05-15
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 15
  completed_plans: 15
  percent: 100
---

# Project State — pansarinitech

**Last updated:** 2026-05-15 after Phase 04 P1 execution — shared JsonLd RSC + prose heading overrides delivered. SEO-01 and SEO-02 complete. Phase 4 complete.

---

## Project Reference

**What this is:** Bilingual (PT/EN) personal portfolio for Luiz Pansarini, Principal Software Engineer. Subtle Star Wars aesthetic via a Jedi (light) / Sith (dark) theme toggle. Built on Next.js 16 + TypeScript + Tailwind v4 + Shadcn/UI on Vercel.

**Core value:** Land high-signal opportunities (jobs and freelance) by presenting Luiz's career narrative — IT support to Principal Engineer, BR scale to US market — through a portfolio that is fast, accessible, mobile-first, and memorable without being unprofessional.

**If everything else fails:** the site must load fast on a recruiter's phone, communicate "Principal-level full-stack engineer" within 5 seconds, and offer a clear path to "contact / hire / message me."

**Current focus:** Phase 04 — SEO Enrichment

---

## Current Position

Phase: 4
Plan: 1/1
Status: Complete
Last activity: 2026-05-15

---

## Roadmap Snapshot

- [x] **Phase 1: Cmd+K Command Palette** — Full-featured keyboard command palette (UX-01 to UX-07) — completed 2026-05-13
- [x] **Phase 2: UX Polish — Testing, Interactions & Animations** — Copy-email tests, Personal Projects polish, micro-interactions (UX-08 to UX-12) — completed 2026-05-13
- [x] **Phase 3: Automated Content Pipeline** — OpenAI gpt-4o generates bilingual MDX + opens PRs (PIPE-01 to PIPE-07) — completed 2026-05-15
- [x] **Phase 4: SEO Enrichment** — Shared JsonLd RSC + Article/WebPage schema injection + prose heading overrides (SEO-01, SEO-02) — completed 2026-05-15

---

## Performance Metrics

(To be tracked after first phase ships.)

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse Performance (mobile) | ≥ 95 | — |
| Lighthouse Accessibility | 100 | — |
| Lighthouse SEO | ≥ 95 | — |
| Lighthouse Best Practices | ≥ 95 | — |
| First Load JS (per route) | < 200KB | — |
| Static rendering coverage (`[locale]`) | 100% | — |
| axe-core violations (en/pt × light/dark) | 0 | — |

---
| Phase 01-cmd-k-command-palette P1 | 216 | 2 tasks | 12 files |
| Phase 01-cmd-k-command-palette P2 | 90 | 2 tasks | 4 files |

## Accumulated Context

### Decisions Locked During Initialization

| Decision | Rationale | Source |
|----------|-----------|--------|
| Stack: Next.js 16 + TS + Tailwind v4 + Shadcn + Vercel | Mirrors Luiz's daily production stack at Machinery Partner; portfolio doubles as proof of work | PROJECT.md |
| `localePrefix: 'always'` (always-prefixed `/pt`, `/en`) | Avoids duplicate-content SEO trap; clean hreflang reciprocity | research/PITFALLS.md #4 |
| `proxy.ts` (NOT `middleware.ts`) | Next.js 16 renamed; both files at root cause build error | research/PITFALLS.md #3 |
| `next-mdx-remote/rsc` for MDX (v1) | Path of least resistance in Next 16 RSC; archived 2026-04-09 but works; plan migration to Fumadocs MDX within 12 months | research/STACK.md |
| Theme tokens via OKLCH CSS variables + `@theme inline` | Tailwind v4 idiom; Shadcn-recommended; one-class flip on `<html>` | research/STACK.md, ARCHITECTURE.md |
| `setRequestLocale(locale)` in every page AND every layout | Required for static rendering with next-intl; CI-enforced | research/PITFALLS.md #3 |
| ESLint rule blocks `next/link` outside `lib/i18n/navigation.ts` | Prevents locale-stripping on internal nav | research/PITFALLS.md #5 |
| axe-core CI matrix across 4 combinations (en/pt × light/dark) | Sith red contrast risk; theming must be a11y-clean per locale | research/PITFALLS.md #10 |
| Project-wide `prefers-reduced-motion` global CSS rule + `<MotionConfig reducedMotion="user">` | Vestibular-disorder protection across all decorative motion, not just flagship animations | research/PITFALLS.md #11 |
| MDX directory: `content/{type}/{slug}.{locale}.mdx` (filename suffix) | Pairs locales side-by-side; missing translations visible in `git status` | research/ARCHITECTURE.md |
| Resume PDFs in `/public/resume-{en,pt}.pdf`; labels "Currículo (PT)" / "Resume (EN)" | PDFs already authored bilingually; locale-correct labels reduce friction | PROJECT.md |
| No contact form in v1 | mailto + LinkedIn covers ~95% of recruiter intent; forms = anti-spam complexity | PROJECT.md |
| Phase 2 = explicit deployable milestone | Static sections via typed TS data ship a real bilingual portfolio without MDX | research/SUMMARY.md |
| Mock `motion/react` in jsdom tests with synchronous AnimatePresence stub | AnimatePresence mode="wait" holds exiting elements in DOM until exit animation completes; jsdom has no animation frames — stub makes AnimatePresence a React.Fragment for instant swap | 02-01-SUMMARY.md |
| Inline prose links: decoration-2/underline-offset-4/hover:decoration-foreground (not font-semibold/text-foreground) | Preserves paragraph flow; font-weight and color changes disrupt inline prose readability | 02-02-SUMMARY.md |
| Partial screenshot delivery: wire only available screenshots; leave pending-redesign entries as gradient placeholders | Avoids double-update churn; gradient fallback in ProjectScreenshot keeps cards visually valid | 02-03-SUMMARY.md |
| topic_sequence canonical order: nextjs-react-frontend → software-engineering-career → ai-in-development → personal-projects-open-source | Round-robin rotation starting with most relevant frontend topic; null initial state ensures first run picks index 0 | 03-01-SUMMARY.md |
| External prompt file (scripts/generate-post-prompt.md) over heredoc in YAML | YAML-escape-free editing; independently reviewable in PRs; injects via $(cat scripts/generate-post-prompt.md) | 03-01-SUMMARY.md |
| HHMM suffix in branch name (content/auto-post-YYYY-MM-DD-HHMM) | Prevents same-day collision when workflow_dispatch is used multiple times on the same day (RESEARCH.md Pitfall 5 + D-11 extended) | 03-02-SUMMARY.md |
| Assert-files-exist step before pnpm verify:posts | Catches silent zero-file writes (Pitfall 6: claude exits 0 but files not written without --permission-mode acceptEdits) with clear error message before the verify script is invoked | 03-02-SUMMARY.md |
| Export SITE_URL from seo.ts | Single canonical URL source for both buildMetadata and JsonLd — avoids duplication | 04-P1-SUMMARY.md |
| JsonLd RSC with biome-ignore for noDangerouslySetInnerHtml | Idiomatic JSON-LD pattern; content is Zod-validated owner-only MDX frontmatter — no user input | 04-P1-SUMMARY.md |

### Open TODOs

- Choose final saber-red OKLCH value (must clear 4.5:1 against Sith bg AND 3:1 for focus rings) — Phase 1 deliverable
- Decide custom domain timing — `pansarini.tech` placement (Phase 5 or earlier)
- Re-verify `next-mdx-remote/rsc` archive impact + Fumadocs MDX maturity before kicking off Phase 3
- Verify `next/og` 500KB limit + Edge runtime constraints before Phase 4

### Roadmap Evolution

- Phase 1 added: Vitest + Unit Test Baseline — Vitest + RTL setup, 100% coverage on pure-logic files, coverage CI gate, co-located tests
- Phase 2 added: Code Quality Baseline — barrel exports, naming conventions, import reorder commit
- v1.2 roadmap created: 3 phases (Cmd+K palette, UX polish, content pipeline), 19 requirements mapped

### Blockers

(None.)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260503-049 | v1.1 commit existing About+Skills redesign and add scroll animations to Career Featured Projects Blog Contact sections | 2026-05-03 | 9864840 | [260503-049-v1-1-commit-existing-about-skills-redesi](./quick/260503-049-v1-1-commit-existing-about-skills-redesi/) |
| 260504-msj | Add component testing layer: configure jsdom + React Testing Library in vitest, then write tests for the critical section components | 2026-05-04 | 675f90f | [260504-msj-add-component-testing-layer-configure-js](./quick/260504-msj-add-component-testing-layer-configure-js/) |
| 260504-qjg | add tests for 4 excluded components (TD-07) | 2026-05-04 | dc2f84e | [260504-qjg-add-tests-for-4-excluded-components-td-0](./quick/260504-qjg-add-tests-for-4-excluded-components-td-0/) |
| 260505-ooy | remova os blocos de código de dentro dos blog posts | 2026-05-05 | 5191190 | [260505-ooy-remova-os-blocos-de-c-digo-de-dentro-dos](./quick/260505-ooy-remova-os-blocos-de-c-digo-de-dentro-dos/) |
| 260506-mll | Fix Lighthouse CI failures — home page performance (fetchPriority + relax perf gate to 0.85) | 2026-05-06 | eb38b8c | [260506-mll-fix-lighthouse-ci-failures-home-page-per](./quick/260506-mll-fix-lighthouse-ci-failures-home-page-per/) |
| 260506-n5u | Fix Lighthouse CI warnings — suppress render-blocking-resources and legacy-javascript false positives | 2026-05-06 | b313816 | [260506-n5u-fix-lighthouse-ci-warnings-render-blocki](./quick/260506-n5u-fix-lighthouse-ci-warnings-render-blocki/) |
| 260506-nlw | Fix DOM size warning on home page — collapse ~74 wrapper nodes in Skills and CareerTimeline | 2026-05-06 | 17e2c88 | [260506-nlw-fix-dom-size-warning-on-home-page](./quick/260506-nlw-fix-dom-size-warning-on-home-page/) |

### Risks Carried Forward

- `next-mdx-remote` archived 2026-04-09 — works in Next 16 but no future fixes; 12-month migration plan to Fumadocs MDX
- Vercel Hobby image quota (5K/month) — pre-resize source images to budgeted breakpoints
- Sith red palette failing 4.5:1 contrast — picked intentionally with WebAIM checker; axe-core CI catches regressions

---

## Session Continuity

### Last Session

- Executed 04-P1: Created src/components/json-ld.tsx (shared JsonLd RSC), exported SITE_URL from seo.ts, injected Article schema into blog post pages and WebPage schema into project post pages, added prose heading override classes to both prose wrappers
- Commits: `15ae0b5` (JsonLd RSC + SITE_URL export), `91f3cd9` (prose overrides + JsonLd injection in both post pages)
- 200 tests pass, 0 regressions; pnpm build exits 0; SEO-01 and SEO-02 complete

### Next Session

Phase 4 complete. All phases of v1.2 milestone delivered.

---

## Files Reference

| File | Purpose |
|------|---------|
| `.planning/PROJECT.md` | Vision, core value, constraints, key decisions |
| `.planning/REQUIREMENTS.md` | v1 requirements with REQ-IDs and traceability |
| `.planning/ROADMAP.md` | Phase structure with goal-backward success criteria |
| `.planning/STATE.md` | This file — project memory |
| `.planning/research/SUMMARY.md` | Top-level research findings + suggested phases |
| `.planning/research/STACK.md` | Stack rationale + version compatibility |
| `.planning/research/FEATURES.md` | Feature landscape (table stakes + differentiators + anti-features) |
| `.planning/research/ARCHITECTURE.md` | App Router structure + patterns + anti-patterns |
| `.planning/research/PITFALLS.md` | Critical pitfalls + recovery strategies |
| `.planning/config.json` | Workflow config (granularity: coarse) |

---
*Generated by gsd-roadmapper*
