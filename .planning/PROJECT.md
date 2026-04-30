# pansarinitech — Luiz Pansarini Portfolio

## What This Is

A bilingual (PT/EN) personal portfolio website for **Luiz Pansarini**, Principal Software Engineer, designed to attract recruiters (BR + international), freelance clients, and the developer community. The site uses a **subtle Star Wars aesthetic** — light mode follows a Jedi palette (saber blue), dark mode follows a Sith palette (saber red) — with the theme toggle itself acting as the central themed feature. Built with Next.js, React, TypeScript, Tailwind CSS, and Shadcn/UI on Vercel.

## Core Value

**Land high-signal opportunities (jobs and freelance) by presenting Luiz's career narrative — IT support to Principal Engineer, BR scale to US market — through a portfolio that is fast, accessible, mobile-first, and memorable without being unprofessional.**

If everything else fails, the site must load fast on a recruiter's phone, communicate "Principal-level full-stack engineer" within 5 seconds, and have a clear path to "contact / hire / message me."

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. Hypotheses until validated. -->

**Foundation**
- [ ] Next.js 16 (App Router) + TypeScript + Tailwind CSS + Shadcn/UI scaffold deployed on Vercel
- [ ] Bilingual content (PT + EN) via next-intl with `/pt` and `/en` routes, browser auto-detect, header toggle, hreflang tags
- [ ] Light/Dark mode toggle mapped to Jedi/Sith palettes — palette tokens via CSS vars, persists in localStorage, respects `prefers-color-scheme` on first visit

**Content sections**
- [ ] Hero + About section — name, role, short bio, location, primary CTAs
- [ ] Featured Projects section with 3 case studies:
  - Heavy Machinery e-commerce (Machinery Partner — first US heavy machinery e-commerce)
  - No-code → Next.js + headless CMS migration (Machinery Partner — technical leadership)
  - Magazine Luiza Superapp (React Native WebViews at scale)
- [ ] Career / Experience timeline (Klabin → UAUBox → Corebiz → Luizalabs → Machinery Partner)
- [ ] Skills / Stack section (organized by category, no skill bars/percentages)
- [ ] Blog / Notes section authored in MDX with at least scaffolding + first post
- [ ] Now page (`/now`) showing current focus, projects, what Luiz is reading/learning
- [ ] Contact section with email + LinkedIn + GitHub + optional resume download (PT and EN PDFs)

**Quality gates**
- [ ] Mobile-first responsive design — works flawlessly on iPhone SE (375px) up
- [ ] WCAG 2.1 AA compliance — focus rings, keyboard nav, semantic HTML, alt text, color contrast
- [ ] `prefers-reduced-motion` respected — all decorative animations disable when reduced motion is on
- [ ] Lighthouse: Performance ≥ 95, Accessibility ≥ 100, Best Practices ≥ 95, SEO ≥ 95
- [ ] Open Graph + Twitter card metadata for both locales
- [ ] Sitemap.xml + robots.txt
- [ ] Analytics (Vercel Analytics or Plausible — privacy-respecting, no consent banner needed)

**Star Wars touches (subtle)**
- [ ] Saber-glow accent color drives focus rings, link hover, primary CTAs (blue in light/Jedi, red in dark/Sith)
- [ ] Theme toggle UX is the centerpiece — hovering shows Jedi/Sith hint
- [ ] One small SW reference on the 404 page ("These aren't the pages you're looking for")
- [ ] No SFX, no autoplay video, no 3D — keeps a11y + mobile + performance budgets clean

### Out of Scope

<!-- Explicit boundaries. Reasons included to prevent re-adding. -->

- **3D scenes / WebGL hyperspace intros** — conflicts with mobile-first, a11y, and performance budgets
- **Sound effects (lightsaber hum, R2-D2 beeps)** — autoplay audio is hostile UX and an a11y red flag
- **Lightsaber cursor / custom cursor** — unreliable on mobile, hurts a11y, gimmicky for professional audience
- **Aurebesh as primary navigation labels** — illegible to non-fans (recruiters); only as decorative numerals
- **CMS for blog** — MDX in repo is sufficient for v1; no operational overhead
- **Comments on blog** — no moderation appetite; LinkedIn / X discussions instead
- **Spanish locale** — Luiz's Spanish is basic; not worth the dual-authoring cost in v1
- **Uses page** — Now page covers similar ground; avoid maintenance sprawl
- **Design System case (UAUBox)** — Luiz prioritized 3 stronger cases; deferred to v2
- **Newsletter signup / lead capture** — overkill for personal portfolio v1
- **Dark/light mode beyond Jedi/Sith themes** — single toggle, two palettes, period

## Context

**About Luiz** — see `~/.claude/projects/-Users-luizpansarini-Documents-Projetos-Pessoal-pansarinitech/memory/user_profile.md` for full profile.

**Career narrative worth surfacing on the site:**
- 14 years in tech total. Started as IT Support Analyst at Klabin S/A (2012–2019, 7 years), then transitioned into software engineering at UAUBox (2019). Reached Principal at Machinery Partner in 2023 — a non-traditional but credible arc that resonates with career-changers and BR audiences.
- At **Machinery Partner**: leading the first US-market e-commerce for Heavy Machinery, mobile app (React Native + Expo), backend services (Fastify, Elysia/Bun), ERP integrations (Odoo). Stack matches portfolio stack — strong "I build with what I show" signal.
- At **Magazine Luiza (Luizalabs)**: shipped React Native features inside the Superapp at scale, with 95%+ test coverage. Brings BR-mass-market credibility.

**Reference inspiration:** [patticatti.vercel.app](https://patticatti.vercel.app/) — admired for its blend of professional polish with authentic personality (gaming, coffee, art). The Star Wars + theme-toggle approach is Luiz's analogous personal hook.

**Stack rationale:** Stack is locked to Next.js + TypeScript + Tailwind + Shadcn/UI + Vercel because it matches Luiz's daily work — zero learning curve, the portfolio itself is a sample of his production work.

**Bilingual strategy:** Browser locale auto-detects on `/`, redirects to `/pt` or `/en`. Both locales author the same content sections; hreflang prevents SEO duplication. Resume PDFs (already authored in both languages) are linked from each locale's contact section.

## Constraints

- **Tech stack**: Next.js 16 + React + TypeScript + Tailwind CSS + Shadcn/UI + Vercel — locked because it mirrors Luiz's daily production stack
- **Mobile**: Mobile-first, must work cleanly on iPhone SE (375px) up — recruiters often open links on phones
- **Accessibility**: WCAG 2.1 AA — non-negotiable; respects `prefers-reduced-motion` and `prefers-color-scheme`
- **Performance**: Lighthouse Performance ≥ 95 on mobile — fast first paint, minimal JS payload, optimized images (next/image)
- **Bilingual content**: Every user-facing copy must be authored in both PT and EN before shipping a locale
- **Theme tokens**: All color usage flows through CSS variables — palette swaps cleanly between Jedi/Sith without per-component code changes
- **No external CMS for v1**: Blog uses MDX in the repo; one source of truth, no infra cost
- **Hosting**: Vercel (matches existing workflow); custom domain TBD (likely `pansarini.tech` to match repo name)
- **Theme intensity**: Star Wars references stay subtle — no element should make a conservative recruiter raise an eyebrow

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + TS + Tailwind + Shadcn + Vercel stack | Matches Luiz's production daily stack at Machinery Partner; portfolio doubles as proof of work | — Pending |
| Star Wars aesthetic via Light=Jedi / Dark=Sith theme toggle | Makes the theme functional (a11y feature) rather than decorative; subtle for recruiters, recognizable for fans | — Pending |
| Bilingual PT + EN with next-intl | Audience spans BR + international; authoring in both signals discipline and unlocks intl reach | — Pending |
| Subtle theme intensity over immersive | Hard requirement: mobile-first + a11y; immersive 3D/SFX conflicts with both | — Pending |
| Blog in MDX, not external CMS | v1 simplicity, no infra; can migrate later if blog grows | — Pending |
| Featured cases: Heavy Machinery e-commerce, no-code → Next.js migration, Magazine Luiza Superapp | Strongest 3 differentiators (unique domain, technical leadership, BR scale); Design System (UAUBox) deferred | — Pending |
| Contact via direct links + email; no contact form in v1 | Forms add anti-spam complexity; mailto + LinkedIn covers 95% of intent | — Pending |
| Now page included; Uses page deferred | Now signals current activity (more dynamic); Uses overlaps with Skills section | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-30 after initialization*
