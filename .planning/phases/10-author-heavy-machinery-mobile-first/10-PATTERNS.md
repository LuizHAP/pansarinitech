# Phase 10: Author Heavy Machinery Mobile-First Case Study — Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 8 (2 new content files, 1 new image, 4 modified source files)
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `content/projects/machinery-mobile-first.en.mdx` | content (MDX) | static/read | `content/projects/machinery-partner-ecommerce.en.mdx` | exact |
| `content/projects/machinery-mobile-first.pt.mdx` | content (MDX) | static/read | `content/projects/machinery-partner-ecommerce.pt.mdx` | exact |
| `content/projects/machinery-mobile-first/images/hero.jpg` | static asset | file-I/O | `content/projects/machinery-partner-ecommerce/images/hero.jpg` | exact |
| `src/components/sections/case-study-hero.tsx` (modify) | component | request-response | self — extend existing `HERO_IMAGES` map | exact |
| `src/app/[locale]/projects/page.tsx` (modify) | component/page | request-response | self — extend existing `HERO_IMAGES` map | exact |
| `src/components/sections/featured-projects-teaser.tsx` (modify) | component | request-response | self — extend existing `HERO_IMAGES` map | exact |
| `messages/en.json` (modify) | config/i18n | static/read | self — update 2 string literals | exact |
| `messages/pt.json` (modify) | config/i18n | static/read | self — update 2 string literals | exact |

---

## Pattern Assignments

### `content/projects/machinery-mobile-first.en.mdx` (content, static)

**Analog:** `content/projects/machinery-partner-ecommerce.en.mdx`

**Frontmatter pattern** (lines 1–25 of analog):

```yaml
---
title: "Heavy Machinery e-commerce"
role: "Principal Software Engineer"
year: 2024
stack:
  - Next.js
  - React
  - TypeScript
  - Tailwind
  - Shadcn
  - React Native
  - Expo
  - Bun
  - Fastify
  - Odoo
blurb: "First transactional storefront for US heavy machinery — Next.js + headless commerce + Odoo ERP + native mobile app."
heroImage: "./machinery-partner-ecommerce/images/hero.jpg"
tags:
  - e-commerce
  - BR-scale
  - ERP-integration
  - mobile
featured: true
order: 1
---
```

**Apply for Mobile-First EN — substitute these values:**

```yaml
---
title: "Heavy Machinery mobile-first"
role: "Principal Software Engineer"
year: 2024
stack:
  - React Native
  - Expo
  - TypeScript
  - Fastify
  - Bun
  - Odoo
blurb: "Native mobile app for US heavy machinery buyers — React Native + Expo, offline cart-state contract, and App Store review."
heroImage: "./machinery-mobile-first/images/hero.jpg"
tags:
  - mobile
  - react-native
  - e-commerce
featured: true
order: 5
---
```

**Blurb constraint:** 20–280 characters. Validate both EN and PT blurbs meet the range before committing. PT tends to run ~15–20% longer — draft PT first.

**MDX body section structure** (lines 27–132 of analog):

```mdx
## Problem

[Context paragraph 1 — describe the situation: heavy machinery buyers need to browse, configure, and order equipment from mobile devices while on-site at job sites]

[Context paragraph 2 — business constraints: field workers don't have laptops, connectivity at construction sites is unreliable, the web app was too slow on mobile]

## Solution

[Paragraph describing architecture decision: React Native + Expo as the foundation, offline-first cart-state, LTE fallback]

<Callout type="info">
Building the cart-state contract first — before any UI work — meant the offline mode worked on day one. Every screen was a consumer of the same state machine.
</Callout>

[Paragraph describing Expo workflow: OTA updates, EAS builds, App Store review process]

<CodeFilename filename="mobile/cart-state.ts">
```ts
export type CartState = {
  items: CartItem[];
  version: number;
  synced: boolean;
};
```
</CodeFilename>

[Paragraph describing the Fastify + Bun gateway that bridges the mobile app to Odoo ERP]

## Impact

<Stat number="98%" label="cart operations available offline before network sync" />

<Stat number="4.8★" label="App Store rating after first release" />

[Outcome narrative: what changed for field workers, sales team, conversion rates]

## Stack

- **Mobile:** [React Native + Expo details — OTA updates, EAS builds, App Store review]
- **Gateway:** [Fastify + Bun details — XML-RPC to Odoo, Zod validation boundaries]
- **Cart-state:** [offline-first contract, version-based sync]
```

**Key rules for MDX body:**
- No `{expression}` JS interpolation (blocked by `next-mdx-remote@^6` `blockJS: true` default)
- No `import`/`export` inside the MDX body
- JSX components (`<Callout>`, `<Stat>`, `<CodeFilename>`, `<InlineBadge>`) work correctly
- Use `<Note>` as an alias for `<Callout type="info">` if preferred

---

### `content/projects/machinery-mobile-first.pt.mdx` (content, static)

**Analog:** `content/projects/machinery-partner-ecommerce.pt.mdx`

**Frontmatter pattern** (lines 1–25 of analog):

```yaml
---
title: "E-commerce de máquinas pesadas"
role: "Principal Software Engineer"
year: 2024
stack:
  - [same stack array as EN]
blurb: "Primeira loja transacional de máquinas pesadas nos EUA — Next.js + commerce headless + ERP Odoo + app mobile nativo."
heroImage: "./machinery-partner-ecommerce/images/hero.jpg"
tags:
  - [same tags as EN]
featured: true
order: 1
---
```

**Apply for Mobile-First PT — substitute these values:**

```yaml
---
title: "Mobile-first de máquinas pesadas"
role: "Engenheiro de Software Principal"
year: 2024
stack:
  - React Native
  - Expo
  - TypeScript
  - Fastify
  - Bun
  - Odoo
blurb: "App mobile nativo para compradores de máquinas pesadas nos EUA — React Native + Expo, contrato de carrinho offline e revisão da App Store."
heroImage: "./machinery-mobile-first/images/hero.jpg"
tags:
  - mobile
  - react-native
  - e-commerce
featured: true
order: 5
---
```

**PT section headings** (follow analog lines 27–138):

```
## Problema
## Solução
## Impacto
## Stack
```

**Bilingual parity enforcement:** `verifyParity()` in `factory.ts` throws at build time if either sibling is missing. Both files MUST be committed in the same operation. Run `pnpm verify:projects` before `next build`.

---

### `content/projects/machinery-mobile-first/images/hero.jpg` (static asset, file-I/O)

**Analog:** All four existing hero images at `content/projects/*/images/hero.jpg`

**Required conventions** (verified from `content/projects/LICENSE-images.txt`):

| Property | Required Value |
|---|---|
| Format | JPEG (progressive) |
| Dimensions | 1024 × 640 px |
| Aspect ratio | 16:10 |
| File size | 15–18 KB target |
| Color palette | Jedi-leaning (saber blue), abstract/anonymized |
| No employer screenshots | Per T-03-03 NDA mitigation |

**Generation approach** (from LICENSE-images.txt note about prior `gen-heroes.mjs`):
Use `sharp` or ImageMagick to convert a hand-drawn SVG with saber-blue gradient to JPEG at 1024×640. An abstract geometric pattern is acceptable per CASE-19 ("hero image **or** gradient placeholder").

**Directory must be created:** `content/projects/machinery-mobile-first/images/` does not yet exist.

---

### `src/components/sections/case-study-hero.tsx` (component, modify)

**Analog:** Self — extend the existing file.

**Current imports block** (lines 1–15):

```typescript
import { Badge } from '@/components/ui';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/lib/i18n/navigation';
import type { Project } from '@/lib/mdx/schema';
import { getTranslations } from 'next-intl/server';
import Image, { type StaticImageData } from 'next/image';
import machineryEcommerce from '../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../content/projects/magazine-luiza-superapp/images/hero.jpg';
import uauboxHero from '../../../content/projects/uaubox-design-system/images/hero.jpg';
```

**Add this import after line 15** (alongside the other 4 static hero imports):

```typescript
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';
```

**Current HERO_IMAGES map** (lines 17–23):

```typescript
const HERO_IMAGES: Record<string, StaticImageData> = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'uaubox-design-system': uauboxHero,
};
```

**Updated HERO_IMAGES map — add the fifth entry:**

```typescript
const HERO_IMAGES: Record<string, StaticImageData> = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'uaubox-design-system': uauboxHero,
  'machinery-mobile-first': machineryMobileFirst,
};
```

**Build-time guard** (line 33–36 — do not modify):

```typescript
if (!heroSrc) {
  throw new Error(
    `[case-study-hero] No hero image registered for slug '${project.slug}'. Add it to HERO_IMAGES in src/components/sections/case-study-hero.tsx.`,
  );
}
```

This guard fires at build time (SSG). The import + map entry must land in the same commit as the hero image file — not before, not after.

---

### `src/app/[locale]/projects/page.tsx` (page, modify)

**Analog:** Self — extend the existing file.

**Current imports block** (lines 28–30):

```typescript
import machineryEcommerce from '../../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../../content/projects/magazine-luiza-superapp/images/hero.jpg';
```

**Add this import after line 30:**

```typescript
import machineryMobileFirst from '../../../../content/projects/machinery-mobile-first/images/hero.jpg';
```

**Current HERO_IMAGES map** (lines 32–36):

```typescript
const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
} as const;
```

**Updated HERO_IMAGES map — add the fifth entry:**

```typescript
const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'machinery-mobile-first': machineryMobileFirst,
} as const;
```

**Note on TypeScript inference:** The `as const` type means `HERO_IMAGES[p.slug as keyof typeof HERO_IMAGES]` (line 62) will produce a TypeScript error if `p.slug` is not a known key. The type cast `as keyof typeof HERO_IMAGES` must include the new slug — adding the entry to the map is sufficient to widen the `keyof` union automatically.

---

### `src/components/sections/featured-projects-teaser.tsx` (component, modify)

**Analog:** Self — extend the existing file.

**Current imports block** (lines 18–20):

```typescript
import machineryEcommerce from '../../../content/projects/machinery-partner-ecommerce/images/hero.jpg';
import machineryMigration from '../../../content/projects/machinery-partner-migration/images/hero.jpg';
import magaluSuperapp from '../../../content/projects/magazine-luiza-superapp/images/hero.jpg';
```

**Add this import after line 20:**

```typescript
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';
```

**Current HERO_IMAGES map** (lines 22–26):

```typescript
const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
} as const;
```

**Updated HERO_IMAGES map — add the fifth entry:**

```typescript
const HERO_IMAGES = {
  'machinery-partner-ecommerce': machineryEcommerce,
  'machinery-partner-migration': machineryMigration,
  'magazine-luiza-superapp': magaluSuperapp,
  'machinery-mobile-first': machineryMobileFirst,
} as const;
```

**Note on ordering:** The featured teaser shows only the first 3 featured projects (`.slice(0, 3)`). With `order: 5`, this case study will NOT appear on the home page teaser. It WILL appear on the full `/projects` listing page.

---

### `messages/en.json` (i18n config, modify)

**Analog:** Self — update 2 string literals.

**Current values:**

```json
// Line 78 — projects.listingDescription
"listingDescription": "Four case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, and a design system built from scratch.",

// Line 169 — seo.descriptions.projects
"projects": "Four case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, and a design system built from scratch.",
```

**Updated values:**

```json
// projects.listingDescription
"listingDescription": "Five case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, a design system built from scratch, and a mobile-first native app.",

// seo.descriptions.projects
"projects": "Five case studies: heavy machinery e-commerce, no-code → Next.js migration, React Native at scale, a design system built from scratch, and a mobile-first native app.",
```

Both keys receive the same string (they share the same content but serve different consumers: `listingDescription` feeds `generateMetadata` for `/projects`; `seo.descriptions.projects` feeds the home-page SEO section).

---

### `messages/pt.json` (i18n config, modify)

**Analog:** Self — update 2 string literals.

**Current values:**

```json
// Line 78 — projects.listingDescription
"listingDescription": "Quatro estudos de caso: e-commerce de máquinas pesadas, migração no-code → Next.js, React Native em escala e um design system construído do zero.",

// Line 169 — seo.descriptions.projects
"projects": "Quatro estudos de caso: e-commerce de máquinas pesadas, migração no-code → Next.js, React Native em escala e um design system construído do zero.",
```

**Updated values:**

```json
// projects.listingDescription
"listingDescription": "Cinco estudos de caso: e-commerce de máquinas pesadas, migração no-code → Next.js, React Native em escala, um design system construído do zero e um app mobile-first nativo.",

// seo.descriptions.projects
"projects": "Cinco estudos de caso: e-commerce de máquinas pesadas, migração no-code → Next.js, React Native em escala, um design system construído do zero e um app mobile-first nativo.",
```

---

## Shared Patterns

### Static Image Import (next/image)

**Source:** `src/components/sections/case-study-hero.tsx` lines 12–15 and `src/app/[locale]/projects/page.tsx` lines 28–30

**Apply to:** All three `HERO_IMAGES` maps

```typescript
// Pattern: module-level static import — blurDataURL auto-generated at build time
import machineryMobileFirst from '../../../content/projects/machinery-mobile-first/images/hero.jpg';
// (relative path differs by file depth — 3 levels from case-study-hero.tsx and featured-projects-teaser.tsx,
//  4 levels from projects/page.tsx)
```

The static import path is load-bearing: it must resolve at build time for Next.js to generate the `blurDataURL`. Dynamic `require()` or runtime URL strings do not generate blur placeholders.

### Bilingual Frontmatter Parity

**Source:** `src/lib/mdx/factory.ts` (verified — `verifyParity()` throws at build)

**Apply to:** Both MDX content files

Rule: `.en.mdx` and `.pt.mdx` must be committed together. The `stack`, `tags`, `heroImage`, `featured`, `order`, and `year` fields must have identical values across both locale files. Only `title` and `blurb` are locale-specific prose.

### MDX Toolkit Component Usage

**Source:** `content/projects/machinery-partner-ecommerce.en.mdx` + `src/components/mdx/index.ts`

**Apply to:** Both new MDX files (CASE-18 requires at least one toolkit component)

```mdx
{/* Callout — highlight an architectural insight */}
<Callout type="info">
Key insight text here.
</Callout>

{/* Stat — impact figure */}
<Stat number="98%" label="cart operations available offline before network sync" />

{/* CodeFilename — labeled code block */}
<CodeFilename filename="mobile/cart-state.ts">
```ts
export type CartState = { items: CartItem[]; version: number };
```
</CodeFilename>

{/* InlineBadge — inline tech reference */}
The pipeline exported <InlineBadge variant="primary">React Native</InlineBadge> and
<InlineBadge variant="secondary">Expo OTA</InlineBadge> from the same Figma source.
```

---

## No Analog Found

All files in this phase have direct analogs in the codebase. No files require falling back to RESEARCH.md reference patterns only.

---

## Metadata

**Analog search scope:** `content/projects/`, `src/components/sections/`, `src/app/[locale]/projects/`, `messages/`
**Files read:** 8 source files
**Pattern extraction date:** 2026-06-11

**Critical ordering constraint:** The hero image file at `content/projects/machinery-mobile-first/images/hero.jpg` must be created BEFORE the static imports in `case-study-hero.tsx`, `projects/page.tsx`, and `featured-projects-teaser.tsx` are added (or in the same commit). The build-time guard in `case-study-hero.tsx` line 33 throws if the slug is registered but the image file is missing; conversely, the TypeScript compiler errors if the import path does not resolve. All four must land atomically.
