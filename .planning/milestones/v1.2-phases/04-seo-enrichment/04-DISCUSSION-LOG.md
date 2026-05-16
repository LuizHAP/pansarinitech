# Phase 4: SEO Enrichment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 4-SEO Enrichment
**Areas discussed:** Heading typography, JSON-LD architecture, Project post schema type

---

## Heading Typography

| Option | Description | Selected |
|--------|-------------|----------|
| Inline Tailwind classes | Add prose-h2:mt-10 prose-h3:mt-8 etc. directly on the prose wrapper div | ✓ |
| Global CSS in globals.css | Add .prose h2 { margin-top: 2.5rem } etc. inside globals.css | |
| You decide | Claude picks the cleaner approach based on existing patterns | |

**User's choice:** Inline Tailwind classes

---

| Option | Description | Selected |
|--------|-------------|----------|
| Both (blog + projects) | Apply to both /blog/[slug]/page.tsx and /projects/[slug]/page.tsx | ✓ |
| Blog only | Only blog posts — project pages have a different structure | |

**User's choice:** Both

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add prose-headings:scroll-mt-20 | Prevents sticky nav from covering heading on TOC anchor clicks | ✓ |
| No — spacing only | Focus on visual spacing only | |

**User's choice:** Yes — add prose-headings:scroll-mt-20

---

## JSON-LD Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Shared <JsonLd> server component | src/components/json-ld.tsx accepts typed schema, renders script tag | ✓ |
| Inline in each page | Add script dangerouslySetInnerHTML directly in each page.tsx | |
| Helper in seo.ts | buildJsonLd() in seo.ts + inline script in each page | |

**User's choice:** Shared <JsonLd> server component

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inside the page's <article> | Next.js hoists it to <head> at build time — standard App Router pattern | ✓ |
| In generateMetadata | Not supported — Metadata API doesn't accept raw script tags | |

**User's choice:** Inside the page's <article>

---

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — required fields only | name, description, author, datePublished, url, inLanguage | |
| Medium — required + keywords + publisher | Adds keywords (from tags) and publisher Person | |
| Rich — add image + headline + wordCount | All above plus image (OG), headline, wordCount (readingTime proxy) | ✓ |

**User's choice:** Rich — add image + headline + wordCount

---

## Project Post Schema Type

| Option | Description | Selected |
|--------|-------------|----------|
| WebPage | Safe, generic, no awkward field mismatches | ✓ |
| SoftwareApplication | Requires operatingSystem/applicationCategory not in frontmatter | |
| Article — same as blog | Consistent schema but year-only date is a mismatch | |

**User's choice:** WebPage

---

| Option | Description | Selected |
|--------|-------------|----------|
| "${year}-01-01" fallback | Common ISO-8601 pattern for year-only timestamps | ✓ |
| Omit datePublished for projects | WebPage doesn't require it — simpler | |
| Add date field to ProjectFrontmatter | Correct long-term but requires MDX file updates | |

**User's choice:** "${year}-01-01" fallback

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — same rich fields as blog | heroImage for image, readingTime for wordCount, stack[] for keywords | ✓ |
| Simpler — minimal fields only | WebPage schema minimal: name, description, author, url, inLanguage | |

**User's choice:** Yes — same rich fields as blog

---

## Claude's Discretion

- Exact Tailwind class values for heading margins (prose-h2:mt-10 is a guideline)
- <JsonLd> TypeScript interface shape
- publisher @type (Person chosen — no Organization for a personal site)
- OG image URL path format
- wordCount words-per-minute multiplier

## Deferred Ideas

None — discussion stayed within phase scope.
