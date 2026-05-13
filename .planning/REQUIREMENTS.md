# Requirements — v1.2 UX Polish + Automated Content Pipeline

**Milestone:** v1.2
**Status:** Active
**Last updated:** 2026-05-13

---

## UX Polish

### Cmd+K Command Palette

- [x] **UX-01**: User can open a command palette with Cmd+K / Ctrl+K from anywhere on the site
- [x] **UX-02**: Palette lists navigation commands — jump to Hero, About, Projects, Skills, Blog, Contact
- [x] **UX-03**: Palette has a theme toggle command — switch Jedi/Sith inline without leaving the current view
- [x] **UX-04**: Palette has a locale switch command — PT ↔ EN with locale-preserving navigation
- [x] **UX-05**: Palette has quick-link commands — open Resume (PT), Resume (EN), LinkedIn, GitHub
- [x] **UX-06**: Palette is keyboard-accessible: focus trap, Escape to dismiss, arrow key navigation, Enter executes
- [x] **UX-07**: Palette has a visible dismiss target for mobile users (close button or backdrop tap; no Cmd key on mobile)

### Copy-Email Button

- [x] **UX-08**: `copy-email-button.tsx` has Vitest + RTL tests covering clipboard API mock and Sonner toast verification (resolves TD-07)
- [x] **UX-09**: Copy-email interaction is visually polished — check icon confirmation, reset timeout, accessible status announcement

### Personal Projects Section

- [ ] **UX-10**: Personal Projects section layout is refined to match the quality standard of other homepage sections
- [ ] **UX-11**: Personal Projects section has scroll-reveal stagger animations consistent with the v1.1 animation system

### Micro-Interactions

- [ ] **UX-12**: Hover states, focus rings, and scroll-reveal timings are polished across all homepage sections

---

## Automated Content Pipeline

### Generation

- [ ] **PIPE-01**: A Claude Code scheduled agent runs every 5 days and generates a bilingual (PT + EN) MDX blog post draft
- [ ] **PIPE-02**: Topics rotate in round-robin across 4 areas: Next.js/React/frontend, Software Engineering/career, AI applied to development, Personal projects/open source
- [ ] **PIPE-03**: Generated MDX files include all required frontmatter (title, description, publishedAt, tags, slug) valid against the existing `PostFrontmatter` Zod schema, for both locales

### Publishing Flow

- [ ] **PIPE-04**: The scheduled agent creates a git branch and opens a GitHub PR with the generated MDX files for human review and approval
- [ ] **PIPE-05**: Merging the approved PR triggers Vercel auto-deploy via the existing CI pipeline (no new Vercel config required)

### Quality

- [ ] **PIPE-06**: Pipeline tracks recently generated topic history to avoid consecutive duplicate themes
- [ ] **PIPE-07**: Generated posts follow site's existing MDX content conventions: `content/blog/[slug].[locale].mdx` file structure, frontmatter schema, no inline JS or dynamic imports (respects `blockJS: true` default from next-mdx-remote v6)

---

## SEO Enrichment

### MDX Content Quality

- [ ] **SEO-01**: Blog and project MDX posts render headings with proper vertical spacing and visual hierarchy — `h1`/`h2`/`h3` are clearly distinguished, margins separate them from surrounding body text, and the heading structure reads as an outline for crawlers
- [ ] **SEO-02**: Every blog post and project post page includes a JSON-LD `<script type="application/ld+json">` block — `Article` schema for blog posts, `SoftwareApplication` or `WebPage` schema for project posts — with `name`, `description`, `author`, `datePublished`, `url`, and `inLanguage` fields populated from the MDX frontmatter

---

## Future Requirements (Deferred)

- **RSS feed** — revisit if blog reaches 3+ posts during v1.2; candidate for v1.3
- **`pansarini.tech` custom domain cutover** — candidate for a standalone quick task or v1.3
- **case-study-hero.tsx and easter-egg.tsx tests** — TD-07 remaining items; v1.2 stretch goal
- **theme-provider.tsx test** — TD-07 remaining; tricky with `next-themes` internal state; carry to v1.3

---

## Out of Scope (v1.2)

- Newsletter / email capture — still overkill for personal portfolio
- Comment system on blog — no moderation appetite; LinkedIn/X discussions instead
- AI-generated images for blog posts — adds complexity without value for text-first content
- Mobile-native Cmd+K equivalent (native app) — web palette with mobile dismiss target is sufficient
- Automated publishing without human review — human PR approval is a non-negotiable gate

---

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| UX-01 | Phase 1 | TBD | Pending |
| UX-02 | Phase 1 | TBD | Pending |
| UX-03 | Phase 1 | TBD | Pending |
| UX-04 | Phase 1 | TBD | Pending |
| UX-05 | Phase 1 | TBD | Pending |
| UX-06 | Phase 1 | TBD | Pending |
| UX-07 | Phase 1 | TBD | Pending |
| UX-08 | Phase 2 | 02-01 | Complete |
| UX-09 | Phase 2 | 02-01 | Complete |
| UX-10 | Phase 2 | TBD | Pending |
| UX-11 | Phase 2 | TBD | Pending |
| UX-12 | Phase 2 | TBD | Pending |
| PIPE-01 | Phase 3 | TBD | Pending |
| PIPE-02 | Phase 3 | TBD | Pending |
| PIPE-03 | Phase 3 | TBD | Pending |
| PIPE-04 | Phase 3 | TBD | Pending |
| PIPE-05 | Phase 3 | TBD | Pending |
| PIPE-06 | Phase 3 | TBD | Pending |
| PIPE-07 | Phase 3 | TBD | Pending |
| SEO-01 | Phase 4 | TBD | Pending |
| SEO-02 | Phase 4 | TBD | Pending |
