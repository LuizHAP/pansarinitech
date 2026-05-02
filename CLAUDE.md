<!-- GSD:project-start source:PROJECT.md -->
## Project

**pansarinitech — Luiz Pansarini Portfolio**

A bilingual (PT/EN) personal portfolio website for **Luiz Pansarini**, Principal Software Engineer, designed to attract recruiters (BR + international), freelance clients, and the developer community. The site uses a **subtle Star Wars aesthetic** — light mode follows a Jedi palette (saber blue), dark mode follows a Sith palette (saber red) — with the theme toggle itself acting as the central themed feature. Built with Next.js, React, TypeScript, Tailwind CSS, and Shadcn/UI on Vercel.

**Core Value:** **Land high-signal opportunities (jobs and freelance) by presenting Luiz's career narrative — IT support to Principal Engineer, BR scale to US market — through a portfolio that is fast, accessible, mobile-first, and memorable without being unprofessional.**

If everything else fails, the site must load fast on a recruiter's phone, communicate "Principal-level full-stack engineer" within 5 seconds, and have a clear path to "contact / hire / message me."

### Constraints

- **Tech stack**: Next.js 16 + React + TypeScript + Tailwind CSS + Shadcn/UI + Vercel — locked because it mirrors Luiz's daily production stack
- **Mobile**: Mobile-first, must work cleanly on iPhone SE (375px) up — recruiters often open links on phones
- **Accessibility**: WCAG 2.1 AA — non-negotiable; respects `prefers-reduced-motion` and `prefers-color-scheme`
- **Performance**: Lighthouse Performance ≥ 95 on mobile — fast first paint, minimal JS payload, optimized images (next/image)
- **Bilingual content**: Every user-facing copy must be authored in both PT and EN before shipping a locale
- **Theme tokens**: All color usage flows through CSS variables — palette swaps cleanly between Jedi/Sith without per-component code changes
- **No external CMS for v1**: Blog uses MDX in the repo; one source of truth, no infra cost
- **Hosting**: Vercel (matches existing workflow); custom domain TBD (likely `pansarini.tech` to match repo name)
- **Theme intensity**: Star Wars references stay subtle — no element should make a conservative recruiter raise an eyebrow
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Executive Recommendation
- **i18n:** `next-intl@^4.9` (the only library with first-class App Router + RSC support)
- **Theming:** `next-themes@^0.4` + Tailwind v4 `@custom-variant dark` (Shadcn's official approach)
- **MDX:** `next-mdx-remote@^6` (use `/rsc` subpath) for RSC OR `@next/mdx` for route-based content — **avoid Velite if you keep Turbopack on** (webpack-plugin incompatibility)
- **Animation:** `motion@^12` (formerly `framer-motion`, imported from `motion/react`) with `useReducedMotion`
- **Forms:** `resend@^4` + React 19 `useActionState` + `zod@^4` (no react-hook-form needed for a single contact form)
- **Analytics:** `@vercel/analytics@^1` + `@vercel/speed-insights@^1` (free on Hobby tier, zero-config, no consent banner)
- **OG images:** Built-in `next/og` (`ImageResponse`) — no extra package
- **Icons:** `lucide-react@^0.5x` (Shadcn default, confirmed)
- **Fonts:** `geist@^1` (Sans + Mono) for body/UI; one open-licensed Aurebesh face (FT Aurebesh, OFL) loaded via `next/font/local` for decorative numerals only
- **SEO:** Built-in Metadata API + `app/sitemap.ts` + `app/robots.ts` — **do NOT install `next-seo`**
- **Type-safe content:** Zod schemas + a small custom MDX loader (or `next-mdx-remote/rsc` + Zod-validated frontmatter). Velite is excellent in concept but its Turbopack story is still rough.
- **Toasts (if needed for form feedback):** `sonner@^1` (Shadcn default, replaces deprecated `toast`)
## Recommended Stack
### Core Technologies (locked by project — re-verified for 2026)
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | `^16.2.0` | React framework, App Router, RSC, Turbopack default | Shipped 2025-10-21; 16.2 (Mar 2026) is current stable. Turbopack is now default for `dev` AND `build`. React Compiler 1.0 stable. |
| React | `^19.2` | UI library | Pulled in by Next 16; brings `useActionState`, `useFormStatus`, View Transitions. |
| TypeScript | `^5.6` | Type safety | next-intl 4.8+ requires TS ≥5; Velite/Zod schemas need it. |
| Tailwind CSS | `^4.1` | Styling | v4 stable since Jan 2025. CSS-first config (`@theme`), OKLCH palette, Lightning CSS engine, 10x faster builds. **No more `tailwind.config.js`.** |
| Shadcn/UI | latest CLI | Component primitives | Officially supports Tailwind v4 + OKLCH; ships `@custom-variant dark` recipe. |
| Vercel | — | Hosting | Native `next/og`, Analytics, Speed Insights free on Hobby. |
### Supporting Libraries (the prescriptive recommendations)
| Library | Version | Purpose | When/Why to Use |
|---------|---------|---------|-----------------|
| `next-intl` | `^4.9.1` | i18n with App Router + RSC | **The** standard for App Router. Locale-segment routing, RSC-aware `useTranslations`/`getTranslations`, middleware for auto-detect, type-safe messages, hreflang helpers. Active maintenance for Next 16. |
| `next-themes` | `^0.4.6` | Light/dark mode persistence | Two-line setup, no flash, `localStorage` + `prefers-color-scheme`. Official Shadcn recommendation. Pair with Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *))`. |
| `motion` | `^12.38` | Animation | Renamed from `framer-motion` mid-2025. Import from `motion/react`. **Built-in `useReducedMotion` and `<MotionConfig reducedMotion="user">`** — exactly what the project needs for the a11y constraint. v12 has no breaking changes vs v11. |
| `next-mdx-remote` | `^6` (use `/rsc` import) | MDX in App Router | Phase 3 ships next-mdx-remote@^6 (final stable 6.0.0 published 2026-02-12 before the GitHub repo was archived 2026-04-09). Breaking change in 6.0.0: `blockJS` AND `blockDangerousJS` default to `true` — Phase 3 keeps both defaults (MDX bodies are pure prose + JSX components from the typed `mdxComponents` map; static image imports stay in the page template, NOT inside MDX bodies). 12-month migration target unchanged: Fumadocs MDX. Alternative active fork: `next-mdx-remote-client`. |
| `rehype-pretty-code` | `^0.14` | Syntax highlighting | Build-time (no runtime cost), powered by Shiki, supports dual light/dark themes — perfect for Jedi/Sith palette swap on code blocks. |
| `shiki` | `^4` | Code tokenizer (peer of rehype-pretty-code) | VS Code accuracy. (Phase 3 pulled @^4; rehype-pretty-code 0.14 supports the v4 line.) |
| `remark-gfm` | `^4` | GitHub-flavored Markdown | Tables, strikethrough, task lists. |
| `zod` | `^4` | Frontmatter validation, form validation | Schema for blog post frontmatter, contact-form payload. Standard. |
| `resend` | `^4.x` | Transactional email for contact form | 3,000 emails/month free, 100/day — orders of magnitude over portfolio needs. Server-Action friendly. **Only needed if you keep a form; project decision was direct email links.** Listed as on-deck if "Contact section" evolves. |
| `@vercel/analytics` | `^1.4` | Privacy-friendly pageview analytics | Cookieless, no consent banner, free on Hobby, one-line install. |
| `@vercel/speed-insights` | `^1.x` | Real User Monitoring (Web Vitals) | Free on Hobby, validates the Lighthouse ≥95 perf claim with real traffic. |
| `lucide-react` | `^0.5x` | Icon set | Shadcn default, 1,655 icons, tree-shakable, MIT. |
| `geist` | `^1.4` | Default Vercel font (Sans + Mono) | Pre-configured in Next 15+. Loaded via `next/font` automatically. Pairs cleanly with Shadcn. |
| `sonner` | `^1.7` | Toasts (form success/error) | Shadcn-recommended toast (the original `toast` was deprecated in favor of Sonner). |
| `clsx` + `tailwind-merge` | latest | Class utilities | Already pulled in by Shadcn. |
| `class-variance-authority` | latest | Variant management | Already pulled in by Shadcn. |
### Not Needed / Intentionally Excluded
| Library | Why Excluded |
|---------|--------------|
| `react-hook-form` | Overkill for a single contact form. React 19 `useActionState` + `zod` covers it natively. Add only if you grow multi-step forms. |
| `next-seo` | **Explicitly mark as anti-pattern in 2026.** Mixing `next-seo` with Next 16's Metadata API is listed as a common mistake in current Next.js docs. Use built-in Metadata API + `generateMetadata`. |
| `contentlayer` / `contentlayer2` | Original deprecated; community forks exist but ecosystem has clearly moved on. Don't start here in 2026. |
| `gray-matter` standalone | Not needed if using `next-mdx-remote/rsc` (it parses frontmatter). Re-add only if you write a hand-rolled loader. |
| `react-i18next` / `next-i18next` | `next-i18next` is Pages Router-era and effectively abandoned for App Router. `react-i18next` works but lacks RSC ergonomics next-intl provides. |
| `framer-motion` (the package name) | Renamed to `motion`. Old package still publishes as a re-export shim, but new code should use `motion`. |
| Custom toast components | Sonner is the Shadcn standard; no reason to roll your own. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| `eslint` + `eslint-config-next` | Linting | Bundled by `create-next-app`; stays on Flat Config in 16. |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting | Auto-sorts Tailwind classes. Critical for keeping Shadcn diffs clean. |
| `@types/mdx` | MDX TS types | Needed if you import `.mdx` directly. |
| Vercel CLI | Deploys + env mgmt | Already implied by hosting choice. |
| Lighthouse CI (optional) | Enforce perf budget in CI | Aligns with Lighthouse ≥95 quality gate. |
## Installation (prescriptive single command set)
# Scaffold (Tailwind v4 + TS + ESLint + App Router)
# Shadcn (uses Tailwind v4 + OKLCH automatically)
# Core supporting stack
# MDX pipeline
# Dev
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `next-intl` | `next-i18n-router` + `react-i18next` | If you need a translation backend (Locize, Phrase) with hot-reloading translations. For a 2-locale static portfolio, overkill. |
| `next-intl` | Built-in Next.js i18n routing only | Pages Router only — does not exist for App Router in 16. Not an option here. |
| `next-themes` | Tailwind v4 + manual `prefers-color-scheme` only | If you don't need a manual toggle. Project explicitly requires Jedi/Sith toggle UX → next-themes is required. |
| `next-mdx-remote/rsc` | `@next/mdx` | Use `@next/mdx` if your blog posts ARE the routes (e.g. `app/blog/post-slug/page.mdx`). Use `next-mdx-remote/rsc` if you keep posts in `content/` and render them via a dynamic `[slug]` route (better for listing pages, frontmatter-driven indices, i18n folders). For this portfolio's bilingual blog → **`next-mdx-remote/rsc`**. |
| `next-mdx-remote/rsc` | `Velite` | Velite (`zce/velite`) is conceptually superior — Zod schemas, build-time validation, type generation. **But:** its `VeliteWebpackPlugin` does NOT work with Turbopack (Next 16 default). Workaround exists (programmatic API), but adds complexity. Choose Velite only if you accept opting out of Turbopack OR running Velite as a separate `prebuild` step. |
| `next-mdx-remote/rsc` | `Content Collections` | Drop-in Contentlayer replacement, App Router compatible. Fine for docs-heavy sites. For a 1-author portfolio blog, the bundle/setup overhead vs raw `next-mdx-remote` isn't justified. |
| `next-mdx-remote/rsc` | `Fumadocs` (`fumadocs-mdx` standalone) | Fumadocs MDX standalone is the modern type-safe option in 2026 (3x download YoY growth) and works with Turbopack. **Reconsider this if you want type-safe MDX without Velite's Turbopack issues.** Tradeoff: pulls in Fumadocs conventions you may not need. |
| `motion` | `GSAP` | If you need a complex SVG/timeline animation for one Star Wars touch (e.g. lightsaber ignition). For everything else, motion's React-first API + reduced-motion ergonomics win. |
| `motion` | Tailwind v4 `transition-*` + `@starting-style` | For 90% of UI motion (hovers, fades, accordion), pure CSS via Tailwind is sufficient and zero-JS. **Use motion only for choreographed enter/exit/scroll animations.** Hybrid is the right answer. |
| `motion` | CSS-only with `prefers-reduced-motion` media query | Same as above — fine for purely decorative effects. Project should default to CSS, escalate to motion only when needed. |
| `@vercel/analytics` | `Plausible Cloud ($9/mo)` | If you ever leave Vercel hosting. Plausible is the privacy-purist pick — open-source script, EU-hosted, public dashboards possible. |
| `@vercel/analytics` | `Umami self-hosted` | If you want to own the data on your own infra. Adds Postgres dependency. Overkill for personal site. |
| `Built-in Metadata API` | `next-seo` | **Never** in Next 16. `next-seo` predates the Metadata API. |
| `next/og` (`ImageResponse`) | `Satori` directly / Sharp | Built-in is the same engine (Satori + Resvg). Drop down only if you need `display: grid` or non-flexbox layouts (Satori limitation). |
| `Resend` | `Web3Forms` / `Formspree` / direct `mailto:` | Project decision is `mailto:` + LinkedIn — keep it. Resend is the upgrade path if spam-filtering on `mailto:` becomes a problem. Web3Forms/Formspree introduce 3rd-party dependency for $0 marginal value over Resend. |
| `lucide-react` | `Tabler` / `Phosphor` / `Heroicons` | Lucide is Shadcn default. Switching means manual icon swaps in every Shadcn component. Don't. |
| `Geist` | `Inter` (via `next/font/google`) | Inter is the safe alternative. Geist is the better Vercel-native fit and is already the default in Next 15+. Stick with Geist. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-seo` | Predates Metadata API; doubles up on `<head>` tags; flagged as anti-pattern in current Next.js SEO guides. | Built-in Metadata API + `generateMetadata` + `app/sitemap.ts` + `app/robots.ts`. |
| `next-i18next` | Pages Router-only; not maintained for App Router. | `next-intl`. |
| `Contentlayer` (original) | Deprecated, primary maintainer publicly stepped back. | `next-mdx-remote/rsc` (simple) or `Fumadocs MDX` (type-safe + Turbopack-friendly). |
| `framer-motion` (npm name) | Renamed to `motion` mid-2025. New code should import `motion/react`. | `motion` package. |
| `react-toastify`, original Shadcn `toast` | The shadcn `toast` was deprecated in favor of Sonner. | `sonner`. |
| `tailwind.config.js` for v4 | Removed in Tailwind v4 (CSS-first config). | `@theme` + `@custom-variant` directives in `globals.css`. |
| `darkMode: "class"` config | No longer exists in v4. | `@custom-variant dark (&:where(.dark, .dark *));` in CSS, paired with `next-themes attribute="class"`. |
| `gray-matter` + custom MDX compilation pipeline (hand-rolled) | Easy to write, hard to maintain. Recompiling MDX with shiki + remark plugins on every request kills Lighthouse perf. | `next-mdx-remote/rsc` (compiled in RSC, build-time syntax highlighting via rehype-pretty-code). |
| Self-hosted analytics on Vercel Hobby | You'll burn build minutes and add complexity for no privacy gain over Plausible Cloud or Vercel Analytics. | `@vercel/analytics` (free, zero-config). |
| Inline `<head>` `<link rel="alternate" hreflang>` tags | Easy to drift across locales. | `generateMetadata` returning `alternates.languages` — Next 16 emits hreflang automatically. |
| Custom OG-image PNGs in `public/` per page | Doesn't scale, easy to forget. | Dynamic `next/og` `opengraph-image.tsx` per route segment, with `searchParams` for variants. |
| Aurebesh as primary nav labels | Already in project Out-of-Scope (illegible to non-fans). Don't reintroduce via library choice. | Use Aurebesh (FT Aurebesh, OFL) only for decorative numerals (e.g. section numbers, 404 page accent). |
## How the Recommended Stack Interacts (the tricky part)
### 1. Locale-segmented App Router structure
### 2. ThemeProvider must wrap NextIntlClientProvider, not the other way
### 3. Tailwind v4 dark-variant directive
### 4. next-intl middleware vs static rendering
### 5. MDX with `next-mdx-remote/rsc` per-locale
### 6. OG images respect locale + theme
### 7. Form (if Resend is later added) with Server Actions
## Stack Patterns by Variant
- Migrate from `next-mdx-remote/rsc` to `Fumadocs MDX` standalone
- Reason: Type-safe frontmatter via Zod, Turbopack-compatible, optimized for content-heavy sites; download growth (3x YoY in 2026) signals it's the directional winner
- Replace `@vercel/analytics` with `Plausible Cloud` ($9/mo) or self-hosted Umami
- Replace `next/og` runtime with `@vercel/og` package (it's the same engine, just unbundled)
- Replace `@vercel/speed-insights` with manual Web Vitals reporting via `web-vitals` package
- next-intl scales linearly: add `es` to `routing.locales`, copy message catalog, add `content/es/`
- Sitemap auto-includes (it iterates locales)
- No library changes needed
- Add `--turbopack=false` flag (or use stable webpack mode if Next 16 still allows in 16.x)
- This trades ~50% slower builds for compile-time-validated MDX schemas. **Not recommended for v1** given the project's Lighthouse + DX priorities.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@16.2` | `react@19.2` | React 19.2 is bundled; do NOT install React separately. |
| `next@16` | `tailwindcss@4.1` | Requires `@tailwindcss/postcss` plugin in `postcss.config.mjs`. |
| `next-intl@4.9` | `next@16` | GitHub issue #2064 reports edge cases on early 16.0; 4.9.x is the version with confirmed 16.x fixes. **Pin to `^4.9.1`, not `^4.0`.** |
| `next-themes@0.4` | `next@16` + `tailwindcss@4` | Works fine with `attribute="class"`; ensure Tailwind v4 has `@custom-variant dark` defined. |
| `motion@12` | `react@19` | No breaking changes from 11→12. Tested with Next 16 in March 2026. |
| `next-mdx-remote@^6` | `next@16` (RSC) | Final stable 6.0.0 published 2026-02-12 (repo archived 2026-04-09 thereafter; package still works). Breaking from @5: `blockJS` and `blockDangerousJS` now default to `true` — strips `{expr}` JS expressions and `import`/`export` from MDX bodies. KEEP defaults (Phase 3 D-17). 12-month migration target: Fumadocs MDX or `next-mdx-remote-client` fork. |
| `rehype-pretty-code@0.14` | `shiki@^1` or `shiki@^4` | ESM-only; `next.config.ts` works (Turbopack-native). Phase 3 pulls `shiki@^4`. |
| `velite@*` | `next@16` Turbopack | **NOT directly compatible.** `VeliteWebpackPlugin` requires webpack. Use programmatic API via Next plugin OR run as separate `prebuild` script. |
| `@vercel/og` (via `next/og`) | `next@16` Edge runtime | 500KB total bundle limit. Flexbox-only CSS. No `display: grid`. |
| `geist@1` | `next@15+` | Already default in Next 15+; just import from `geist/font/sans` and `geist/font/mono`. |
## Sources
### Authoritative (HIGH confidence)
- [Next.js 16 Release Blog (2025-10-21)](https://nextjs.org/blog/next-16) — confirmed Turbopack default, React Compiler 1.0 stable
- [Next.js 16.2 Release Blog (2026-03)](https://nextjs.org/blog/next-16-2) — current stable
- [Next.js — Internationalization Guide](https://nextjs.org/docs/app/guides/internationalization) — official i18n recommendations
- [Next.js — Metadata API](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) — confirms built-in API supersedes next-seo
- [Next.js — ImageResponse / next/og](https://nextjs.org/docs/app/api-reference/functions/image-response) — OG image generation built-in
- [Next.js — sitemap.xml file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) — built-in sitemap
- [next-intl official docs](https://next-intl.dev/docs/getting-started/app-router) — App Router setup
- [next-intl 4.0 changelog](https://next-intl.dev/blog/next-intl-4-0) — type-safe messages, locale-required `getRequestConfig`
- [next-intl GitHub releases](https://github.com/amannn/next-intl/releases) — v4.9.1 current
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — official repo
- [Shadcn Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — Shadcn's official v4 + next-themes recipe
- [Shadcn Theming docs](https://ui.shadcn.com/docs/theming) — CSS variables approach
- [Shadcn Sonner component](https://ui.shadcn.com/docs/components/radix/sonner) — confirms Sonner is replacement for deprecated `toast`
- [Tailwind v4 release notes](https://tailwindcss.com/blog/tailwindcss-v4) — OKLCH, CSS-first config
- [Motion (formerly Framer Motion) upgrade guide](https://motion.dev/docs/react-upgrade-guide) — confirms `motion` package + `motion/react` import path
- [Motion changelog](https://motion.dev/changelog) — v12.x current
- [motion npm](https://www.npmjs.com/package/motion) — verified version
- [Velite + Next.js integration docs](https://velite.js.org/guide/with-nextjs) — confirms Turbopack incompatibility, programmatic API workaround
- [Resend pricing](https://resend.com/pricing) — free tier 3K/month, 100/day
- [Resend Next.js docs](https://resend.com/nextjs) — Server Actions integration
- [@vercel/og custom fonts](https://vercel.com/kb/guide/using-custom-font) — local font loading pattern
- [Vercel Analytics quickstart](https://vercel.com/docs/analytics/quickstart) — free on Hobby
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights/quickstart) — free on Hobby
- [Lucide React docs](https://lucide.dev/guide/packages/lucide-react) — Shadcn default icon set
- [Geist font](https://vercel.com/font) — default font in Next 15+
- [rehype-pretty-code](https://rehype-pretty.pages.dev/) — Shiki-powered, dual-theme support
### Secondary (MEDIUM confidence — used for cross-validation)
- [Fumadocs](https://www.fumadocs.dev/) — modern docs/MDX framework, 3x YoY growth signal
- [PkgPulse: Vercel Analytics vs Plausible vs Umami 2026](https://www.pkgpulse.com/blog/vercel-analytics-vs-plausible-vs-umami-privacy-first-2026) — privacy-tool comparison
- [PkgPulse: Fumadocs vs Nextra v4 vs Starlight 2026](https://www.pkgpulse.com/blog/fumadocs-vs-nextra-v4-vs-starlight-documentation-sites-2026) — MDX framework comparison
- [Wisp CMS: Contentlayer abandoned](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives) — confirms deprecation status
- [Dub.co: Migrating from Contentlayer to Content Collections](https://dub.co/blog/content-collections) — real-world migration case
- [LogRocket: Best React animation libraries 2026](https://blog.logrocket.com/best-react-animation-libraries/) — Motion as default
- [next-mdx-remote-client npm](https://www.npmjs.com/package/next-mdx-remote-client) — active fork
- [GitHub issue: next-intl on Next 16](https://github.com/amannn/next-intl/issues/2064) — flagged 16.0 issues, resolved by 4.9.x
### Confidence Notes
- Versions for `next-intl` (4.9.1), `motion` (12.38), `next` (16.2), and `tailwindcss` (4.1) verified against multiple 2026 sources within the last 6 weeks.
- `next-mdx-remote` archive status (2026-04-09) is from a single GitHub source — **flag as MEDIUM** and verify before phase that builds the blog. The library still works; this is a forward-looking risk only.
- Aurebesh (FT Aurebesh, OFL) license verified via Fontesk; not on Google Fonts but freely redistributable.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
