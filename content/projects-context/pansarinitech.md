# Project: pansarini.tech (this portfolio)

**Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Shadcn/UI, next-intl, next-themes, Vercel
**Status:** active
**What it is:** Bilingual (PT/EN) personal portfolio for Luiz Pansarini, Principal Software Engineer — subtle Star Wars aesthetic via a Jedi (light) / Sith (dark) theme toggle. Designed to attract recruiters (BR + international), freelance clients, and the developer community.

## Key challenges & learnings
- Tailwind v4's CSS-first config (`@theme` block in `globals.css`) replaced `tailwind.config.js` entirely — all color tokens live as OKLCH CSS variables, making the Jedi/Sith palette swap a one-class flip on `<html>`
- WCAG 2.1 AA contrast with Sith saber-red: `oklch(58% 0.21 28)` failed 4.5:1 for body text; shifted to `oklch(54% 0.21 28)` for buttons and used `text-foreground decoration-primary` pattern for inline accents
- next-intl with `localePrefix: 'always'` for clean canonical SEO URLs; `proxy.ts` (renamed from `middleware.ts` in Next 16) handles Accept-Language detection and locale cookie
- AnimatePresence (motion/react) in jsdom tests: stub AnimatePresence as React.Fragment for instant DOM swap — AnimatePresence mode="wait" holds exiting elements until exit animation completes, which jsdom can't handle
- build-time syntax highlighting via rehype-pretty-code with dual themes (github-light-high-contrast / github-dark-high-contrast) — zero Shiki JS in client chunks verified via `pnpm verify:no-highlighter`
- [FILL IN: other specific challenges you faced building this portfolio]

## Topics these learnings could feed
- nextjs-react-frontend
- software-engineering-career
- personal-projects-open-source

---
*Last updated: 2026-05-13 — fill in real learnings before first pipeline run*
