# SPEC: Linear-Clean Portfolio Redesign

## Design Read
**Reading this as: Principal Engineer portfolio for technical hiring managers/peers, with a Linear-minimalist language, leaning toward Tailwind v4 + Geist Mono + asymmetric layouts + high information density.**

---

## Dials (Linear-Clean Preset)
| Dial | Value | Rationale |
|------|-------|-----------|
| **DESIGN_VARIANCE** | 6 | Offset layouts, asymmetric grids, left-aligned content over centered |
| **MOTION_INTENSITY** | 3 | Fluid CSS only (transform/opacity), no scroll-hijack, no GSAP |
| **VISUAL_DENSITY** | 4 | Daily app spacing, tighter sections, mono for data |

---

## Color & Token System
**Strategy:** Tailwind v4 CSS variables (existing) — tighten to Zinc/Slate neutral scale with single accent.

### Light Mode (Jedi)
```css
:root {
  --background: oklch(98.5% 0 0);        /* near-white, not blue-tinted */
  --foreground: oklch(15% 0 0);           /* true near-black */
  --card: oklch(100% 0 0);                /* pure white cards */
  --card-foreground: oklch(15% 0 0);
  --muted: oklch(96% 0 0);                /* subtle separation */
  --muted-foreground: oklch(45% 0 0);     /* readable gray */
  --border: oklch(90% 0 0);               /* hairline borders */
  --primary: oklch(45% 0.15 250);         /* muted blue, not purple */
  --primary-foreground: oklch(98.5% 0 0);
  --accent: oklch(45% 0.15 250);
  --accent-foreground: oklch(98.5% 0 0);
  --ring: oklch(45% 0.15 250);
}
```

### Dark Mode (Sith)
```css
.dark {
  --background: oklch(10% 0 0);           /* true off-black */
  --foreground: oklch(95% 0 0);
  --card: oklch(13% 0 0);                 /* elevated surface */
  --card-foreground: oklch(95% 0 0);
  --muted: oklch(16% 0 0);
  --muted-foreground: oklch(65% 0 0);
  --border: oklch(22% 0 0);
  --primary: oklch(60% 0.15 250);         /* slightly brighter blue */
  --primary-foreground: oklch(10% 0 0);
  --accent: oklch(60% 0.15 250);
  --accent-foreground: oklch(10% 0 0);
  --ring: oklch(60% 0.15 250);
}
```

**Accent Color:** Single blue (oklch 45-60% 0.15 250) — no purple, no gradients, no neon.

---

## Typography
- **Sans:** Geist (already installed via `geist` package)
- **Mono:** Geist Mono (already installed)
- **Scale:** Clamp-based fluid type, no fixed `text-4xl` etc.
- **Display headlines:** `font-medium tracking-tight leading-[1.1]` — no `font-bold` for large text
- **Body:** `text-sm leading-relaxed max-w-[65ch]`
- **Data/Tech names:** `font-mono text-xs` everywhere

---

## Layout Rules (Linear-Clean)

### 1. Hero — Split Screen (not centered)
- **Desktop (`lg+`):** 50/50 split — left: narrative (name, role, value prop, CTAs), right: visual (terminal/architecture diagram)
- **Mobile:** Stacked, narrative first, visual collapsed to single line or removed
- **No stat cards** — the 4-number row is AI-default slop
- **CTAs:** 1 primary (Contact), 1 ghost (Resume) — same intent = one label everywhere

### 2. About — Dense Info Block (not stat cards)
- Replace 4-card stats row with **2-column key/value pairs** (label mono, value display)
- Example: `14 years` / `5 companies` / `BR+US markets` / `100M+ users` as inline data
- Keep bullet highlights (Code2, Globe, Smartphone, TrendingUp) — but mono labels
- Cadence line stays

### 3. Featured Projects — Asymmetric Bento (not 3-col equal)
- **Cell count = content count** (exactly 3 featured → 3 cells)
- **Layout:** 1 large featured (2/3 width) + 2 smaller stacked (1/3 width)
- **Mobile:** Single column, large first
- **No Card component** — raw image + overlay text, hairline borders

### 4. Skills — Single Column Grouped (not filter chips + grid)
- **Remove filter chips entirely** — they're UI chrome, not content
- **Layout:** Category heading (mono, uppercase, tracking-wide) → inline list of skills
- **Daily-use skills:** underline accent
- **Format:** `Category` → `Skill, Skill, Skill, Skill` (wrapping naturally)
- **Mono font** for all tech names

### 5. Career Timeline — Horizontal Scroll-Snap (desktop) / Vertical (mobile)
- **Desktop (`lg+`):** Horizontal scroll-snap cards, each role = one card
- **Mobile:** Vertical stack (current behavior)
- **Cards:** Company (display), Role + Period (mono), Bullets (compact)
- **Pivot marker:** Keep saber dot, but as inline badge not tooltip

### 6. Personal Projects — Tight 2-Col Grid (not 3-col)
- **Desktop:** 2 columns, tighter gap (`gap-4`)
- **Card:** Image (16:10) + title + 1-line desc + stack (mono badges) + links
- **No hover lift** — subtle border transition only
- **Status badge:** Mono, uppercase, tracking-wide

### 7. Section Rhythm
- **Max 1 eyebrow per 3 sections** (skill rule)
- **Hero = 1 eyebrow** (optional — "Principal Software Engineer" as eyebrow)
- **About = no eyebrow**
- **Projects = eyebrow "Selected Work"**
- **Skills = no eyebrow**
- **Career = no eyebrow**
- **Personal Projects = no eyebrow**
- **Now/Blog/Contact = no eyebrow**

---

## Component Changes

| Section | Current | New |
|---------|---------|-----|
| Hero | Centered, photo left, stats row | Split 50/50, narrative + visual, no stats |
| About | 4 stat cards + bullets | 2-col key/value dense block + bullets |
| Featured Projects | 3-col equal cards | Asymmetric bento: 1 large + 2 small |
| Skills | Filter chips + 6-col badge grid | Single column grouped categories, mono |
| Career Timeline | Vertical timeline rail | Horizontal scroll-snap (desktop) |
| Personal Projects | 3-col cards with hover lift | 2-col tight grid, no lift |
| Now/Blog/Contact | Keep largely as-is | Minor density tightening |

---

## Motion (MOTION_INTENSITY: 3)
- **Only:** `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)` on interactive elements
- **Entry:** `opacity: 0 → 1` + `translateY: 8px → 0` via Motion `initial`/`whileInView` (stagger 0.04s)
- **Hover:** `border-color` + `background` shifts, no transform
- **Reduced motion:** Full collapse to instant (existing `@media prefers-reduced-motion`)

---

## Accessibility
- WCAG AA contrast on all text (verified by existing axe tests)
- Focus rings: 2px solid `--ring`, offset 2px (existing)
- Semantic HTML preserved
- `prefers-reduced-motion` honored (existing)

---

## Performance
- Hero visual: generate via image tool or use existing architecture diagram
- All images: `next/image` with `priority` on LCP candidates
- Fonts: Geist + Geist Mono self-hosted (already via `next/font`)
- No new heavy dependencies

---

## Acceptance Criteria
1. Hero fits in initial viewport (headline ≤2 lines, subtext ≤20 words, CTAs visible)
2. No 3-col equal grids anywhere
3. No filter chips in Skills
4. Career horizontal scroll-snap works on desktop ≥1024px
5. Single accent color used consistently across all sections
6. All tech names in `font-mono`
7. Max 2 eyebrows on full page
8. Dark mode parity — no section inverts theme
9. Lighthouse: LCP <2.5s, INP <200ms, CLS <0.1
10. All existing tests pass