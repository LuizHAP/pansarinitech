# pansarinitech — Luiz Pansarini Portfolio

## What This Is

A bilingual (PT/EN) personal portfolio website for **Luiz Pansarini**, Principal Software Engineer, designed to attract recruiters (BR + international), freelance clients, and the developer community. The site uses a **subtle Star Wars aesthetic** — light mode follows a Jedi palette (saber blue), dark mode follows a Sith palette (saber red) — with the theme toggle itself acting as the central themed feature. Built with Next.js 16, React 19, TypeScript, Tailwind v4, and Shadcn/UI on Vercel.

## Core Value

**Land high-signal opportunities (jobs and freelance) by presenting Luiz's career narrative — IT support to Principal Engineer, BR scale to US market — through a portfolio that is fast, accessible, mobile-first, and memorable without being unprofessional.**

If everything else fails, the site must load fast on a recruiter's phone, communicate "Principal-level full-stack engineer" within 5 seconds, and have a clear path to "contact / hire / message me."

## Current State

**✅ v1.2 shipped 2026-05-15** — 4 phases, 9 plans, 135 files changed, ~9,200 insertions. Full archive: `.planning/milestones/v1.2-ROADMAP.md`.

Key additions in v1.2:
- Cmd+K command palette (14 commands, keyboard-accessible, 22 RTL tests)
- UX polish: CopyEmailButton tests (TD-07 resolved), Personal Projects stagger animations, micro-interactions
- Automated bilingual content pipeline: OpenAI gpt-4o generates PT+EN MDX posts, opens GitHub PRs
- JSON-LD structured data (Article + WebPage schema.org) on all blog and project post pages

**Previously shipped:** v1.1 Polish, Quality & Test Baseline (2026-05-04) — full archive: `.planning/milestones/v1.1-ROADMAP.md`.
**Previously shipped:** v1.0 Public Launch (2026-05-02) — full archive: `.planning/milestones/v1.0-ROADMAP.md`.

**Next milestone:** Planning v1.3 — run `/gsd-new-milestone`.

**Live deliverables:**
- Bilingual portfolio (PT + EN) at `/pt` and `/en` with browser auto-detect, path-preserving locale toggle, and hreflang reciprocity.
- Light/Dark theme as Jedi/Sith with View Transitions API radial-reveal toggle (~420ms clip-path circle from click coordinate, 200ms `vt-fade` fallback under `prefers-reduced-motion`, instant-swap fallback on unsupported browsers).
- Hero / About / Featured Projects (3 case studies) / Career timeline / Skills / Now / Contact / 404 sections — all bilingual.
- 3 case studies authored bilingually (Heavy Machinery e-commerce, no-code → Next.js migration, Magazine Luiza Superapp) via `next-mdx-remote@^6` RSC pipeline with build-time syntax highlighting (Shiki dual-theme).
- Blog scaffolding + first launch post (`building-this-portfolio.{en,pt}.mdx`, ~1500 words).
- Full SEO: `generateMetadata` on every route, multilingual sitemap (`xhtml:link` hreflang triplets), env-gated robots, dynamic Sith-red OG images per route, favicons + manifest, X-Robots-Tag preview defense.
- CI gate: a11y matrix (24/24) + iPhone SE (48/48) + Sith contrast (4/4) + Phase 5 e2e (9/9 across 6 critical flows) — chromium-only, retries: 1 in CI, < 3 min total.
- Vercel Analytics + Speed Insights ingest live on Hobby tier.

**Not yet live:** custom domain `pansarini.tech` rollout (currently `pansarinitech.vercel.app`).

## Current Milestone: v1.3 Blog Enrichment + Quality Hardening

**Goal:** Ship a richer blog authoring baseline (MDX component toolkit usable in all future posts), achieve full 100% test coverage across the codebase, and complete hreflang + Knowledge Graph SEO hardening.

**Target features:**
- MDX component toolkit: Callouts/Admonitions, Code-with-filename blocks, Copy-to-clipboard on code blocks, Inline badges/tags — bilingual-compatible, a11y-clean, foundation for all future posts
- Automated pipeline updated to reference the new components so AI-generated posts use them
- New blog post: "View Transitions API on the theme toggle" — authored bilingually (PT + EN), showcases the new toolkit
- Full 100% test coverage sweep: audit all components (TD-07 remainder: case-study-hero, easter-egg, theme-provider; json-ld.tsx; all others below threshold)
- hreflang `alternates.languages` emitted via `buildMetadata` on all routes
- `AUTHOR_PERSON` JSON-LD: `url` + `sameAs` (GitHub, LinkedIn) in the existing JsonLd RSC

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

**v1.0 Public Launch (2026-05-02)** — full archive at `.planning/milestones/v1.0-REQUIREMENTS.md`. All 53 traceable REQ-IDs verified at phase level (audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`).

**Foundation:**
- ✓ Next.js 16 (App Router) + TypeScript + Tailwind v4 + Shadcn/UI scaffold deployed on Vercel — v1.0
- ✓ Bilingual content (PT + EN) via next-intl with `/pt` and `/en` routes, browser auto-detect, header toggle, hreflang tags — v1.0
- ✓ Light/Dark mode toggle mapped to Jedi/Sith palettes with no flash of wrong theme on slow-3G; first visit honors `prefers-color-scheme`; View Transitions radial reveal with reduced-motion fallback — v1.0

**Content sections:**
- ✓ Hero + About — name, role, country (city omitted by privacy decision D-07), value prop, CTAs — v1.0
- ✓ Featured Projects — 3 case studies (Heavy Machinery e-commerce, no-code → Next.js migration, Magazine Luiza Superapp) — v1.0
- ✓ Career / Experience timeline (Klabin → UAUBox → Corebiz → Luizalabs → Machinery Partner) — v1.0
- ✓ Skills / Stack section grouped by category, no skill bars/percentages — v1.0
- ✓ Blog / Notes section in MDX with first launch post (PT + EN) — v1.0
- ✓ Now page (`/now`) with prominent `<time dateTime>` — v1.0
- ✓ Contact section — mailto with locale-aware prefilled subject, click-to-copy email (Sonner toast), LinkedIn, GitHub, bilingual Resume PDFs — v1.0

**Quality gates:**
- ✓ Mobile-first responsive design — iPhone SE (375px) Playwright gate (48/48 tests) — v1.0
- ✓ WCAG 2.1 AA — focus rings, keyboard nav, semantic HTML, alt text, color contrast (axe matrix 24/24 across en/pt × light/dark × home/404) — v1.0
- ✓ `prefers-reduced-motion` respected — all decorative animations disable; View Transitions fade fallback locked at the animation layer — v1.0
- ✓ Lighthouse: a11y minScore 1.0 (CI-enforced), Perf 0.95, SEO 0.95, Best Practices 0.95 — v1.0 (production main-only run is post-deploy HUMAN-UAT carry-forward)
- ✓ Open Graph + Twitter card metadata for both locales — v1.0
- ✓ Sitemap.xml (with `xhtml:link` hreflang reciprocity) + robots.txt (env-gated) — v1.0
- ✓ Vercel Analytics + Speed Insights (privacy-respecting, no consent banner) — v1.0

**Star Wars touches (subtle):**
- ✓ Saber-glow accent color drives focus rings, link hover, primary CTAs (saber blue Jedi / saber red Sith) — v1.0
- ✓ Theme toggle UX is the centerpiece — View Transitions radial reveal + Jedi/Sith hint — v1.0
- ✓ One small SW reference on the 404 page ("These aren't the pages you're looking for" / "Estas não são as páginas que você procura") — v1.0
- ✓ No SFX, no autoplay video, no 3D — discipline held through v1 — v1.0

**Post-launch hardening (Phase 5):**
- ✓ Native View Transitions API on theme toggle with reduced-motion fallback and feature-gate fallback — v1.0
- ✓ Playwright E2E in CI as a gating step covering 6 critical flows (locale, theme, navigation, downloads, 404, projects) — v1.0

**v1.1 Polish, Quality & Test Baseline (2026-05-04)** — full archive at `.planning/milestones/v1.1-ROADMAP.md`. All 25 REQ-IDs verified (audit: `.planning/milestones/v1.1-MILESTONE-AUDIT.md`).
- ✓ About section redesign (stats row + bullets + condensed paragraph) — v1.1
- ✓ Skills section redesign (filter chips + responsive grid) — v1.1
- ✓ Scroll-reveal stagger animations (Career, Featured Projects, Blog, Contact) — v1.1
- ✓ Vitest 4 + V8 coverage setup with per-file 100% thresholds + CI gate — v1.1 Phase 01
- ✓ 100% unit coverage on 7 pure-logic files (110 tests, co-located) — v1.1 Phase 01
- ✓ Barrel exports (`index.ts`) in `components/{sections,shared,blog,ui}` (mdx/ untouched per D-03) — v1.1 Phase 02
- ✓ Naming conventions: curated named re-exports, Shadcn variants module-private, Biome-canonical import order — v1.1 Phase 02
- ✓ Component test layer: jsdom + RTL, 23 test files, 167 tests across 16 components at 70/60/70/70 gate — v1.1 quick tasks
- ✓ WCAG 2.1 AA contrast regressions fixed in `globals.css`, `about.tsx`, `skills.tsx` — v1.1

**v1.2 UX Polish + Automated Content Pipeline (shipped 2026-05-15)**
- ✓ Cmd+K command palette — keyboard-first navigation, 14 commands, 22 RTL tests — v1.2 Phase 1
- ✓ CopyEmailButton RTL tests resolving TD-07 + check-icon AnimatePresence polish — v1.2 Phase 2
- ✓ Personal Projects section: scroll-reveal stagger + quality matching Featured Projects — v1.2 Phase 2
- ✓ Micro-interactions polished (Skills focus rings, NowPreview links) across all sections — v1.2 Phase 2
- ✓ Automated bilingual content pipeline (OpenAI gpt-4o, GitHub Actions, PR-per-post) — v1.2 Phase 3
- ✓ JSON-LD Article + WebPage schema.org on all blog and project post pages — v1.2 Phase 4
- ✓ Prose heading overrides (`prose-h2:mt-10 prose-h3:mt-8`) for visual hierarchy — v1.2 Phase 4

### Active

<!-- Next milestone candidates. Hypotheses until validated. -->

**v1.3 Blog Enrichment + Quality Hardening** (in planning)

- [ ] MDX component toolkit: Callouts, Code-with-filename, Copy-to-clipboard, Inline badges (bilingual-compatible, a11y-clean)
- [ ] Automated pipeline updated to reference new MDX components
- [ ] Blog post "View Transitions API on the theme toggle" (PT + EN, code-heavy)
- [ ] Full 100% test coverage sweep (all components; TD-07 remainder + json-ld.tsx + others below threshold)
- [ ] `hreflang alternates.languages` in `buildMetadata` (currently only canonical emitted)
- [ ] `AUTHOR_PERSON` Knowledge Graph linkage (`url` + `sameAs` in JSON-LD)

### Out of Scope

<!-- Explicit boundaries. Reasons included to prevent re-adding. -->

- **3D scenes / WebGL hyperspace intros** — conflicts with mobile-first, a11y, and performance budgets
- **Sound effects (lightsaber hum, R2-D2 beeps)** — autoplay audio is hostile UX and an a11y red flag
- **Lightsaber cursor / custom cursor** — unreliable on mobile, hurts a11y, gimmicky for professional audience
- **Aurebesh as primary navigation labels** — illegible to non-fans (recruiters); only as decorative numerals (currently fallback binary; AurekFonts OFL/MIT real binary shipped Phase 2)
- **CMS for blog** — MDX in repo is sufficient; no operational overhead. Migration to Fumadocs MDX is the documented future path if blog grows.
- **Comments on blog** — no moderation appetite; LinkedIn / X discussions instead
- **Spanish locale** — Luiz's Spanish is basic; not worth the dual-authoring cost in v1
- **Uses page** — Now page covers similar ground; avoid maintenance sprawl
- **Design System case (UAUBox)** — Luiz prioritized 3 stronger cases; deferred to v2
- **Newsletter signup / lead capture** — overkill for personal portfolio v1
- **Dark/light mode beyond Jedi/Sith themes** — single toggle, two palettes, period
- ~~**Cmd+K command palette**~~ — promoted to v1.2 Active (deferred from Phase 5 D-12, now validated demand)
- ~~**RSS feed**~~ — may be promoted in v1.2 if blog reaches 3+ posts during the milestone
- **nownownow.com submission** — deferred to post-launch validation (Phase 5 D-12)
- **Console easter egg expansion** — Phase 4 EASTER-02 ships the saber ASCII + repo link; further expansion deferred (Phase 5 D-12)
- **next-seo / contentlayer / framer-motion (the npm name)** — anti-patterns in 2026; built-in Metadata API + Velite/next-mdx-remote + `motion` package are the locked alternatives
- **Mocking the database/MDX pipeline in tests** — integration tests run against `next build && next start` production bundle (Phase 5 D-07)
- **`continue-on-error` in CI for the e2e suite** — failure must block merge (Phase 5 D-18)

## Context

**About Luiz** — see `~/.claude/projects/-Users-luizpansarini-Documents-Projetos-Pessoal-pansarinitech/memory/user_profile.md` for full profile.

**Career narrative surfaced on the site:**
- 14 years in tech total. Started as IT Support Analyst at Klabin S/A (2012–2019, 7 years), then transitioned into software engineering at UAUBox (2019). Reached Principal at Machinery Partner in 2023 — a non-traditional but credible arc that resonates with career-changers and BR audiences.
- At **Machinery Partner**: leading the first US-market e-commerce for Heavy Machinery, mobile app (React Native + Expo), backend services (Fastify, Elysia/Bun), ERP integrations (Odoo). Stack matches portfolio stack — strong "I build with what I show" signal.
- At **Magazine Luiza (Luizalabs)**: shipped React Native features inside the Superapp at scale, with 95%+ test coverage. Brings BR-mass-market credibility.

**Reference inspiration:** [patticatti.vercel.app](https://patticatti.vercel.app/) — admired for its blend of professional polish with authentic personality (gaming, coffee, art). The Star Wars + theme-toggle approach is Luiz's analogous personal hook.

**Stack rationale:** Stack is locked to Next.js + TypeScript + Tailwind + Shadcn/UI + Vercel because it matches Luiz's daily work — zero learning curve, the portfolio itself is a sample of his production work.

**Bilingual strategy:** Browser locale auto-detects on `/`, redirects to `/pt` or `/en`. Both locales author the same content sections; hreflang prevents SEO duplication. Resume PDFs (already authored in both languages) are linked from each locale's contact section.

**v1.1 codebase snapshot (2026-05-04):** ~6,400 LOC. 23 test files, 167 component tests + 110 unit tests = 277 tests total. `vitest.config.mts` governs two projects (node + jsdom). 4 barrel `index.ts` files cover all component directories. Biome-canonical import order across all 96 source files. 9 non-critical tech debt items carried into v1.2; full inventory in `.planning/milestones/v1.1-MILESTONE-AUDIT.md`.

**v1.0 codebase snapshot (2026-05-02):** ~6,000 LOC TS/TSX/CSS/MDX/MJS in `src/` + `content/` + `tests/`. 38 commits on `main`. Built with Next.js 16.2.4, React 19.2.4, Tailwind v4.1, next-intl 4.11, motion 12.x, next-mdx-remote 6.0.0, rehype-pretty-code 0.14, Shiki 4, Biome 2.x, Playwright (chromium-only).

## Constraints

- **Tech stack**: Next.js 16 + React + TypeScript + Tailwind CSS + Shadcn/UI + Vercel — locked because it mirrors Luiz's daily production stack
- **Mobile**: Mobile-first, must work cleanly on iPhone SE (375px) up — recruiters often open links on phones
- **Accessibility**: WCAG 2.1 AA — non-negotiable; respects `prefers-reduced-motion` and `prefers-color-scheme`
- **Performance**: Lighthouse Performance ≥ 95 on mobile — fast first paint, minimal JS payload, optimized images (next/image)
- **Bilingual content**: Every user-facing copy must be authored in both PT and EN before shipping a locale
- **Theme tokens**: All color usage flows through CSS variables (Tailwind v4 `@theme` OKLCH) — palette swaps cleanly between Jedi/Sith without per-component code changes
- **No external CMS for v1**: Blog uses MDX in the repo; one source of truth, no infra cost
- **Hosting**: Vercel (matches existing workflow); custom domain TBD (`pansarini.tech` reserved for v1.1 cutover)
- **Theme intensity**: Star Wars references stay subtle — no element should make a conservative recruiter raise an eyebrow
- **CI gate discipline**: All Playwright suites (a11y matrix, iPhone SE, Sith contrast, e2e) must pass; no `continue-on-error` on regression-blocking jobs

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + TS + Tailwind + Shadcn + Vercel stack | Matches Luiz's production daily stack at Machinery Partner; portfolio doubles as proof of work | ✓ Validated (v1.0) |
| Star Wars aesthetic via Light=Jedi / Dark=Sith theme toggle | Makes the theme functional (a11y feature) rather than decorative; subtle for recruiters, recognizable for fans | ✓ Validated (v1.0) |
| Bilingual PT + EN with next-intl | Audience spans BR + international; authoring in both signals discipline and unlocks intl reach | ✓ Validated (v1.0) |
| Subtle theme intensity over immersive | Hard requirement: mobile-first + a11y; immersive 3D/SFX conflicts with both | ✓ Validated (v1.0) |
| Blog in MDX, not external CMS | v1 simplicity, no infra; can migrate later if blog grows | ✓ Validated (v1.0) |
| Featured cases: Heavy Machinery e-commerce, no-code → Next.js migration, Magazine Luiza Superapp | Strongest 3 differentiators (unique domain, technical leadership, BR scale); Design System (UAUBox) deferred | ✓ Validated (v1.0) |
| Contact via direct links + email; no contact form in v1 | Forms add anti-spam complexity; mailto + LinkedIn covers 95% of intent | ✓ Validated (v1.0) |
| Now page included; Uses page deferred | Now signals current activity (more dynamic); Uses overlaps with Skills section | ✓ Validated (v1.0) |
| Biome single-binary toolchain over ESLint+Prettier (Phase 1 D-16/D-25 mid-flight swap) | Single dependency, single config, CI-fast; the locked `next/link` rule is expressed via Biome's `noRestrictedImports` with overrides for `src/lib/i18n/navigation.ts` | ✓ Validated (v1.0) |
| Sith primary darkened to `oklch(54% 0.21 28)` (Phase 1 contrast fix) | Original `oklch(58%)` failed WCAG 1.4.3 AA on dark-mode 404 CTA (4.33:1, needed 4.5:1); darkening to 54% achieves ~5.0:1 while staying visually saber red | ✓ Validated (v1.0) |
| Catch-all `[locale]/[...rest]/page.tsx` calling `notFound()` over redirect-based locale-aware 404 | Redirect from root not-found to `/{locale}/not-found` caused infinite loop in Next 16; the catch-all + `notFound()` pattern keeps `[locale]/not-found.tsx` reachable as ● SSG | ✓ Validated (v1.0) |
| `next-mdx-remote@^6` final stable over `@^5` (Phase 3 pin upgrade) | v6.0.0 (final stable, 2026-02-12) is the right pin; `blockJS` + `blockDangerousJS` defaults to `true` aligns with project's "MDX bodies are pure prose + JSX from typed map" pattern; 12-month migration target is Fumadocs MDX | ✓ Validated (v1.0) |
| Shiki `github-light-high-contrast` + `github-dark-high-contrast` over plain themes (Phase 3 contrast fix) | Plain `github-light` failed WCAG AA on yellow/orange tokens (3.48:1); high-contrast variants preserve dual-theme contract while clearing 4.5:1 | ✓ Validated (v1.0) |
| Country-only location ("Brazil"/"Brasil") in Hero (Phase 2 D-07) | Privacy decision; "Jundiaí, SP" too specific for public portfolio; recruiters care about country/timezone, not city | ✓ Validated (v1.0) |
| Vercel Analytics + Speed Insights over Plausible/Umami (Phase 2) | Free on Hobby (50K events + 10K data points/month — orders of magnitude over realistic portfolio traffic); zero-config; cookieless; no consent banner | ✓ Validated (v1.0) |
| `priority` → `preload` on next/image (Phase 2 deprecation fix) | `priority` deprecated in Next 16; `preload={true}` is the documented replacement; no functional change | ✓ Validated (v1.0) |
| Inline SVG GitHub/LinkedIn brand marks over lucide-react (Phase 2) | lucide-react ships category icons (GitBranch, GitCommit) but no brand marks; inline SVGs colocated in contact + footer use `currentColor` (theme-aware) and `aria-hidden`; zero new deps | ✓ Validated (v1.0) |
| Strictly-technical first launch post (Phase 4 D-13) | User override mid-Phase-4: technical voice over personal-narrative for the launch post; aligns with Principal-engineer signal | ✓ Validated (v1.0) |
| Fixed Sith-red OG palette over per-page Jedi/Sith variants (Phase 4 D-21) | Single design path; ROADMAP "Jedi/Sith via params" wording simplified to fixed Sith-red; saves 6 palette branches and locks visual consistency on social previews | ✓ Validated (v1.0) |
| OG runtime: Node.js (Next 16 default) over Edge | Per Next 16 default + RESEARCH correction; <500KB still applies (Geist subset 26.1KB + readFile pattern); avoids Edge-runtime constraints | ✓ Validated (v1.0) |
| View Transitions API on theme toggle (radial reveal + RM fade fallback) | Makes the toggle the centerpiece SW touch without sacrificing a11y; CSS-only fallback under `prefers-reduced-motion`; feature-gated to fall back to instant swap on unsupported browsers | ✓ Validated (Phase 5) |
| `experimental.viewTransition` flag NOT enabled in `next.config.ts` (Phase 5 Pitfall 1 lock) | Manual `document.startViewTransition()` calls conflict with Next's automatic interception; warning comment in next.config.ts documents the lock | ✓ Validated (Phase 5) |
| Playwright E2E in CI as a gating step (chromium-only, retries: 1, single-project scoping via `testIgnore` + `testMatch`) | Catches locale/theme/navigation/download/404 regressions pre-merge without inflating CI runtime; chromium-only is enough coverage for a static portfolio; single-project scoping prevents the spec from running 4× across the axe matrix | ✓ Validated (Phase 5) |
| All E2E tests run against `next build && next start` production bundle, NOT `next dev` (Phase 5 D-07) | Catches RSC/SSR regressions that only manifest in production builds; matches a11y-matrix pattern; no dev-only behavior leaks into the test suite | ✓ Validated (Phase 5) |
| Two-project Vitest config (node + jsdom) in single `vitest.config.mts` (v1.1 Phase 01) | Pure-logic files run in node (no jsdom overhead); component tests run in jsdom with RTL; coverage aggregated across both projects by the `coverage` root config | ✓ Validated (v1.1) |
| Component coverage target 70/60/70/70 (statements/branches/functions/lines), not 100% (v1.1 quick task) | 100% on UI components requires testing structurally-unreachable branches; 70/60/70/70 captures render contracts and interaction paths without fighting the coverage tool | ✓ Validated (v1.1) |
| Curated barrel exports: named re-export per line, no `export *`, Shadcn variants module-private (v1.1 Phase 02 D-01/D-02) | `export *` leaks internal names and breaks tree-shaking; Shadcn variant types are consumed only inside their component file; named-per-line makes callsite diffs readable | ✓ Validated (v1.1) |
| Async RSC testing via `await Component({...})` then `render(resolvedJsx)` pattern (v1.1 TD-07) | RTL's `render()` does not await async components; resolving the component to JSX before passing to render is the idiomatic jsdom pattern for Next.js RSCs without spinning up a server | ✓ Validated (v1.1) |
| Radix-ui monorepo bundle import over `@radix-ui/react-dialog` (v1.2 Phase 1) | Prevents duplicate Dialog registration when Shadcn CLI installs command.tsx; radix-ui monorepo re-exports are tree-shakable | ✓ Validated (v1.2) |
| OpenAI gpt-4o as content pipeline model instead of Claude CLI (v1.2 Phase 3) | Anthropic account lacked credits at time of implementation; OpenAI key was immediately available; `===FILE:/===ENDFILE` delimiter scheme parses multi-file output without tool calls | ✓ Validated (v1.2) |
| `JSON.stringify(schema).replace(/</g, '\\u003c')` in JsonLd RSC (v1.2 Phase 4) | Raw `JSON.stringify` doesn't escape `</script>` sequences — a browser terminates a script block on `</` regardless of JSON context; `<` is semantically equivalent but HTML-safe | ✓ Validated (v1.2) |
| `export const SITE_URL` from `seo.ts` as single source of truth (v1.2 Phase 4) | Both `buildMetadata` (metadata API) and `JsonLd` (structured data) need the canonical URL; sharing it from `seo.ts` prevents drift between hreflang and JSON-LD urls | ✓ Validated (v1.2) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
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
5. Update Current State + Next Milestone Goals sections

---
*Last updated: 2026-05-16 — v1.3 milestone started*
