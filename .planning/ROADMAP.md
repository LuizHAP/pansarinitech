# Roadmap — v1.2 UX Polish + Automated Content Pipeline

**Milestone:** v1.2
**Status:** Active
**Last updated:** 2026-05-13
**Granularity:** Coarse

---

## Previous Milestones

- ✅ **v1.0 Public Launch** — Phases 1-5 (shipped 2026-05-02) — see `milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Polish, Quality & Test Baseline** — Phases 1-2 (shipped 2026-05-04) — see `milestones/v1.1-ROADMAP.md`

---

## Phases

- [x] **Phase 1: Cmd+K Command Palette** — Full-featured keyboard command palette accessible from anywhere on the site (completed 2026-05-13)
- [ ] **Phase 2: UX Polish — Testing, Interactions & Animations** — Copy-email tests, Personal Projects polish, and micro-interaction refinements across all sections
- [ ] **Phase 3: Automated Content Pipeline** — Scheduled Claude Code agent that generates bilingual MDX posts and opens GitHub PRs for human review
- [ ] **Phase 4: SEO Enrichment** — MDX heading typography fix + JSON-LD structured data for blog and project posts

---

## Phase Details

### Phase 1: Cmd+K Command Palette
**Goal**: Users can open a fast, keyboard-navigable command palette from anywhere on the site and execute navigation, theme, locale, and quick-link actions without touching the mouse
**Depends on**: Nothing (independent feature addition on top of v1.1 baseline)
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07
**Success Criteria** (what must be TRUE):
  1. Pressing Cmd+K (macOS) or Ctrl+K (Windows/Linux) from any page or scroll position opens the command palette
  2. User can navigate to any homepage section (Hero, About, Projects, Skills, Blog, Contact) by selecting the corresponding palette command
  3. User can toggle Jedi/Sith theme and switch PT/EN locale directly from the palette without a full page reload
  4. User can open Resume PT, Resume EN, LinkedIn, and GitHub from palette quick-link commands
  5. Palette is fully keyboard-accessible: arrow keys move between items, Enter executes, Escape closes, and focus is trapped inside while open; mobile users can dismiss via close button or backdrop tap
**Plans**: 2 plans
  - [x] 01-P1-PLAN.md — Foundation: install Shadcn command+dialog, add `id="hero"`, populate `commandPalette` i18n namespace, update vitest config
  - [x] 01-P2-PLAN.md — Build CommandPalette + CommandPaletteTrigger client components, wire into header.tsx and layout.tsx, add tests, human verify
**UI hint**: yes

### Phase 2: UX Polish — Testing, Interactions & Animations
**Goal**: The copy-email button has full test coverage, the Personal Projects section matches the quality standard of the rest of the site, and micro-interactions across all sections feel consistent and intentional
**Depends on**: Phase 1 (Phase 1 ships palette; UX-12 polish scope spans all sections including the new palette)
**Requirements**: UX-08, UX-09, UX-10, UX-11, UX-12
**Success Criteria** (what must be TRUE):
  1. Clicking the copy-email button shows a check-icon confirmation, resets after a timeout, and announces the action accessibly — and all of this is covered by Vitest + RTL tests (resolving TD-07)
  2. The Personal Projects section visually matches the quality and layout of other homepage sections (Featured Projects, Skills, Career) at all breakpoints
  3. Personal Projects cards animate in with a scroll-reveal stagger pattern consistent with the v1.1 animation system
  4. Hover states, focus rings, and scroll-reveal entry timings are consistent across all homepage sections — no section feels out of sync with the others
**Plans**: 3 plans
  - [ ] 02-01-PLAN.md — CopyEmailButton icon swap (AnimatePresence + Check icon) + Test 7 icon-swap assertion
  - [ ] 02-02-PLAN.md — Micro-interaction fixes: Skills focus ring DEV-1 + NowPreview link DEV-2
  - [ ] 02-03-PLAN.md — Personal Projects screenshot wiring (human hand-off) + UX-11 stagger visual verify
**UI hint**: yes

### Phase 3: Automated Content Pipeline
**Goal**: A scheduled Claude Code agent runs every 5 days, generates a bilingual (PT + EN) MDX blog post draft with valid frontmatter and topic rotation, and opens a GitHub PR so Luiz can review and approve before the post goes live
**Depends on**: Nothing (infrastructure layer independent of Phases 1 and 2)
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07
**Success Criteria** (what must be TRUE):
  1. Every 5 days a new git branch appears in the repo containing two new MDX files (`content/blog/[slug].en.mdx` and `content/blog/[slug].pt.mdx`) with all required frontmatter fields valid against the `PostFrontmatter` Zod schema
  2. The topic of each generated post rotates across the four defined areas (Next.js/React/frontend, Software Engineering/career, AI in development, Personal projects/open source) and does not repeat the immediately previous topic
  3. A GitHub PR is opened automatically for each generated post, and merging that PR triggers the existing Vercel CI deploy with no additional configuration required
  4. Generated MDX files contain no inline JS, dynamic imports, or constructs that would be stripped by `next-mdx-remote` v6's `blockJS: true` default — posts render correctly in the existing blog pipeline
**Plans**: TBD

### Phase 4: SEO Enrichment
**Goal**: Blog and project post pages are discoverable and machine-readable — headings are visually clear and semantically structured, and every post carries a JSON-LD block that search engines and AI crawlers can parse
**Depends on**: Phase 3 (content pipeline generates posts — SEO scaffolding should be in place before posts accumulate)
**Requirements**: SEO-01, SEO-02
**Success Criteria** (what must be TRUE):
  1. Rendering any blog or project MDX post shows clearly spaced, visually distinct `h1`/`h2`/`h3` headings — each heading has enough top/bottom margin that it reads as a section break, not a run-on paragraph
  2. Every blog post route (`/[locale]/blog/[slug]`) and project post route (if applicable) includes a valid `<script type="application/ld+json">` block — `Article` for blog posts, appropriate schema for project posts — populated from the post's MDX frontmatter
  3. Lighthouse SEO score remains ≥ 95 and no structured data errors appear in Google's Rich Results Test
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Cmd+K Command Palette | 2/2 | Complete   | 2026-05-13 |
| 2. UX Polish — Testing, Interactions & Animations | 0/3 | Not started | - |
| 3. Automated Content Pipeline | 0/2 | Not started | - |
| 4. SEO Enrichment | 0/TBD | Not started | - |

---

## Coverage

| REQ-ID | Phase | Description |
|--------|-------|-------------|
| UX-01 | Phase 1 | Open palette via Cmd+K / Ctrl+K |
| UX-02 | Phase 1 | Navigation commands (Hero, About, Projects, Skills, Blog, Contact) |
| UX-03 | Phase 1 | Theme toggle command |
| UX-04 | Phase 1 | Locale switch command |
| UX-05 | Phase 1 | Quick-link commands (Resume PT/EN, LinkedIn, GitHub) |
| UX-06 | Phase 1 | Keyboard accessibility (focus trap, Esc, arrows, Enter) |
| UX-07 | Phase 1 | Mobile dismiss target |
| UX-08 | Phase 2 | RTL tests for copy-email clipboard + toast (TD-07) |
| UX-09 | Phase 2 | Copy-email visual polish (check icon, reset timeout, a11y announcement) |
| UX-10 | Phase 2 | Personal Projects layout refinement |
| UX-11 | Phase 2 | Personal Projects scroll-reveal stagger animations |
| UX-12 | Phase 2 | Micro-interactions polish across all sections |
| PIPE-01 | Phase 3 | Scheduled agent every 5 days generates bilingual MDX draft |
| PIPE-02 | Phase 3 | Topic rotation across 4 areas |
| PIPE-03 | Phase 3 | Valid frontmatter against PostFrontmatter Zod schema |
| PIPE-04 | Phase 3 | Agent creates git branch + opens GitHub PR |
| PIPE-05 | Phase 3 | Merging PR triggers Vercel auto-deploy via existing CI |
| PIPE-06 | Phase 3 | Tracks recent topics to avoid consecutive duplicates |
| PIPE-07 | Phase 3 | Posts follow content/blog/ structure and MDX conventions |
| SEO-01 | Phase 4 | MDX heading typography — spacing and visual hierarchy in blog + project posts |
| SEO-02 | Phase 4 | JSON-LD structured data (Article / SoftwareApplication) for all post pages |

**Total:** 21/21 requirements mapped. No orphans.

---
*Generated by gsd-roadmapper*
