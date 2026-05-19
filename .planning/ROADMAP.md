# Roadmap — pansarinitech

**Last updated:** 2026-05-19
**Status:** Active — v1.3 in progress

---

## Milestones

- ✅ **v1.0 Public Launch** — Phases 1-5 (shipped 2026-05-02) — see `milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Polish, Quality & Test Baseline** — Phases 1-2 (shipped 2026-05-04) — see `milestones/v1.1-ROADMAP.md`
- ✅ **v1.2 UX Polish + Automated Content Pipeline** — Phases 1-4 (shipped 2026-05-15) — see `milestones/v1.2-ROADMAP.md`

---

## Phases

<details>
<summary>✅ v1.2 UX Polish + Automated Content Pipeline (Phases 1–4) — SHIPPED 2026-05-15</summary>

- [x] **Phase 1: Cmd+K Command Palette** — Full-featured keyboard command palette accessible from anywhere (completed 2026-05-13)
- [x] **Phase 2: UX Polish — Testing, Interactions & Animations** — Copy-email tests, Personal Projects polish, and micro-interaction refinements (completed 2026-05-13)
- [x] **Phase 3: Automated Content Pipeline** — Scheduled OpenAI gpt-4o agent generates bilingual MDX posts and opens GitHub PRs (completed 2026-05-15)
- [x] **Phase 4: SEO Enrichment** — JsonLd RSC + Article/WebPage schema.org + prose heading overrides (completed 2026-05-15)

Full archive: `milestones/v1.2-ROADMAP.md`

</details>

### 📋 v1.3 — Blog Enrichment + Quality Hardening

- [x] **Phase 5: Test Coverage Sweep** — Expand coverage config to all zero-coverage components; `pnpm test:coverage` exits 0 across full scope (completed 2026-05-19)
- [ ] **Phase 6: MDX Component Toolkit Expansion** — Build CodeFilename and InlineBadge components, test all 7 MDX components, update pipeline prompt
- [ ] **Phase 7: Blog Post + SEO Hardening** — Publish bilingual "View Transitions" post, emit hreflang alternates on all routes, add AUTHOR_PERSON JSON-LD

---

## Phase Details

### Phase 5: Test Coverage Sweep
**Goal**: Every component tracked in `vitest.config.mts` has tests that meet its threshold; `pnpm test:coverage` exits 0 with zero uncovered files in scope
**Depends on**: Nothing (builds on existing Vitest infrastructure from v1.1)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. `pnpm test:coverage` exits 0 with all per-file thresholds passing across the expanded scope (MDX components, json-ld.tsx, personal-projects.tsx, blog-layer components)
  2. `json-ld.tsx` is covered at 100/100/100/100 — a developer running the suite sees no uncovered branch in the JSON-LD serialization logic
  3. All five pre-existing MDX components (`callout.tsx`, `note.tsx`, `warning.tsx`, `stat.tsx`, `pre-with-copy-button.tsx`) are tracked in the coverage config and their tests pass at ≥70/60/70/70
  4. Blog-layer components (`post-card.tsx`, `toc-mobile.tsx`, `toc-sidebar.tsx`) and `personal-projects.tsx` have tests that render the component contract and are tracked in coverage config at ≥70/60/70/70
  5. CI gate runs the expanded coverage check and blocks merge on any threshold regression
**Plans**: 4 plans
Plans:
- [x] 05-01-PLAN.md — MDX component tests (callout, note, warning, stat, pre-with-copy-button)
- [x] 05-02-PLAN.md — json-ld.tsx tests (script output, XSS escape, exported constants)
- [x] 05-03-PLAN.md — Blog-layer component tests (post-card, toc-mobile, toc-sidebar)
- [x] 05-04-PLAN.md — vitest.config.mts expansion + pnpm test:coverage gate verification
**UI hint**: yes

### Phase 6: MDX Component Toolkit Expansion
**Goal**: Two new MDX components (`CodeFilename`, `InlineBadge`) are built, accessible, registered for use in all MDX bodies, tested, and the OpenAI content pipeline prompt documents all 7 components so generated posts can reference them
**Depends on**: Phase 5 (new components need to be in coverage scope from day one)
**Requirements**: MDX-01, MDX-02, MDX-03, MDX-04, MDX-05
**Success Criteria** (what must be TRUE):
  1. A `<CodeFilename>` component renders a filename label above a fenced code block in any MDX body — bilingual label support works via next-intl and both Jedi and Sith themes pass WCAG AA contrast
  2. An `<InlineBadge>` component renders an inline chip using CSS variable theme tokens (primary, secondary, muted, destructive variants) — visible in prose on both light and dark themes and passing WCAG AA
  3. Both new components are registered in `mdxComponents` and work in a real blog post and project case-study MDX body without any import needed inside the MDX file
  4. `scripts/generate-post-prompt.md` documents all 7 MDX components (pre-existing 5 + new 2) with usage examples that the OpenAI pipeline can follow
  5. `pnpm test:coverage` continues to exit 0 with the two new component files tracked at ≥70/60/70/70
**Plans**: 3 plans
Plans:
- [ ] 06-01-PLAN.md — CodeFilename + InlineBadge components, i18n keys, mdxComponents registration (MDX-01, MDX-02, MDX-03)
- [ ] 06-02-PLAN.md — Tests for both new components + vitest.config.mts coverage expansion (MDX-05)
- [ ] 06-03-PLAN.md — Pipeline prompt AVAILABLE MDX COMPONENTS section (MDX-04)
**UI hint**: yes

### Phase 7: Blog Post + SEO Hardening
**Goal**: A new code-heavy bilingual blog post is live on both locales using the MDX toolkit, every route emits `alternates.languages` hreflang metadata, and the JSON-LD payload includes the author's identity links for Knowledge Graph coverage
**Depends on**: Phase 6 (post uses the new MDX components built there)
**Requirements**: BLOG-01, BLOG-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. The "View Transitions API on the theme toggle" post appears correctly in the blog listing on both `/en/blog` and `/pt/blog`, with valid frontmatter (title, description, date, tags) in both locales
  2. The post body uses at least one callout, one code-filename block, and one inline badge — demonstrating the Phase 6 toolkit in a real post
  3. Viewing page source (or snapshot test output) on any route shows `<link rel="alternate" hreflang>` tags for `en`, `pt-BR`, and `x-default`
  4. The `seo.test.ts` snapshot for `buildMetadata()` includes `alternates.languages` with the correct locale keys
  5. Article and WebPage JSON-LD payloads include an `author` object with `url` and `sameAs` (GitHub, LinkedIn) — verifiable via the existing `json-ld.tsx` snapshot tests
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Cmd+K Command Palette | v1.2 | 2/2 | Complete | 2026-05-13 |
| 2. UX Polish — Testing, Interactions & Animations | v1.2 | 3/3 | Complete | 2026-05-13 |
| 3. Automated Content Pipeline | v1.2 | 3/3 | Complete | 2026-05-15 |
| 4. SEO Enrichment | v1.2 | 1/1 | Complete | 2026-05-15 |
| 5. Test Coverage Sweep | v1.3 | 4/4 | Complete   | 2026-05-19 |
| 6. MDX Component Toolkit Expansion | v1.3 | 0/3 | Not started | - |
| 7. Blog Post + SEO Hardening | v1.3 | 0/? | Not started | - |

---

*Generated by gsd-roadmapper, archived by gsd-complete-milestone*
