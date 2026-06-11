# Phase 11: Lighthouse Performance Fix + Quality Verification — Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 6 (2 modified Lighthouse configs, 1 modified component, 3 modified test files)
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sections/case-study-hero.tsx` (modify) | component | request-response | self — extend existing `<Image>` props | exact |
| `.lighthouserc.json` (modify) | config | static/read | self — update threshold + URL array | exact |
| `.lighthouserc.local.json` (modify) | config | static/read | self — update threshold + URL array | exact |
| `tests/a11y-matrix.spec.ts` (modify) | test | runtime | self — extend `PAGES` array | exact |
| `tests/iphone-se.spec.ts` (modify) | test | runtime | self — extend `scenarios` array | exact |
| `tests/e2e.spec.ts` (modify) | test | runtime | self — add mobile-first variant | exact |

---

## Pattern Assignments

### `src/components/sections/case-study-hero.tsx` (component, modify)

**Analog:** Self — extend the existing `<Image>` component.

**Current hero image** (lines 57-65):

```tsx
<Image
  src={heroSrc}
  alt={project.title}
  sizes="(max-width: 768px) 100vw, 80vw"
  priority
  fetchPriority="high"
  placeholder="blur"
  className="h-auto w-full"
/>
```

**Updated hero image — add `width`, `height`, tighten `sizes`:**

```tsx
<Image
  src={heroSrc}
  alt={project.title}
  width={1024}
  height={640}
  sizes="(max-width: 768px) 100vw, 768px"
  priority
  fetchPriority="high"
  placeholder="blur"
  className="h-auto w-full"
/>
```

**Rationale:**
- `width={1024} height={640}` — matches the actual hero image dimensions (1024×640 JPEG, verified from `file` command on all existing heroes). Allows browser to reserve layout space immediately.
- `sizes="(max-width: 768px) 100vw, 768px"` — the hero is inside `max-w-3xl` (768px) on the case study page. On desktop, the image is at most 768px wide, not 80vw. This tells the browser to pick a smaller image variant on desktop, reducing download size.

**Verification:** After applying, run `pnpm build` to confirm no TypeScript errors, then `pnpm lh:local` to verify the UAUBox Performance score improves.

---

### `.lighthouserc.json` (Lighthouse CI config, modify)

**Analog:** Self — update threshold and URL array.

**Current performance threshold** (line 28):

```json
"categories:performance": ["error", { "minScore": 0.85 }]
```

**Updated performance threshold:**

```json
"categories:performance": ["error", { "minScore": 0.95 }]
```

**Current URL array** (lines 5-10):

```json
"url": [
  "http://localhost:3000/",
  "http://localhost:3000/now",
  "http://localhost:3000/projects",
  "http://localhost:3000/blog",
  "http://localhost:3000/blog/building-this-portfolio",
  "http://localhost:3000/projects/uaubox-design-system"
]
```

**Updated URL array — add mobile-first case study:**

```json
"url": [
  "http://localhost:3000/",
  "http://localhost:3000/now",
  "http://localhost:3000/projects",
  "http://localhost:3000/blog",
  "http://localhost:3000/blog/building-this-portfolio",
  "http://localhost:3000/projects/uaubox-design-system",
  "http://localhost:3000/projects/machinery-mobile-first"
]
```

---

### `.lighthouserc.local.json` (Local Lighthouse config, modify)

**Analog:** Self — update threshold and URL array.

**Current performance threshold** (line 28):

```json
"categories:performance": ["error", { "minScore": 0.8 }]
```

**Updated performance threshold:**

```json
"categories:performance": ["error", { "minScore": 0.95 }]
```

**Current URL array** (lines 5-10):

```json
"url": [
  "http://localhost:3001/",
  "http://localhost:3001/now",
  "http://localhost:3001/projects",
  "http://localhost:3001/blog",
  "http://localhost:3001/blog/building-this-portfolio",
  "http://localhost:3001/projects/uaubox-design-system"
]
```

**Updated URL array — add mobile-first case study:**

```json
"url": [
  "http://localhost:3001/",
  "http://localhost:3001/now",
  "http://localhost:3001/projects",
  "http://localhost:3001/blog",
  "http://localhost:3001/blog/building-this-portfolio",
  "http://localhost:3001/projects/uaubox-design-system",
  "http://localhost:3001/projects/machinery-mobile-first"
]
```

---

### `tests/a11y-matrix.spec.ts` (test, modify)

**Analog:** Self — extend the `PAGES` array.

**Current pattern** (from existing codebase):

```typescript
const PAGES = [
  { path: '/projects/uaubox-design-system', name: 'UAUBox DS' },
  // ... other pages
];
```

**Updated pattern — add mobile-first entry:**

```typescript
const PAGES = [
  { path: '/projects/uaubox-design-system', name: 'UAUBox DS' },
  { path: '/projects/machinery-mobile-first', name: 'Machinery Mobile-First' },
  // ... other pages
];
```

This extends the a11y matrix to 8 pages × 4 locale/theme combos = 32 test cases.

---

### `tests/iphone-se.spec.ts` (test, modify)

**Analog:** Self — extend the `scenarios` array.

**Current pattern** (from existing codebase):

```typescript
const scenarios = [
  { path: '/projects/uaubox-design-system', name: 'UAUBox DS' },
  // ... other scenarios
];
```

**Updated pattern — add mobile-first scenario:**

```typescript
const scenarios = [
  { path: '/projects/uaubox-design-system', name: 'UAUBox DS' },
  { path: '/projects/machinery-mobile-first', name: 'Machinery Mobile-First' },
  // ... other scenarios
];
```

---

### `tests/e2e.spec.ts` (test, modify)

**Analog:** Self — optionally add mobile-first variant.

**Current pattern** (from existing codebase):

```typescript
test('case study page renders correctly', async ({ page }) => {
  await page.goto('/projects/magazine-luiza-superapp');
  // ... assertions
});
```

**Updated pattern — add mobile-first variant (optional):**

```typescript
test('mobile-first case study renders correctly', async ({ page }) => {
  await page.goto('/projects/machinery-mobile-first');
  // ... assertions mirroring existing case study test
});
```

If the existing case study test is deemed sufficient as a representative sample, this file may not need changes.

---

## Shared Patterns

### Lighthouse Config Structure

Both `.lighthouserc.json` and `.lighthouserc.local.json` follow the same structure:

```json
{
  "ci": {
    "collect": {
      "url": [...],
      "settings": { "skipAudits": [...] },
      "numberOfRuns": N
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": X }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

The only fields that change in Phase 11 are:
1. `categories:performance` minScore (0.85 → 0.95 for CI, 0.8 → 0.95 for local)
2. `url` array (add mobile-first URL)

### Test Matrix Extension Pattern

All test files follow a simple array-of-objects pattern:

```typescript
const ITEMS = [
  { path: '/existing-slug', name: 'Existing' },
  // Add new entries here
];
```

The new entry format is always `{ path: '/projects/<slug>', name: '<Title>' }`.

---

## No Analog Found

All files in this phase have direct analogs in the codebase. No files require falling back to RESEARCH.md reference patterns only.

---

## Metadata

**Analog search scope:** `.lighthouserc*.json`, `tests/*.spec.ts`, `src/components/sections/case-study-hero.tsx`
**Files read:** 6 source files
**Pattern extraction date:** 2026-06-11

**Critical ordering constraint:** The LCP fix (Task 1) must be applied and verified locally BEFORE raising the CI threshold (Task 2). Raising the threshold without the fix causes immediate CI failure. The test matrix extensions (Task 3) are independent of the LCP fix and can be done in any order relative to it.
