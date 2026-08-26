# PLAN: Linear-Clean Portfolio Redesign

## Phase 1: Foundation (Tokens & Layout Primitives)

### 1.1 Update globals.css — Color Tokens
- Replace Jedi/Sith OKLCH values with Linear-clean palette (SPEC §Color)
- Keep existing `--font-sans` (Geist), `--font-mono` (Geist Mono)
- Add CSS custom properties for spacing scale if needed

### 1.2 Create Layout Primitives (new components)
- `src/components/ui/section.tsx` — Section wrapper with consistent padding, max-width, eyebrow control
- `src/components/ui/key-value.tsx` — 2-col dense key/value pair (for About)
- `src/components/ui/mono-badge.tsx` — Mono font badge for tech names (Skills, Projects)

---

## Phase 2: Section Redesigns (Parallelizable)

### 2.1 Hero — Split Screen (`src/components/sections/hero.tsx`)
- **Desktop (`lg+`):** CSS Grid `grid-cols-2 gap-12` — left narrative, right visual
- **Visual:** Terminal-style code block or architecture diagram (generate via image tool)
- **Mobile:** Stacked, visual hidden or single-line terminal
- **Remove:** Photo, stat cards, centered layout
- **CTAs:** Contact (primary), Resume (ghost) — same labels site-wide

### 2.2 About — Dense Key/Value (`src/components/sections/about.tsx`)
- **Replace:** 4-card stat row → 2-col grid of `KeyValue` pairs
- **Data source:** `aboutStats` from `src/data/about-stats.ts` (reuse)
- **Keep:** Bullet highlights (icons → mono labels), cadence line
- **Motion:** Stagger 0.04s on key/value pairs + bullets

### 2.3 Featured Projects — Asymmetric Bento (`src/components/sections/featured-projects-teaser.tsx`)
- **Layout:** CSS Grid `grid-cols-3 gap-4` — featured spans `col-span-2 row-span-2`, 2 small stack `col-start-3`
- **Cards:** Raw `<article>` with image + overlay, no `Card` component
- **Mobile:** `grid-cols-1` — featured first, then 2 small
- **LCP:** Featured image `priority`

### 2.4 Skills — Single Column Grouped (`src/components/sections/skills.tsx`)
- **Remove:** Filter chips, `useState`, `@iconify/react`, `motion` wrapper
- **Layout:** `<dl>` per category — `<dt>` category (mono, uppercase, tracking-wide), `<dd>` inline skill list
- **Skills:** Comma-separated `span` badges (mono, `text-xs`), daily-use = `underline decoration-primary`
- **Icons:** Keep for brands that have them, fallback to mono abbrev

### 2.5 Career Timeline — Horizontal Scroll-Snap (`src/components/sections/career-timeline.tsx`)
- **Desktop (`lg+`):** `<ol class="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4">`
- **Cards:** `<li class="snap-start min-w-[320px] max-w-[380px] flex-shrink-0">` with company, role, period, bullets
- **Pivot:** Inline badge `Pivot: IT → Eng` (mono, primary bg) instead of tooltip
- **Mobile:** Keep current vertical `<ol class="border-l">` via media query

### 2.6 Personal Projects — Tight 2-Col (`src/components/sections/personal-projects.tsx`)
- **Grid:** `grid-cols-1 lg:grid-cols-2 gap-4`
- **Card:** Remove `hover:-translate-y-0.5 hover:shadow-md`, add `transition-colors hover:border-primary/50`
- **Stack badges:** `font-mono text-[10px]`
- **Status:** Mono uppercase tracking-wide

---

## Phase 3: Polish & Verification

### 3.1 Section Rhythm Audit
- Count eyebrows across page → enforce ≤2 total
- Hero: optional "Principal Software Engineer" as eyebrow
- Projects: "Selected Work" eyebrow
- All others: no eyebrow

### 3.2 Dark Mode Parity Check
- Open in both modes, verify no section inverts theme
- Verify contrast on all new components

### 3.3 Run Verification Suite
```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:a11y
pnpm lh:local:fast
```

---

## File Touch Map

| File | Change Type |
|------|-------------|
| `src/app/globals.css` | Modify tokens |
| `src/components/sections/hero.tsx` | Rewrite |
| `src/components/sections/about.tsx` | Rewrite |
| `src/components/sections/featured-projects-teaser.tsx` | Rewrite |
| `src/components/sections/skills.tsx` | Rewrite |
| `src/components/sections/career-timeline.tsx` | Rewrite |
| `src/components/sections/personal-projects.tsx` | Modify |
| `src/components/ui/section.tsx` | Create |
| `src/components/ui/key-value.tsx` | Create |
| `src/components/ui/mono-badge.tsx` | Create |

---

## Dependencies
- No new dependencies — all existing (`motion`, `next/image`, `next-intl`, `lucide-react`)
- Image for Hero visual: generate via image tool or use existing architecture diagram

---

## Risk Mitigation
- **i18n:** All new text via `useTranslations` / `getTranslations` — add keys to message files
- **RSC vs Client:** Hero, Featured Projects, Personal Projects = RSC; About, Skills, Career = Client (motion)
- **Responsive:** Test at 375px (iPhone SE), 768px, 1024px, 1440px
- **Reduced Motion:** Verify `@media (prefers-reduced-motion: reduce)` collapses all animation