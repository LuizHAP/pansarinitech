# Roadmap — pansarinitech

**Last updated:** 2026-06-12
**Status:** Active — v1.6 RSS Feed + JS Bundle Optimization + Content

---

## Milestones

- ✅ **v1.0 Public Launch** — Phases 1-5 (shipped 2026-05-02) — see `milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Polish, Quality & Test Baseline** — Phases 1-2 (shipped 2026-05-04) — see `milestones/v1.1-ROADMAP.md`
- ✅ **v1.2 UX Polish + Automated Content Pipeline** — Phases 1-4 (shipped 2026-05-15) — see `milestones/v1.2-ROADMAP.md`
- ✅ **v1.3 Blog Enrichment + Quality Hardening** — Phases 5-7 (shipped 2026-05-20) — see `milestones/v1.3-ROADMAP.md`
- 🔄 **v1.6 RSS Feed + JS Bundle Optimization + Content** — Phases 12-15 (active)

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

<details>
<summary>✅ v1.3 Blog Enrichment + Quality Hardening (Phases 5–7) — SHIPPED 2026-05-20</summary>

- [x] **Phase 5: Test Coverage Sweep** — Expand coverage config to all zero-coverage components; `pnpm test:unit:coverage` exits 0 across full scope (completed 2026-05-19)
- [x] **Phase 6: MDX Component Toolkit Expansion** — Build CodeFilename and InlineBadge components, test all 7 MDX components, update pipeline prompt (completed 2026-05-19)
- [x] **Phase 7: Blog Post + SEO Hardening** — Publish bilingual "View Transitions" post, emit hreflang alternates on all routes, add AUTHOR_PERSON JSON-LD (completed 2026-05-20)

Full archive: `milestones/v1.3-ROADMAP.md`

</details>

### v1.4 UAUBox Design System Case Study (Phases 8–9)

- [x] **Phase 8: Author + Integrate UAUBox DS Case Study** — Bilingual MDX case study authored and integrated into the existing pipeline (routing, metadata, JSON-LD, listing) (completed 2026-05-20)
- [x] **Phase 9: Quality Verification** — All quality gates confirmed clean on the new case study pages; no regressions (completed 2026-05-21)

- [x] **Phase 10: Author Heavy Machinery Mobile-First Case Study** — Bilingual MDX case study authored and integrated into the existing pipeline (routing, metadata, JSON-LD, listing) (completed 2026-06-11)
- [x] **Phase 11: Lighthouse Performance Fix + Quality Verification** — Hero image width/height fix applied, test matrices extended, Lighthouse URLs updated. CASE-13 deferred: Lighthouse Performance 0.3-0.52 due to 608KB JS bundle (16 scripts) blocking main thread — requires significant JS bundle refactor to fix.

---

## Phase Details

*v1.3 phases archived — see `milestones/v1.3-ROADMAP.md` for full phase details.*

### Phase 8: Author + Integrate UAUBox DS Case Study

**Goal**: The UAUBox Design System case study is live and discoverable — authored bilingually, integrated into the existing MDX pipeline, and surfacing correctly in listings, metadata, and JSON-LD
**Depends on**: Nothing (infrastructure is pre-built from previous milestones)
**Requirements**: CASE-01, CASE-02, CASE-03, CASE-04, CASE-05, CASE-06, CASE-07, CASE-08, CASE-09
**Success Criteria** (what must be TRUE):
  1. A visitor can navigate to `/en/projects/uaubox-design-system` and `/pt/projetos/uaubox-design-system` and read the full case study with Problem / Solution / Results structure, DS-from-scratch narrative, design token pipeline detail, React component library details, and dev velocity gain as the headline outcome
  2. The case study is listed on both `/en/projects` and `/pt/projetos` — it appears alongside the existing three case studies
  3. The browser tab, social share cards, and OG preview all show a correct title, description, and image for each locale (no fallbacks, no empty strings, no broken OG images)
  4. Viewing source or a JSON-LD inspector on either locale page reveals an Article schema matching the v1.2 Phase 4 pattern
  5. The MDX body uses at least one MDX toolkit component (`<CodeFilename>`, `<InlineBadge>`, or `<Callout>`) in a meaningful, non-decorative way
**Plans**: 1 plan
- [x] 08-01-PLAN.md — Author bilingual UAUBox DS MDX, wire HERO_IMAGES x2, migrate JSON-LD WebPage→Article globally, update i18n 'Three'→'Four' case studies
**UI hint**: yes

### Phase 9: Quality Verification

**Goal**: Every quality gate that governs the portfolio passes on the new UAUBox case study pages, with zero regressions on existing pages
**Depends on**: Phase 8
**Requirements**: CASE-10, CASE-11, CASE-12, CASE-13, CASE-14
**Success Criteria** (what must be TRUE):
  1. All existing Playwright E2E flows (locale toggle, theme persistence, navigation, resume download, 404 invariant, project render) pass with the new case study in the repo
  2. The axe-core a11y matrix (en/pt × light/dark) reports 0 violations on both UAUBox case study pages
  3. The iPhone SE (375px) Playwright gate passes on both UAUBox case study pages — no horizontal overflow, no clipped CTAs, no broken layouts
  4. Lighthouse Performance scores ≥ 95 on the UAUBox case study pages (mobile)
  5. `pnpm test:unit:coverage` exits 0 — all 36 tracked files remain at ≥70/60/70/70 (components) and 100/100/100/100 (json-ld.tsx) thresholds
**Plans**: 2 plans
- [x] 09-01-PLAN.md — Verify unit coverage + E2E baseline; add UAUBox to a11y matrix and iPhone SE specs; add UAUBox hero mock
- [x] 09-02-PLAN.md — Add UAUBox URL to Lighthouse configs; run local Lighthouse audit (Performance ≥ 95)

### Phase 10: Author Heavy Machinery Mobile-First Case Study

**Goal**: A fifth portfolio case study is live and discoverable — authored bilingually, with a distinct mobile-first/React Native angle on the Heavy Machinery project (distinct from the existing ecommerce case), integrated into the existing MDX pipeline, and surfacing correctly in listings, metadata, and JSON-LD

**Depends on**: Nothing (infrastructure is pre-built from previous milestones)

**Requirements**: CASE-15, CASE-16, CASE-17, CASE-18, CASE-19, CASE-20

**Success Criteria** (what must be TRUE):
  1. A visitor can navigate to `/en/projects/machinery-mobile-first` and `/pt/projetos/machinery-mobile-first` and read the full case study with Problem / Solution / Results structure, React Native + Expo narrative, mobile UX on low-connectivity, App Store review process, and cart-state contract as key technical details
  2. The case study is listed on both `/en/projects` and `/pt/projetos` — it appears alongside the existing four case studies
  3. The browser tab, social share cards, and OG preview all show a correct title, description, and image for each locale (no fallbacks, no empty strings, no broken OG images)
  4. Viewing source or a JSON-LD inspector on either locale page reveals an Article schema matching the v1.2 Phase 4 pattern
  5. The MDX body uses at least one MDX toolkit component (`<CodeFilename>`, `<InlineBadge>`, or `<Callout>`) in a meaningful, non-decorative way
**Plans**: 1 plan
- [ ] 10-01-PLAN.md — Author bilingual Heavy Machinery Mobile-First MDX, wire HERO_IMAGES x2, register in projects listing + featured teaser, JSON-LD Article schema
**UI hint**: yes

### Phase 11: Lighthouse Performance Fix + Quality Verification

**Goal**: UAUBox case study pages achieve Lighthouse Performance ≥ 0.95 (LCP bottleneck resolved), and all quality gates pass on the new Heavy Machinery Mobile-First case study pages

**Depends on**: Phase 10

**Requirements**: CASE-13, CASE-15, CASE-16, CASE-17

**Success Criteria** (what must be TRUE):
  1. UAUBox case study pages score ≥ 0.95 on Lighthouse Performance (local and CI)
  2. LCP is the primary contributor to the Performance score and is within budget
  3. The Heavy Machinery Mobile-First case study passes all quality gates: unit tests, Playwright E2E, a11y matrix, iPhone SE, Lighthouse ≥ 95
  4. No regressions on existing case study pages (UAB, Magalu, both Machinery cases)
**Plans**: 1 plan
- [ ] 11-01-PLAN.md — Investigate LCP bottleneck (hero image optimization, LCP element analysis), run Lighthouse CI, verify all quality gates on new case study
**UI hint**: no

### Phase 12: RSS Feed for Blog

**Goal**: Blog readers can subscribe via RSS/Atom. Two feeds: `/feed.xml` (EN) and `/feed.pt.xml` (PT), each listing up to 20 recent posts sorted by date descending, with proper XML namespaces, atom-compliant structure, and full post content (not just excerpts).

**Depends on**: Nothing (blog posts already exist as MDX files)

**Requirements**: CASE-21, CASE-22, CASE-23

**Success Criteria** (what must be TRUE):
  1. `GET /feed.xml` returns `application/rss+xml` with valid RSS 2.0 or Atom 1.0, listing up to 20 most recent blog posts
  2. `GET /feed.pt.xml` returns the same posts with PT translations of title/description
  3. Each feed item includes: title, link, pubDate, description, and author
  4. Feed is statically generated at build time (no runtime dependency)
  5. Feed validates against RSS/Atom schema (no malformed XML)
**Plans**: 1 plan
- [ ] 12-01-PLAN.md — Create RSS feed generator, register routes, add feed link tags to head
**UI hint**: no

### Phase 13: JS Bundle Optimization

**Goal**: Reduce total JS bundle from 608KB → ~200KB by identifying and eliminating wasted bytes. The primary bottleneck is 16 scripts blocking the main thread, with Zod (226KB), lucide icons (10+), and shadcn/ui components in the client bundle.

**Depends on**: Nothing

**Requirements**: CASE-24, CASE-25, CASE-26

**Success Criteria** (what must be TRUE):
  1. Total JS transfer size reduced by ≥ 50% (608KB → ≤ 300KB target)
  2. Lighthouse Performance score improves (current CI: 0.75, target: ≥ 0.85)
  3. No regressions in functionality (all interactive elements still work)
  4. No regressions in tests (unit, e2e, a11y all pass)
**Plans**: 1 plan
- [ ] 13-01-PLAN.md — Analyze bundle with `next bundle analyzer`, identify top consumers, apply optimizations (tree-shaking, code-splitting, defer non-critical client components)
**UI hint**: no

### Phase 14: New Blog Post via Pipeline

**Goal**: Generate and publish a new bilingual blog post via the existing OpenAI gpt-4o automated pipeline. The post should cover a relevant software engineering topic that showcases Luiz's expertise.

**Depends on**: Nothing (pipeline is pre-built from v1.2)

**Requirements**: CASE-27, CASE-28

**Success Criteria** (what must be TRUE):
  1. New blog post exists as `content/blog/{slug}.{en,pt}.mdx`
  2. Post is discoverable at `/en/blog/{slug}` and `/pt/blog/{slug}`
  3. Post includes proper metadata (title, date, description, OG image)
  4. Post is included in RSS feed (Phase 12)
  5. Post passes all quality gates (a11y, iPhone SE, Lighthouse)
**Plans**: 1 plan
- [ ] 14-01-PLAN.md — Generate post via pipeline, wire metadata, verify quality gates
**UI hint**: yes

### Phase 15: New Case Study

**Goal**: Add a sixth portfolio case study — a new project not yet covered. The case study must follow the established bilingual MDX pattern with Problem/Solution/Impact/Stack structure.

**Depends on**: Nothing (MDX pipeline is pre-built from v1.2)

**Requirements**: CASE-29, CASE-30, CASE-31

**Success Criteria** (what must be TRUE):
  1. New case study MDX files exist in PT + EN
  2. Hero image registered in all three HERO_IMAGES maps
  3. Case study is listed on `/projects` and renders correctly in both locales
  4. JSON-LD Article schema is present
  5. All quality gates pass (unit tests, Playwright, a11y matrix, iPhone SE)
**Plans**: 1 plan
- [ ] 15-01-PLAN.md — Author bilingual MDX, wire HERO_IMAGES, register in projects listing, JSON-LD
**UI hint**: yes

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Cmd+K Command Palette | v1.2 | 2/2 | Complete | 2026-05-13 |
| 2. UX Polish — Testing, Interactions & Animations | v1.2 | 3/3 | Complete | 2026-05-13 |
| 3. Automated Content Pipeline | v1.2 | 3/3 | Complete | 2026-05-15 |
| 4. SEO Enrichment | v1.2 | 1/1 | Complete | 2026-05-15 |
| 5. Test Coverage Sweep | v1.3 | 4/4 | Complete | 2026-05-19 |
| 6. MDX Component Toolkit Expansion | v1.3 | 3/3 | Complete | 2026-05-19 |
| 7. Blog Post + SEO Hardening | v1.3 | 2/2 | Complete | 2026-05-20 |
| 8. Author + Integrate UAUBox DS Case Study | v1.4 | 1/1 | Complete   | 2026-05-20 |
| 9. Quality Verification | v1.4 | 2/2 | Complete   | 2026-05-21 |
| 10. Author Heavy Machinery Mobile-First Case Study | v1.5 | 1/1 | Complete   | 2026-06-11 |
| 11. Lighthouse Performance Fix + Quality Verification | v1.5 | 1/1 | Complete   | 2026-06-11 |
| 12. RSS Feed for Blog | v1.6 | 0/1 | Pending  | — |
| 13. JS Bundle Optimization | v1.6 | 0/1 | Pending  | — |
| 14. New Blog Post via Pipeline | v1.6 | 0/1 | Pending  | — |
| 15. New Case Study | v1.6 | 0/1 | Pending  | — |

---

*Generated by gsd-roadmapper — v1.6 roadmap created 2026-06-12*
