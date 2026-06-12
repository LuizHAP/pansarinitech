# Phase 13: JS Bundle Optimization — Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 4 modified, 1 deleted
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/data/types.ts` (new) | types (no Zod) | static/read | self — extract types from schemas | exact |
| `src/data/schemas.ts` (modify) | schemas (Zod only) | static/read | self — remove type exports | exact |
| `src/lib/i18n/helpers.ts` (modify) | component | request-response | self — update import path | exact |
| `src/components/shared/deferred-command-palette.tsx` (modify) | component | request-response | self — reuse from Phase 11 | exact |
| `src/components/shared/header.tsx` (modify) | component | request-response | self — use deferred palette | exact |

---

## Pattern Assignments

### `src/data/types.ts` (new — Zod-free types)

**Analog:** Self — extract from existing `src/data/schemas.ts`.

**Required types to extract:**

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
```

**No Zod imports.** This file is pure TypeScript — safe for client-side consumption.

---

### `src/data/schemas.ts` (modify — remove type exports)

**Analog:** Self — remove type exports, keep only Zod schemas.

**Current structure:** Exports both Zod schemas AND TypeScript types.

**Updated structure:** Keep only Zod schemas. Remove all type exports.

```typescript
// src/data/schemas.ts (MODIFY)
import { z } from 'zod';

// Keep only Zod schemas — remove all type exports
export const roleSchema = z.enum(['principal', 'senior', 'mid', 'junior']);
export const skillCategorySchema = z.enum(['frontend', 'backend', 'devops', 'mobile', 'design']);
export const skillLevelSchema = z.enum(['expert', 'advanced', 'intermediate', 'beginner']);
// ... rest of schemas

// Remove: export type Role = ...
// Remove: export type Project = ...
// Remove: export type BlogPost = ...
```

---

### `src/lib/i18n/helpers.ts` (modify — update import path)

**Analog:** Self — change import from `@/data/schemas` to `@/data/types`.

**Current import:**
```typescript
import type { Role } from '@/data/schemas';
```

**Updated import:**
```typescript
import type { Role } from '@/data/types';
```

This is the critical change that breaks the Zod → client bundle chain.

---

### `src/components/shared/deferred-command-palette.tsx` (modify — reuse from Phase 11)

**Analog:** Self — this file was created in Phase 11 but never used. Reuse it.

**Current state:** File exists but may have been deleted during Phase 11 investigation. If deleted, recreate it.

**Required content:**
```typescript
// src/components/shared/deferred-command-palette.tsx
'use client';
import dynamic from 'next/dynamic';
const CommandPaletteRoot = dynamic(
  () => import('./command-palette').then((mod) => mod.CommandPaletteRoot),
  { ssr: false },
);
export { CommandPaletteRoot };
```

---

### `src/components/shared/header.tsx` (modify — use deferred palette)

**Analog:** Self — replace direct CommandPaletteRoot import with deferred version.

**Current import:**
```typescript
import { CommandPaletteRoot } from './command-palette';
```

**Updated import:**
```typescript
import { CommandPaletteRoot } from './deferred-command-palette';
```

This defers the 10 lucide icons + shadcn/ui bundle until first Cmd+K press.

---

## Shared Patterns

### Type Extraction from Zod Schemas

```typescript
// Before: types and schemas mixed in one file
import { z } from 'zod';
export const roleSchema = z.enum(['principal', 'senior', 'mid', 'junior']);
export type Role = z.infer<typeof roleSchema>; // ← Zod leak

// After: types in separate file, schemas in separate file
// types.ts: export type Role = 'principal' | 'senior' | 'mid' | 'junior';
// schemas.ts: export const roleSchema = z.enum(['principal', 'senior', 'mid', 'junior']);
```

### Dynamic Import with Client Wrapper

```typescript
// Wrapper (client component):
'use client';
import dynamic from 'next/dynamic';
const HeavyComponent = dynamic(
  () => import('./heavy-component'),
  { ssr: false },
);

// Usage in RSC parent:
import { HeavyComponent } from './deferred-heavy-component';
```

---

## No Analog Found

The type extraction pattern is new to this codebase. All other files have direct analogs.

---

## Metadata

**Analog search scope:** `src/data/`, `src/lib/i18n/`, `src/components/shared/`
**Files read:** 5 source files
**Pattern extraction date:** 2026-06-12

**Critical ordering constraint:** The type extraction (Task 1) must be done BEFORE updating imports in `i18n/helpers.ts` (Task 2). The import update must be done BEFORE deferring the command palette (Task 3), because the palette defer is a secondary optimization.
