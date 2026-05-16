# Phase 4: SEO Enrichment - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers two targeted improvements to blog and project post pages:

1. **Heading typography (SEO-01):** Add inline Tailwind `prose-*` class overrides to the existing `prose` wrapper divs so `h1`/`h2`/`h3` headings have distinct vertical spacing and scroll margin. No new CSS files or globals.css changes.

2. **JSON-LD structured data (SEO-02):** Create a shared `<JsonLd>` server component and inject it into every blog post (`Article` schema) and project post (`WebPage` schema) so search engines and AI crawlers can parse the content metadata.

Out of scope: New routes, new content fields, new layouts, RSS feed, sitemap changes, OG image changes.

</domain>

<decisions>
## Implementation Decisions

### Heading Typography (SEO-01)

- **D-01:** Apply heading overrides as **inline Tailwind class additions** on the existing `prose prose-neutral ... dark:prose-invert` wrapper `<div>` in both page files — do NOT touch `globals.css`. Exact utility additions: `prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20` (Claude may tune values slightly for visual balance but should use roughly these proportions).
- **D-02:** Apply to **both** pages:
  - `src/app/[locale]/blog/[slug]/page.tsx` — the `<div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">` at the bottom of the content column
  - `src/app/[locale]/projects/[slug]/page.tsx` — the `<div className="prose prose-neutral mx-auto max-w-3xl px-4 py-8 dark:prose-invert">` below CaseStudyHero
- **D-03:** Include `prose-headings:scroll-mt-20` so TOC anchor links (blog has a sidebar TOC) clear the sticky header when users click a heading.

### JSON-LD Architecture (SEO-02)

- **D-04:** Create a **shared `<JsonLd>` server component** at `src/components/json-ld.tsx`. It accepts a typed schema object and renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />`. No runtime cost — RSC only.
- **D-05:** Render `<JsonLd>` **inside each page's `<article>`** element. Next.js App Router hoists `<script type="application/ld+json">` to `<head>` at build time — no `next/head` or `useEffect` needed.
- **D-06:** **Blog `Article` schema fields** (rich set):
  - `@context`: `"https://schema.org"`
  - `@type`: `"Article"`
  - `headline`: `post.title`
  - `description`: `post.excerpt`
  - `author`: `{ "@type": "Person", "name": "Luiz Pansarini" }` — hardcoded, single-author site
  - `publisher`: same Person object (no Organization)
  - `datePublished`: `post.date` (already ISO `YYYY-MM-DD`)
  - `url`: canonical URL (`${SITE_URL}/blog/${slug}` — no locale prefix in canonical per existing seo.ts pattern)
  - `inLanguage`: locale map — `en` → `"en"`, `pt` → `"pt-BR"`
  - `keywords`: `post.tags.join(", ")`
  - `image`: OG image URL — Claude picks the correct next/og generated path pattern (e.g. `${SITE_URL}/en/blog/${slug}/opengraph-image`)
  - `wordCount`: `Math.round(post.readingTime.minutes * 200)` — Claude may adjust the words-per-minute multiplier
- **D-07:** **Blog schema `@type`: `"Article"`** (ROADMAP SEO-02 specifies this).
- **D-08:** **Project schema `@type`: `"WebPage"`** — avoids `SoftwareApplication`'s required fields (`operatingSystem`, `applicationCategory`) that aren't in `ProjectFrontmatter`.
- **D-09:** Project `datePublished` fallback: `"${project.year}-01-01"` — `year` is a `number` in `ProjectFrontmatter`, so stub to Jan 1 of that year.
- **D-10:** **Project `WebPage` schema fields** (same rich set as blog):
  - `@context`: `"https://schema.org"`
  - `@type`: `"WebPage"`
  - `name`: `project.title`
  - `description`: `project.blurb`
  - `author`: same Person object
  - `datePublished`: `"${project.year}-01-01"`
  - `url`: canonical URL
  - `inLanguage`: same locale map
  - `keywords`: `project.stack.join(", ")`
  - `image`: `project.heroImage` (already a URL in frontmatter)
  - `wordCount`: same readingTime-based calculation

### Claude's Discretion

- Exact Tailwind class values for heading margins (`prose-h2:mt-10` is a guideline — Claude tunes for visual balance)
- `<JsonLd>` component's TypeScript interface — `Record<string, unknown>` is fine; no need for a branded union type for this phase
- `publisher` type: use `@type: "Person"` matching author (no Organization schema needed for a personal site)
- Exact OG image URL path format — depends on Next.js opengraph-image.tsx generated routes; Claude should verify the correct pattern from the existing `opengraph-image.tsx` files
- wordCount words-per-minute multiplier (200 wpm is the guideline)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/ROADMAP.md` §"Phase 4: SEO Enrichment" — Goal, Success Criteria, SEO-01 and SEO-02
- `.planning/REQUIREMENTS.md` §SEO-01, §SEO-02 — Full requirement text

### Existing SEO infrastructure
- `src/lib/seo.ts` — Centralized `buildMetadata` factory; `SITE_URL` constant used for canonical URLs; `OG_LOCALE` map (`en → "en_US"`, `pt → "pt_BR"`) — JSON-LD `inLanguage` should use the same locale values (simplified to `"en"` / `"pt-BR"`)
- `src/app/[locale]/blog/[slug]/page.tsx` — Current blog post page; `prose` wrapper div at line 94 is the heading-override target; `buildMetadata` call shows available frontmatter fields
- `src/app/[locale]/projects/[slug]/page.tsx` — Current project post page; `prose` wrapper div at line 50 is the heading-override target

### Schema and content types
- `src/lib/mdx/schema.ts` — `BlogFrontmatter` (title, date, excerpt, tags, draft) and `ProjectFrontmatter` (title, role, year, stack, blurb, heroImage) — all JSON-LD field mappings derive from these types
- `src/lib/mdx/blog.ts` — `getPost` return type (`PostWithContent`) — shows `readingTime.minutes` availability
- `src/lib/mdx/projects.ts` — `getProject` return type — same readingTime pattern

### MDX component pattern
- `src/components/mdx/index.ts` — Existing `mdxComponents` map; new `<JsonLd>` component lives in `src/components/` (not `src/components/mdx/`) — it's a page-level structural component, not an MDX inline component

### OG image routes (verify path format for JSON-LD image field)
- `src/app/[locale]/blog/[slug]/opengraph-image.tsx` — OG image route for blog posts
- `src/app/[locale]/projects/[slug]/opengraph-image.tsx` — OG image route for project posts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/seo.ts` exports `SITE_URL` constant and `OG_LOCALE` map — `<JsonLd>` should import `SITE_URL` from here rather than re-declaring it
- `prose prose-neutral dark:prose-invert` class combo — already on both target pages, only needs augmentation with heading-specific utilities

### Established Patterns
- **Metadata pattern:** `buildMetadata()` in each `generateMetadata()` export — JSON-LD follows the same co-location pattern (both live in the page file, close to each other)
- **RSC-only components:** `src/components/blog/toc-sidebar.tsx` etc. are server components with no `"use client"` — `<JsonLd>` follows the same pattern
- **Tailwind prose overrides:** `prose-neutral` and `dark:prose-invert` are already applied as modifier classes — new `prose-h2:*` / `prose-headings:*` utilities follow the same inline-class pattern Tailwind v4 uses

### Integration Points
- `src/app/[locale]/blog/[slug]/page.tsx:94` — `<div className="prose...">` receives heading override classes
- `src/app/[locale]/projects/[slug]/page.tsx:50` — `<div className="prose...">` receives heading override classes
- Both `page.tsx` files get `<JsonLd schema={...} />` injected at the top of their `<article>` element
- `src/lib/seo.ts:SITE_URL` — canonical URL base imported by `<JsonLd>` helper function

</code_context>

<specifics>
## Specific Ideas

- The `<JsonLd>` component name is preferred (matches SEO community convention for this pattern)
- `wordCount` calculated as `Math.round(post.readingTime.minutes * 200)` — aligns with the 200 wpm reading speed convention
- `publisher` and `author` use identical Person objects (Luiz Pansarini) — a single const can be shared in the component

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-SEO Enrichment*
*Context gathered: 2026-05-15*
