# Phase 10: Author Heavy Machinery Mobile-First Case Study — Research

**Researched:** 2026-06-11
**Domain:** MDX content authoring + Next.js App Router static integration (bilingual)
**Confidence:** HIGH — all findings verified directly from the live codebase

---

## Summary

Phase 10 is a **content authoring + wiring** phase, identical in structure to Phase 8 but with a different case study angle. The Heavy Machinery Mobile-First case study is a **fifth portfolio entry** that focuses on the React Native + Expo mobile app, mobile UX on low-connectivity, App Store review process, and the cart-state contract — distinct from the existing `machinery-partner-ecommerce` case study (which covers the Next.js storefront) and `machinery-partner-migration` (which covers the marketing site migration).

The three hard-coded `HERO_IMAGES` maps are the central implementation risk. `CaseStudyHero`, `projects/page.tsx`, and `featured-projects-teaser.tsx` all hold a keyed dictionary of `slug -> StaticImageData`. Adding a fifth case study without extending these maps causes a build-time throw or TypeScript error.

**Primary recommendation:** Author two MDX files (`machinery-mobile-first.en.mdx` + `.pt.mdx`), create a 1024×640 JPEG hero image, extend the three hard-coded `HERO_IMAGES` maps, and update i18n strings from "Three/Four" to "Five" case studies.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MDX content files | Filesystem (static) | — | `content/projects/` directory; no database |
| Frontmatter parsing + Zod validation | API/Backend (RSC build) | — | `factory.ts` runs at build time in Node.js RSC |
| Route resolution | Frontend Server (Next.js App Router) | — | `[locale]/projects/[slug]/page.tsx` SSG |
| Hero image optimization | CDN/Static (next/image) | Frontend Server | Static import at build time → Vercel serves optimized JPEG |
| `generateMetadata()` / OG image | Frontend Server (RSC) | CDN | Per-route `opengraph-image.tsx` + `buildMetadata()` |
| JSON-LD emission | Frontend Server (RSC) | — | `<JsonLd>` is a server-only RSC component |
| i18n locale dispatch | Frontend Server (proxy.ts middleware) | — | `NEXT_LOCALE` cookie + Accept-Language header |
| Listing page discovery | API/Backend (RSC build) | — | `getProjects(locale)` auto-discovers all `.{locale}.mdx` files |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASE-15 | `machinery-mobile-first.en.mdx` and `machinery-mobile-first.pt.mdx` with valid `ProjectFrontmatter` frontmatter | Zod schema verified; exact required fields documented in Standard Stack section |
| CASE-16 | EN case study covers Problem / Solution / Results, React Native + Expo narrative, mobile UX on low-connectivity, App Store review process, cart-state contract as key technical details | Content authoring task; MDX body structure established by existing case studies |
| CASE-17 | PT case study covers same sections as EN, fully localized | Bilingual parity enforced by `verifyParity()` in `factory.ts` — both files must exist or build throws |
| CASE-18 | MDX body uses at least one MDX toolkit component (`<CodeFilename>`, `<InlineBadge>`, or `<Callout>`) | All three are in `mdxComponents` map; usage patterns documented in Code Examples section |
| CASE-19 | Hero image at `content/projects/machinery-mobile-first/images/hero.jpg` | Existing convention is 1024×640 JPEG; gradient placeholder strategy documented |
| CASE-20 | `/projects/machinery-mobile-first` renders in both locales and is listed on `/projects` | Automatic via MDX pipeline once slug is registered; `generateStaticParams` enumerates all slugs × locales |
</phase_requirements>

---

## Standard Stack

### Core (all verified from codebase — no new packages needed)

| File / Library | Role in This Phase | Notes |
|----------------|-------------------|-------|
| `content/projects/{slug}.{locale}.mdx` | MDX source files | Two new files: `machinery-mobile-first.en.mdx`, `machinery-mobile-first.pt.mdx` |
| `content/projects/machinery-mobile-first/images/hero.jpg` | Hero image | 1024×640 JPEG [VERIFIED: existing convention from all 4 case studies] |
| `src/lib/mdx/schema.ts` — `ProjectFrontmatter` | Zod validation schema | Required fields: `title`, `role`, `year`, `stack`, `blurb`, `heroImage`, `tags`, `featured`, `order` |
| `src/lib/mdx/factory.ts` — `createMdxLoader` | File discovery + compile | Auto-discovers `*.{locale}.mdx` — no registration needed in the loader |
| `src/lib/mdx/projects.ts` — `getProjects` / `getProject` / `getAllSlugs` | Loader public API | Unchanged; auto-picks up new slug |
| `src/components/sections/case-study-hero.tsx` — `HERO_IMAGES` | **Manual registration required** | Must add `'machinery-mobile-first': machineryMobileFirst` entry + static import |
| `src/app/[locale]/projects/page.tsx` — `HERO_IMAGES` | **Manual registration required** | Must add `'machinery-mobile-first': machineryMobileFirst` entry + static import |
| `src/components/sections/featured-projects-teaser.tsx` — `HERO_IMAGES` | **Manual registration required** | Must add `'machinery-mobile-first': machineryMobileFirst` entry + static import |
| `src/components/json-ld.tsx` | JSON-LD RSC | Unchanged; receives schema object from page |
| `src/app/[locale]/projects/[slug]/page.tsx` | Case study page | JSON-LD already emits `@type: 'Article'` (changed in Phase 8) |
| `messages/en.json` + `messages/pt.json` | i18n strings | `listingDescription` and `seo.projects` fields hard-code "Four case studies" — must be updated to "Five" |

[VERIFIED: codebase direct inspection]

### No New Packages Required

The full MDX pipeline, bilingual routing, OG image generation, JSON-LD, and hero image optimization are all pre-built. Phase 10 is 100% content authoring + wiring into existing infrastructure. [VERIFIED: codebase inspection]

---

## Architecture Patterns

### MDX File Naming Convention

```
content/projects/
├── machinery-mobile-first.en.mdx          ← new
├── machinery-mobile-first.pt.mdx          ← new
├── machinery-mobile-first/
│   └── images/
│       └── hero.jpg                       ← new (1024×640 JPEG)
├── machinery-partner-ecommerce.en.mdx
├── machinery-partner-ecommerce.pt.mdx
├── machinery-partner-migration.en.mdx
├── machinery-partner-migration.pt.mdx
├── magazine-luiza-superapp.en.mdx
├── magazine-luiza-superapp.pt.mdx
├── uaubox-design-system.en.mdx
└── uaubox-design-system.pt.mdx
```

- Slug is derived from filename prefix: `machinery-mobile-first`
- Locale is filename suffix: `.en.mdx` / `.pt.mdx`
- `verifyParity()` in `factory.ts` throws at build time if either sibling is missing — both files must be committed together
- File pattern regex: `/^([a-z0-9-]+)\.(en|pt)\.mdx$/` — slug must be lowercase alphanumeric + hyphens only [VERIFIED: factory.ts line 37]

### Frontmatter Schema (Exact Required Fields)

[VERIFIED: `src/lib/mdx/schema.ts`]

```yaml
---
title: "Heavy Machinery mobile-first"                    # string, min 1 char
role: "Principal Software Engineer"                      # string, min 1 char
year: 2024                                               # integer, 2018–2030
stack:                                                   # string[], min 1 item
  - React Native
  - Expo
  - TypeScript
  - Fastify
  - Bun
  - Odoo
blurb: "..."                                             # string, 20–280 chars
heroImage: "./machinery-mobile-first/images/hero.jpg"   # string, min 1 char
tags:                                                    # string[], default []
  - mobile
  - react-native
  - e-commerce
featured: true                                           # boolean, default true
order: 5                                                 # integer ≥ 1, default 99
---
```

The `blurb` field (20–280 chars) is used in listing card descriptions, OG metadata description, and JSON-LD `description`. It must be valid in BOTH locale MDX files.

The `heroImage` path uses a `./`-relative prefix — this is the convention from all existing case studies. [VERIFIED: case-study-hero.tsx, projects/page.tsx]

### HERO_IMAGES Map — Three Files to Update

All three files hard-code a `Record<slug, StaticImageData>`:

**File 1: `src/components/sections/case-study-hero.tsx`**

```typescript
// Source: case-study-hero.tsx lines 12–21 — verified
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';

const HERO_IMAGES: Record<string, StaticImageData> = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'uaubox-design-system': uauboxHero,
  'machinery-mobile-first': machineryMobileFirst,  // ← add this
};
```

If the slug is not in this map, `CaseStudyHero` **throws at build time** with:
`"[case-study-hero] No hero image registered for slug 'machinery-mobile-first'. Add it to HERO_IMAGES..."` [VERIFIED: case-study-hero.tsx line 33]

**File 2: `src/app/[locale]/projects/page.tsx`**

```typescript
// Source: projects/page.tsx lines 28–36 — verified
import machineryMobileFirst from '../../../../content/projects/machinery-mobile-first/images/hero.jpg';

const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'uaubox-design-system': uauboxHero,
  'machinery-mobile-first': machineryMobileFirst,  // ← add this
} as const;
```

If missing, `Image src` receives `undefined` — TypeScript error at build.

**File 3: `src/components/sections/featured-projects-teaser.tsx`**

```typescript
// Source: featured-projects-teaser.tsx lines 18–26 — verified
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';

const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'machinery-mobile-first': machineryMobileFirst,  // ← add this
} as const;
```

Note: The featured teaser shows only the first 3 featured projects (`.slice(0, 3)`). With `order: 5`, this case study will NOT appear on the home page teaser, but WILL appear on the full `/projects` listing page.

### JSON-LD Schema — Already Correct

The project page already emits `@type: 'Article'` (changed in Phase 8). No JSON-LD changes needed for Phase 10. [VERIFIED: `projects/[slug]/page.tsx` line 55]

### generateMetadata — Fully Automatic

`projects/[slug]/page.tsx` already calls `buildMetadata()` with the correct shape. No changes needed. [VERIFIED: `projects/[slug]/page.tsx` lines 28–35]

The `opengraph-image.tsx` calls `renderOgImage({ title: project.title, locale })` which renders a Sith-palette Satori image with the project title. No per-project customization needed. [VERIFIED: `og.tsx`, `projects/[slug]/opengraph-image.tsx`]

### i18n Routing — localePrefix: 'never'

The routing config uses `localePrefix: 'never'` [VERIFIED: `src/i18n/routing.ts` line 6]. This means:

- URL is `/projects/machinery-mobile-first` for BOTH locales
- Locale is determined by `NEXT_LOCALE` cookie (set by `proxy.ts` middleware reading Accept-Language)
- `generateStaticParams()` still generates `{ locale: 'en', slug: 'machinery-mobile-first' }` and `{ locale: 'pt', slug: 'machinery-mobile-first' }`

### MDX Toolkit Components — Usage Patterns

All three toolkit components relevant to CASE-18 are in the `mdxComponents` closed map [VERIFIED: `src/components/mdx/index.ts`]:

**`<Callout type="info|warn|error" label?="...">...</Callout>`**
```mdx
<Callout type="info">
Key insight text here.
</Callout>
```

**`<CodeFilename filename="path/to/file.ts">` + fenced code block**
```mdx
<CodeFilename filename="mobile/cart-state.ts">
```ts
// cart state contract
```
</CodeFilename>
```

**`<InlineBadge variant="primary|secondary|muted|destructive">...</InlineBadge>`**
```mdx
The pipeline exported <InlineBadge variant="primary">React Native</InlineBadge> and
<InlineBadge variant="secondary">Expo</InlineBadge> from the same Figma source.
```

**`<Stat number="..." label="..." />`** — also available
```mdx
<Stat number="3×" label="faster component-level QA cycles after token pipeline shipped" />
```

### Message Strings That Need Updating

Both locales hard-code "Four case studies" in two places each:

```json
// messages/en.json — lines 78 and 169 (VERIFIED)
"listingDescription": "Four case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, and a design system built from scratch.",
// seo section:
"projects": "Four case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, and a design system built from scratch."
```

After adding the mobile-first case study, both strings should be updated to "Five case studies" and mention the mobile-first angle. The `projects.listingDescription` key is used in `projects/page.tsx` metadata; the `seo.projects` key feeds the home-page SEO description.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter parsing | Custom YAML parser | Existing `parseFrontmatterBlock` in `factory.ts` | Already handles the exact schema shape; adding a new file auto-works |
| Hero image lazy load + blur placeholder | Manual srcset | `next/image` static import (`placeholder="blur"`) | `blurDataURL` auto-generated from the static import at build time |
| OG image for mobile-first case study | Custom per-project OG template | `renderOgImage()` in `src/lib/og.tsx` | Already handles all case studies; title is passed dynamically |
| JSON-LD serialization | Custom `<script>` construction | `<JsonLd schema={...} />` RSC component | XSS-safe (`<` → `&lt;`); biome suppression already in place |
| Bilingual parity enforcement | Manual check | `verifyParity()` in `factory.ts` | Throws at build time if either locale file is missing |
| MDX compile | Raw `@mdx-js/mdx` calls | `compileMDX` from `next-mdx-remote/rsc` | Already configured with `remarkPlugins` + `rehypePlugins` + `mdxComponents` |

---

## Common Pitfalls

### Pitfall 1: Missing HERO_IMAGES Registration

**What goes wrong:** Adding the MDX files without extending `HERO_IMAGES` in all three files causes a build-time throw or TypeScript error.

**Why it happens:** Hero images use Next.js static imports (not runtime URL strings) to get automatic `blurDataURL`. This requires the import to exist at module level before build. The pattern cannot be made dynamic.

**How to avoid:** Add the import and map entry to ALL THREE files in the same commit as the hero image file. Run `pnpm verify:projects` before committing to catch frontmatter issues first.

**Warning signs:** Build fails with `"No hero image registered for slug 'machinery-mobile-first'"` OR TypeScript error `Type 'undefined' is not assignable to type 'StaticImageData'`.

### Pitfall 2: Bilingual Parity Violation

**What goes wrong:** Committing only the EN MDX file without the PT file (or vice versa) causes `verifyParity()` to throw:
```
Bilingual parity violation — missing locale files:
  - content/projects/machinery-mobile-first.pt.mdx
```
This breaks `next build` for ALL case studies, not just the new one.

**Why it happens:** `verifyParity()` scans the entire `content/projects/` directory and requires every slug to have both `.en.mdx` and `.pt.mdx` siblings.

**How to avoid:** Commit both locale files together. Use `pnpm verify:projects` (alias: `pnpm verify:mdx-content`) to catch this before `next build`.

### Pitfall 3: blurb Length Constraint

**What goes wrong:** The `blurb` field has a **20-character minimum and 280-character maximum**. PT tends to be ~15–20% longer than EN.

**How to avoid:** Write PT blurb first (longer language), then EN. Both must pass `blurb: z.string().min(20).max(280)`.

### Pitfall 4: Incorrect heroImage Path Format

**What goes wrong:** The `heroImage` frontmatter field uses a `./`-relative path string. A mismatch between the frontmatter string and the actual file path causes JSON-LD `image` field computation to produce an incorrect URL.

**How to avoid:** Keep the frontmatter `heroImage` value consistent with the actual file location:
```yaml
heroImage: "./machinery-mobile-first/images/hero.jpg"
```

### Pitfall 5: Featured Teaser Ordering

**What goes wrong:** Expecting the new case study to appear on the home page teaser. The featured teaser shows only the first 3 featured projects (`.slice(0, 3)`). With `order: 5`, this case study will NOT appear on the home page teaser.

**How to avoid:** Set `order: 5` (or any value > 3) and accept that this case study appears only on the `/projects` listing page. If you want it on the home page, set `order: 1` and bump existing orders accordingly.

### Pitfall 6: MDX blockJS Defaults Strip JS Expressions

**What goes wrong:** `next-mdx-remote@^6` defaults `blockJS: true` and `blockDangerousJS: true`. This strips `{expression}` JS and `import`/`export` statements from MDX bodies.

**How to avoid:** Keep MDX bodies as pure prose + JSX component calls. No variables, no imports, no exports inside the MDX files. [VERIFIED: factory.ts comments + CLAUDE.md]

---

## Code Examples

### Canonical MDX Frontmatter (from existing case study)

```yaml
# Source: content/projects/machinery-partner-ecommerce.en.mdx — verified
---
title: "Heavy Machinery e-commerce"
role: "Principal Software Engineer"
year: 2024
stack:
  - Next.js
  - React
  - TypeScript
blurb: "First transactional storefront for US heavy machinery — Next.js + headless commerce + Odoo ERP + native mobile app."
heroImage: "./machinery-partner-ecommerce/images/hero.jpg"
tags:
  - e-commerce
  - BR-scale
featured: true
order: 1
---
```

### HERO_IMAGES Extension Pattern

```typescript
// Source: case-study-hero.tsx lines 12–21 — verified pattern
// Add import at top of file (alongside existing 4 imports):
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';

// Add entry to HERO_IMAGES map:
const HERO_IMAGES: Record<string, StaticImageData> = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'uaubox-design-system': uauboxHero,
  'machinery-mobile-first': machineryMobileFirst,  // ← new
};
```

### JSON-LD Article Schema (already correct — no change needed)

```typescript
// Source: projects/[slug]/page.tsx lines 52–69 — verified
// Already emits @type: 'Article' since Phase 8. No changes needed.
<JsonLd
  schema={{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: project.title,
    description: project.blurb,
    // ... rest unchanged
  }}
/>
```

### MDX Body Structure (case study template)

```mdx
## Problem

[Context and pain points — mobile UX challenges for heavy machinery buyers]

## Solution

[Technical approach with at least one MDX toolkit component]

<Callout type="info">
Key architectural insight.
</Callout>

<CodeFilename filename="mobile/cart-state.ts">
```ts
// cart state contract
```
</CodeFilename>

## Impact

<Stat number="3×" label="component QA cycle reduction after token pipeline" />

[Outcome narrative]

## Stack

- **Mobile:** [React Native + Expo details]
- **Backend:** [Fastify + Bun gateway details]
- **ERP:** [Odoo integration details]
```

### MDX Toolkit Component Reference

```mdx
{/* Callout — all 3 types */}
<Callout type="info">Note text</Callout>
<Callout type="warn">Warning text</Callout>
<Callout type="error">Error text</Callout>

{/* Note and Warning are aliases */}
<Note>Same as Callout type="info"</Note>
<Warning>Same as Callout type="warn"</Warning>

{/* CodeFilename wraps a fenced code block */}
<CodeFilename filename="src/mobile/cart-state.ts">
```ts
export type CartState = { items: CartItem[]; version: number };
```
</CodeFilename>

{/* InlineBadge — 4 variants */}
<InlineBadge variant="primary">primary</InlineBadge>
<InlineBadge variant="secondary">secondary</InlineBadge>
<InlineBadge variant="muted">muted</InlineBadge>
<InlineBadge variant="destructive">destructive</InlineBadge>

{/* Stat — impact figure */}
<Stat number="40+" label="components shipped at v1.0" />
```

---

## Hero Image Conventions

[VERIFIED: all four existing hero images inspected]

| Property | Value | Source |
|----------|-------|--------|
| Format | JPEG (progressive) | `file` command output on all 4 existing heroes |
| Dimensions | 1024×640 px | `file` output: "1024x640, components 3" |
| File size | 15–18 KB | `ls -la` output |
| Aspect ratio | 16:10 | Used in listing cards as `aspect-[16/10]` |
| Color palette | Jedi-leaning (saber blue) | LICENSE-images.txt — "Color palette intentionally Jedi-leaning" |
| Location | `content/projects/{slug}/images/hero.jpg` | Consistent across all 4 case studies |
| Build-time optimization | next/image static import + `placeholder="blur"` | blurDataURL auto-generated |

For Phase 10, a gradient placeholder or abstract geometric illustration consistent with the Jedi/Sith palette is acceptable. The LICENSE-images.txt confirms hero images are abstract/anonymized (no employer screenshots per T-03-03 NDA mitigation).

---

## Listing Page Descriptor Strings to Update

Two i18n keys hard-code "Four case studies" in both locale files [VERIFIED: messages grep]:

**`messages/en.json`:**
```json
// Line 78 — projects.listingDescription (used in projects/page.tsx generateMetadata)
"listingDescription": "Four case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, and a design system built from scratch."

// Line 169 — seo.projects (likely used in home-page SEO or sitemap)
"projects": "Four case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, and a design system built from scratch."
```

**`messages/pt.json`:** Same keys, Brazilian Portuguese translation.

Both keys must be updated to reflect five case studies.

---

## Playwright Test Suite — Updates Required for Phase 11

Phase 10 is not responsible for Phase 11 quality gates, but the planner needs awareness of what Phase 11 will touch:

| Test file | Current scope | Mobile-first impact |
|-----------|--------------|---------------------|
| `tests/a11y-matrix.spec.ts` | 6 pages × 4 locale/theme combos | Must add `/projects/machinery-mobile-first` to `PAGES` array |
| `tests/iphone-se.spec.ts` | 6 scenarios | Must add `/projects/machinery-mobile-first` to `scenarios` array |
| `tests/e2e.spec.ts` | `/projects/magazine-luiza-superapp` as sample | Can add mobile-first variant or leave existing as representative |

Phase 10 itself does not touch test files — but the planner should note that these test additions are Phase 11 work, not Phase 10.

---

## State of the Art

| Old Pattern | Current Pattern | Impact |
|-------------|-----------------|--------|
| "Four case studies" in i18n strings | "Five case studies" after Phase 10 | Two string updates per locale (4 total) |
| 4 entries in `HERO_IMAGES` maps | 5 entries after Phase 10 | Three files require the static import + map update |
| 4 case study MDX files | 5 case study MDX files | Auto-discovered by MDX pipeline |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — Phase 10 is pure content authoring + wiring into pre-built infrastructure)

---

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is skipped per config.

---

## Open Questions (RESOLVED)

1. **Mobile-first case study year**
   - RESOLVED: Use `year: 2024` (same as the existing ecommerce case study, since they are the same project). A `<!-- TODO(Luiz): confirm mobile-first case study year -->` HTML comment is included in both MDX files so it surfaces in `git diff` for confirmation before shipping.

2. **order field value**
   - RESOLVED: Use `featured: true, order: 5`. All existing case studies are `featured: true`; this case study should be consistent and appear 5th in the listing. It will NOT appear on the home page teaser (which shows only the first 3), but WILL appear on the full `/projects` listing page.

3. **Distinct from existing ecommerce case study**
   - RESOLVED: The ecommerce case study covers the Next.js storefront (cart, checkout, product catalog). The mobile-first case study covers the React Native + Expo app (mobile UX, offline/LTE, App Store review, cart-state contract). They share the same project context but have distinct technical narratives. The slug `machinery-mobile-first` makes the distinction clear.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mobile-first case study year is 2024 | Standard Stack | Zod schema rejects years outside 2018–2030; risk is low, any valid year works |
| A2 | `featured: true, order: 5` is the correct frontmatter | Standard Stack | If `featured: false`, card sort order changes (non-featured appears after featured) |
| A3 | A generated/abstract hero image satisfies CASE-19 without Luiz's approval | Hero Image Conventions | If Luiz has specific branding requirements, a regeneration step may be needed |
| A4 | The mobile-first case study is distinct enough from the ecommerce case study to warrant a fifth entry | Open Questions | If the content overlaps too much, a reviewer may question the addition |

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies to Phase 10 | Action |
|-----------|-------------------|--------|
| Stack: Next.js 16 + TS + Tailwind v4 + Shadcn/UI + Vercel | Yes | No new packages; use existing stack only |
| Mobile-first, iPhone SE (375px) minimum | Yes (CASE-20 in Phase 11) | Prose MDX content inherits existing `prose` + `max-w-3xl` layout; no extra mobile work needed |
| WCAG 2.1 AA | Yes (CASE-20 in Phase 11) | MDX toolkit components (Callout, CodeFilename, InlineBadge) already axe-clean per Phase 6 |
| Lighthouse Performance ≥ 95 mobile | Yes (CASE-13 in Phase 11) | Hero image static import + `priority` + `placeholder="blur"` matches existing LCP pattern |
| Bilingual: every user-facing copy in both PT and EN | Yes | Both `.en.mdx` and `.pt.mdx` required; `verifyParity()` enforces this at build time |
| Theme tokens via CSS variables | Not directly affected | MDX prose inherits `dark:prose-invert`; MDX components use theme-token classes |
| No external CMS for v1 | Yes | MDX in `content/projects/` is the only content source — no CMS changes |
| `next-mdx-remote/rsc` for MDX | Yes | Factory already uses `/rsc` subpath; no change |
| `blockJS` and `blockDangerousJS` defaults preserved | Yes | Do NOT add `mdxOptions.format` or any override that disables these defaults |
| ESLint rule blocks `next/link` outside `lib/i18n/navigation.ts` | Yes | All links in MDX template page use `Link` from `@/lib/i18n/navigation` |
| `setRequestLocale(locale)` in every page AND layout | Already satisfied | `projects/[slug]/page.tsx` already calls `setRequestLocale(locale)` |
| Aurebesh only for decorative numerals | Not applicable | No Aurebesh usage in case study content |

---

## Sources

### Primary (HIGH confidence — verified from live codebase)
- `src/lib/mdx/schema.ts` — `ProjectFrontmatter` Zod schema (all required fields + types)
- `src/lib/mdx/factory.ts` — full MDX pipeline (file discovery, parity check, compile, validation)
- `src/lib/mdx/projects.ts` — loader public API (`getProjects`, `getProject`, `getAllSlugs`)
- `src/app/[locale]/projects/[slug]/page.tsx` — SSG page, `generateMetadata`, JSON-LD schema
- `src/app/[locale]/projects/page.tsx` — listing page, `HERO_IMAGES` map, static imports
- `src/components/sections/case-study-hero.tsx` — `HERO_IMAGES` map, throw-on-missing logic
- `src/components/sections/featured-projects-teaser.tsx` — `HERO_IMAGES` map, `.slice(0, 3)` ordering
- `src/components/json-ld.tsx` — JSON-LD RSC component
- `src/lib/seo.ts` — `buildMetadata()` factory
- `src/lib/og.tsx` — `renderOgImage()` + `OG_SIZE` + `OG_CONTENT_TYPE`
- `src/components/mdx/index.ts` — `mdxComponents` closed map
- `src/components/mdx/callout.tsx` — Callout/Note/Warning API
- `src/components/mdx/code-filename.tsx` — CodeFilename API
- `src/components/mdx/inline-badge.tsx` — InlineBadge API + 4 variants
- `src/i18n/routing.ts` — `localePrefix: 'never'` confirmed
- `content/projects/machinery-partner-ecommerce.en.mdx` — canonical frontmatter template
- `content/projects/LICENSE-images.txt` — hero image conventions + palette guidance
- `messages/en.json`, `messages/pt.json` — "Four case studies" hard-coded string locations
- `tests/a11y-matrix.spec.ts` — existing page coverage scope
- `tests/e2e.spec.ts` — project case study test pattern
- `tests/iphone-se.spec.ts` — iPhone SE scenarios list
- `vitest.config.mts` — 27 tracked files, coverage thresholds confirmed

### No external sources consulted

This research was fully satisfied by direct codebase inspection. No WebSearch, Context7, or external documentation was required — the infrastructure is already built and the patterns are established.

---

## Metadata

**Confidence breakdown:**
- Frontmatter schema: HIGH — read directly from `schema.ts` Zod definition
- MDX pipeline: HIGH — read directly from `factory.ts` and `projects.ts`
- HERO_IMAGES registration requirement: HIGH — throw-on-missing verified in `case-study-hero.tsx`
- JSON-LD Article already correct: HIGH — `@type: 'Article'` verified in `projects/[slug]/page.tsx`
- localePrefix: HIGH — verified in `routing.ts`
- Hero image conventions: HIGH — `file` command output on actual image files
- Message string "Four case studies": HIGH — grep output on both locale files

**Research date:** 2026-06-11
**Valid until:** Indefinite — based on codebase state, not external library versions
