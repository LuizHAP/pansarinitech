# Project: pansarini.tech (this portfolio)

**Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Shadcn/UI, next-intl, Three.js, Vercel
**Status:** active
**What it is:** Bilingual (PT/EN) personal portfolio for Luiz Pansarini, Principal Software Engineer — terminal-brutalist identity: ink/paper/signal-blue surfaces, Bricolage Grotesque + IBM Plex Mono, a `>pansarini` prompt with a blinking block cursor and a lazy Three.js cube field behind the hero. Designed to attract recruiters (BR + international), freelance clients, and the developer community.

## Key challenges & learnings
- Tailwind v4's CSS-first config (`@theme` block in `globals.css`) replaced `tailwind.config.js` entirely; the public identity is scoped to `html.site`, and `.surface-ink` / `.surface-paper` / `.surface-accent` each re-point the full shadcn variable set, so a component dropped into a paper band never inherits ink fills while admin keeps its own light/dark tokens
- WCAG 2.1 AA with an electric blue: `#2F3BFF` on ink is only 2.92:1, so it is a fill (buttons, marquee, CTA band, 5.57:1 with paper text) and accent text on ink uses the lighter `#8F96FF` (7.30:1); focus rings switch per surface
- The Three.js hero is loaded with `import()` only after `load` + `requestIdleCallback`, on desktop with a fine pointer and no reduced motion, so the server-rendered h1 stays the LCP element and mobile never downloads the chunk; a header control pauses it and every looping animation (WCAG 2.2.2)
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
