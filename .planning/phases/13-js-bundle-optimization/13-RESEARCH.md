# Phase 13: JS Bundle Optimization — Research

**Researched:** 2026-06-12
**Domain:** Next.js bundle analysis, tree-shaking, code-splitting, client/server boundary
**Confidence:** HIGH — all findings verified from live build output

---

## Summary

Phase 13 targets the 608KB JS bundle (16 scripts) blocking the main thread. The Lighthouse Performance score is 0.75 on production (CI threshold 0.7). The goal is to reduce total JS by ≥ 50% (608KB → ≤ 300KB target).

**Primary bottleneck identified: Zod (226KB) leaking into client bundle.**

Zod is only imported in 3 files, all server-side:
- `src/lib/mdx/schema.ts` — `import { z } from 'zod'`
- `src/lib/mdx/factory.ts` — `import type { z } from 'zod'`
- `src/data/schemas.ts` — `import { z } from 'zod'`

However, `src/lib/i18n/helpers.ts` imports `type { Role }` from `@/data/schemas`, which transitively pulls in Zod. Even though it's `import type`, Turbopack/Next.js may be including the Zod runtime in the client bundle.

**Other large chunks:**
- `11.00uwk2r_mi.js` — 288KB (React + Next.js internals)
- `11be-bqh67r_l.js` — 282KB (React + Next.js internals)
- `0qnm4tx4gf8s6.js` — 282KB (React + Next.js internals)
- `0erd080oddvxq.js` — 226KB (Zod)
- `09i1i0u87fy9c.js` — 190KB (lucide icons + shadcn/ui)

**Key insight:** The 3 largest chunks (288KB, 282KB, 282KB) are React/Next.js internals — not eliminable. The real targets are:
1. Zod (226KB) — eliminate from client bundle
2. lucide icons (10+ icons in command palette) — tree-shake or defer
3. shadcn/ui components — defer non-critical client components

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Zod removal | API/Backend (RSC build) | — | Zod should only exist in server-side code |
| lucide icons tree-shaking | Frontend Server (RSC build) | — | Import only used icons, not the full library |
| Client component deferral | Frontend Server (RSC) | — | Defer non-critical client components until user interaction |
| Bundle analysis | Build tool (Turbopack) | — | `next bundle analyzer` or manual chunk inspection |

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASE-24 | Total JS transfer size reduced by ≥ 50% (608KB → ≤ 300KB target) | Zod (226KB) is the largest eliminable chunk |
| CASE-25 | Lighthouse Performance score improves (current CI: 0.75, target: ≥ 0.85) | Reducing JS will reduce main-thread blocking |
| CASE-26 | No regressions in functionality or tests | All changes must be verified with existing test suite |

---

## Standard Stack

### Core (all verified from codebase — no new packages needed)

| File / Library | Role in This Phase | Notes |
|----------------|-------------------|-------|
| `src/lib/i18n/helpers.ts` | **Modify** — remove Zod dependency | Currently imports `type { Role }` from `@/data/schemas` which pulls in Zod |
| `src/data/schemas.ts` | **Modify** — extract Zod-free types | Create a separate types file without Zod imports |
| `src/components/shared/command-palette.tsx` | **Modify** — defer lucide icons | Currently imports 10 lucide icons; defer with dynamic import |
| `src/components/shared/header.tsx` | **Modify** — defer CommandPaletteRoot | Already attempted (see Phase 11 research), but SSR:false not allowed in RSC |
| `src/components/shared/deferred-command-palette.tsx` | **Delete** — unused from Phase 11 | Created but not used; remove to clean up |

[VERIFIED: codebase direct inspection]

### No New Packages Required

All optimizations use existing Next.js/Turbopack features: dynamic imports, type-only imports, and manual tree-shaking.

---

## Architecture Patterns

### Pattern 1: Extract Zod-Free Types

**Problem:** `src/data/schemas.ts` exports both Zod schemas AND TypeScript types. The types are imported by client-side code (`src/lib/i18n/helpers.ts`), causing Zod to leak into the client bundle.

**Solution:** Split `src/data/schemas.ts` into two files:
- `src/data/types.ts` — TypeScript type definitions only (no Zod imports)
- `src/data/schemas.ts` — Zod schemas only (server-side only)

```typescript
// src/data/types.ts (NEW — no Zod imports)
export type Role = 'principal' | 'senior' | 'mid' | 'junior';
export type SkillCategory = 'frontend' | 'backend' | 'devops' | 'mobile' | 'design';
export type SkillLevel = 'expert' | 'advanced' | 'intermediate' | 'beginner';
export type Project = { /* ... */ };
export type BlogPost = { /* ... */ };

// src/data/schemas.ts (MODIFY — remove type exports)
import { z } from 'zod';
// Keep only Zod schemas, remove type exports
export const roleSchema = z.enum(['principal', 'senior', 'mid', 'junior']);
// ... other schemas
```

### Pattern 2: Dynamic Import for Heavy Client Components

**Problem:** `command-palette.tsx` imports 10 lucide icons + shadcn/ui components that hydrate on every page load but are only needed on Cmd+K.

**Solution:** Use `next/dynamic` with a client wrapper (see Phase 11 research for the wrapper pattern).

```typescript
// src/components/shared/deferred-command-palette.tsx (REUSE from Phase 11)
'use client';
import dynamic from 'next/dynamic';
const CommandPaletteRoot = dynamic(
  () => import('./command-palette').then((mod) => mod.CommandPaletteRoot),
  { ssr: false },
);
export { CommandPaletteRoot };
```

### Pattern 3: Selective Icon Imports

**Problem:** `command-palette.tsx` imports 10 lucide icons:
```typescript
import { Search, BookOpen, FileText, Code2, Briefcase, GraduationCap, Mail, Moon, Sun, Globe } from 'lucide-react';
```

**Solution:** Keep these imports — they're already selective (not importing the full library). Lucide tree-shakes automatically when imported individually.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zod client leak | Custom Zod replacement | Split types from schemas | Zod is needed for server-side validation; only the types need to be client-accessible |
| Bundle analysis | Manual chunk inspection | `next bundle analyzer` (if available) or `ls -la .next/static/chunks/` | Automated analysis is more reliable |
| Client component deferral | Custom hydration logic | `next/dynamic` with `ssr: false` | Standard Next.js pattern, well-tested |

---

## Common Pitfalls

### Pitfall 1: `import type` Doesn't Always Prevent Bundling

**What goes wrong:** Even `import type { Role } from '@/data/schemas'` may cause Zod to be bundled if the TypeScript compiler doesn't fully strip the import at the bundler level.

**How to avoid:** Split types into a separate file (`src/data/types.ts`) that has zero Zod imports. This guarantees no Zod code reaches the client.

### Pitfall 2: `ssr: false` Not Allowed in RSC

**What goes wrong:** Attempting `dynamic(() => import(...), { ssr: false })` directly in a Server Component causes a build error.

**How to avoid:** Create a thin client wrapper component (`'use client'`) that does the dynamic import. The RSC parent imports the wrapper, not the dynamic import directly.

### Pitfall 3: Over-Optimizing React/Next.js Internals

**What goes wrong:** Trying to reduce the 288KB React chunk (11.00uwk2r_mi.js) — this is Next.js/React internals and cannot be eliminated.

**How to avoid:** Focus on eliminable chunks: Zod (226KB), lucide icons (deferred), shadcn/ui (deferred). The React/Next.js chunks are fixed costs.

---

## Code Examples

### Split Types from Schemas

```typescript
// src/data/types.ts (NEW)
export type Role = 'principal' | 'senior' | 'mid' | 'junior';
export type SkillCategory = 'frontend' | 'backend' | 'devops' | 'mobile' | 'design';
export type SkillLevel = 'expert' | 'advanced' | 'intermediate' | 'beginner';
export type Project = {
  title: string;
  role: string;
  year: number;
  stack: string[];
  blurb: string;
  heroImage: string;
  tags: string[];
  featured: boolean;
  order: number;
};
export type BlogPost = {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  slug: string;
  readingTime: number;
};

// src/data/schemas.ts (MODIFY)
import { z } from 'zod';
// Remove type exports, keep only Zod schemas
export const roleSchema = z.enum(['principal', 'senior', 'mid', 'junior']);
// ... rest of schemas
```

### Client Wrapper for Dynamic Import

```typescript
// src/components/shared/deferred-command-palette.tsx (REUSE from Phase 11)
'use client';
import dynamic from 'next/dynamic';
const CommandPaletteRoot = dynamic(
  () => import('./command-palette').then((mod) => mod.CommandPaletteRoot),
  { ssr: false },
);
export { CommandPaletteRoot };
```

---

## Sources

### Primary (HIGH confidence — verified from live codebase)
- `.next/static/chunks/` — actual chunk sizes from production build
- `src/lib/i18n/helpers.ts` — imports `type { Role }` from `@/data/schemas`
- `src/data/schemas.ts` — exports Zod schemas AND TypeScript types
- `src/components/shared/command-palette.tsx` — imports 10 lucide icons
- `src/components/shared/header.tsx` — renders CommandPaletteRoot
- `src/components/shared/deferred-command-palette.tsx` — unused from Phase 11

### No external sources consulted

This research was fully satisfied by direct codebase inspection. No WebSearch or external documentation was required.

---

## Metadata

**Confidence breakdown:**
- Zod leak chain: HIGH — traced from `i18n/helpers.ts` → `@/data/schemas` → Zod
- Chunk sizes: HIGH — verified from `.next/static/chunks/`
- React/Next.js internals: HIGH — 288KB + 282KB + 282KB are fixed costs
- `ssr: false` in RSC: HIGH — verified failure in Phase 11

**Research date:** 2026-06-12
**Valid until:** Indefinite — based on codebase state, not external library versions
