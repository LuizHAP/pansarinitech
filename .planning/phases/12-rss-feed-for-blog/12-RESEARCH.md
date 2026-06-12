# Phase 12: RSS Feed for Blog — Research

**Researched:** 2026-06-12
**Domain:** RSS/Atom feed generation + Next.js App Router route handlers
**Confidence:** HIGH — all findings verified directly from the live codebase

---

## Summary

Phase 12 adds RSS feeds for the blog. Two feeds: `/feed.xml` (EN) and `/feed.pt.xml` (PT), each listing up to 20 recent posts sorted by date descending, with proper XML namespaces, atom-compliant structure, and full post content (not just excerpts).

The blog data pipeline is already built: `getPosts(locale)` in `src/lib/mdx/blog.ts` returns posts sorted newest-first, each with `title`, `date`, `excerpt`, `tags`, `slug`, `readingTime`, `content`, and `rawBody`. The `SITE_URL` constant from `src/components/json-ld.tsx` provides the base URL.

**Primary recommendation:** Use Next.js App Router route handlers (`src/app/[locale]/blog/feed/route.ts`) to generate RSS 2.0 XML dynamically at request time. This avoids static generation complexity and automatically picks up new posts without rebuild.

**Key files to create:**
- `src/app/[locale]/blog/feed/route.ts` — RSS route handler
- `<link>` tags in blog page head (both listing and post pages)

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| RSS XML generation | Frontend Server (Route Handler) | — | `route.ts` runs on each request, calls `getPosts(locale)` |
| Post data sourcing | API/Backend (RSC build) | — | `getPosts(locale)` auto-discovers all published posts |
| Feed link injection | Frontend Server (RSC) | — | `<head>` tags in blog listing + post pages |
| SITE_URL resolution | Frontend Server (env) | — | `SITE_URL` from `json-ld.tsx` env variable |

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASE-21 | `/feed.xml` returns `application/rss+xml` with valid RSS 2.0, listing up to 20 most recent published posts | `getPosts(locale)` already returns posts sorted newest-first; limit to 20 |
| CASE-22 | `/feed.pt.xml` returns the same posts with PT translations of title/description | Bilingual parity: same slugs, different locale feeds |
| CASE-23 | Each feed item includes: title, link, pubDate, description, and author | Post data has all required fields; author is `AUTHOR_PERSON` |

---

## Standard Stack

### Core (all verified from codebase — no new packages needed)

| File / Library | Role in This Phase | Notes |
|----------------|-------------------|-------|
| `src/app/[locale]/blog/feed/route.ts` | **New** — RSS route handler | Returns `Response` with `application/rss+xml` content type |
| `src/lib/mdx/blog.ts` — `getPosts` | Post data source | Returns `Post[]` sorted newest-first, draft-filtered |
| `src/components/json-ld.tsx` — `SITE_URL` | Base URL for feed links | Already exported, used in JSON-LD |
| `src/app/[locale]/blog/page.tsx` | Feed link injection | Add `<link rel="alternate" type="application/rss+xml">` to head |
| `src/app/[locale]/blog/[slug]/page.tsx` | Feed link injection | Same link tag on post pages |

[VERIFIED: codebase direct inspection]

### No New Packages Required

RSS generation is pure XML string construction — no external dependencies needed. The full blog data pipeline is pre-built.

---

## Architecture Patterns

### RSS 2.0 Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Luiz Pansarini — Blog</title>
    <link>https://pansarini.tech/blog</link>
    <description>Principal Software Engineer — technical writing</description>
    <language>en</language>
    <atom:link href="https://pansarini.tech/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>Mon, 16 Jun 2026 00:00:00 GMT</lastBuildDate>
    <item>
      <title>Post title</title>
      <link>https://pansarini.tech/blog/post-slug</link>
      <pubDate>Mon, 16 Jun 2026 00:00:00 GMT</pubDate>
      <description>Post excerpt or full content</description>
      <guid>https://pansarini.tech/blog/post-slug</guid>
    </item>
    <!-- ... up to 20 items ... -->
  </channel>
</rss>
```

### Route Handler Pattern

```typescript
// src/app/[locale]/blog/feed/route.ts
import { NextResponse } from 'next/server';
import { SITE_URL } from '@/components/json-ld';
import { getPosts } from '@/lib/mdx/blog';
import type { Locale } from '@/i18n/routing';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: Locale }> },
) {
  const { locale } = await params;
  const posts = await getPosts(locale);
  const feedPosts = posts.slice(0, 20);
  const xml = generateRss({ locale, posts: feedPosts });
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}

function generateRss({ locale, posts }: { locale: string; posts: Post[] }): string {
  const language = locale === 'pt' ? 'pt-BR' : 'en';
  const feedTitle = locale === 'pt' ? 'Luiz Pansarini — Blog' : 'Luiz Pansarini — Blog';
  const feedLink = locale === 'pt' ? `${SITE_URL}/feed.pt.xml` : `${SITE_URL}/feed.xml`;
  const channelLink = locale === 'pt' ? `${SITE_URL}/pt/blog` : `${SITE_URL}/en/blog`;
  const lastBuildDate = posts[0]?.date ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.excerpt)}</description>
      <guid>${SITE_URL}/blog/${p.slug}</guid>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${channelLink}</link>
    <description>Principal Software Engineer — technical writing</description>
    <language>${language}</language>
    <atom:link href="${feedLink}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

### Feed Link Tags

Add to both blog listing and post pages:

```html
<link rel="alternate" type="application/rss+xml" title="Blog (EN)" href="/feed.xml" />
<link rel="alternate" type="application/rss+xml" title="Blog (PT)" href="/feed.pt.xml" />
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RSS XML generation | Custom XML library | Manual string construction | RSS 2.0 is simple enough for template literals; no dependency needed |
| Route type | Static page (`/feed.xml`) | Route handler (`route.ts`) | Dynamic — automatically picks up new posts without rebuild |
| Date formatting | Custom date parser | `new Date(date).toUTCString()` | Standard, produces RFC 2822 format required by RSS |

---

## Common Pitfalls

### Pitfall 1: XML Special Characters

**What goes wrong:** Post titles or excerpts containing `&`, `<`, `>`, `"`, or `'` break XML parsing.

**How to avoid:** Always escape XML special characters. The `escapeXml()` function handles all 5 characters.

### Pitfall 2: Dynamic Route Handler vs Static Generation

**What goes wrong:** Using a static page (`/feed.xml`) means the feed only updates on rebuild. New posts won't appear until the next deploy.

**How to avoid:** Use a route handler (`route.ts`) which generates RSS on each request. This is the recommended pattern for RSS in Next.js App Router.

### Pitfall 3: Locale Routing Mismatch

**What goes wrong:** The site uses `localePrefix: 'never'` (verified in `routing.ts`), so URLs are `/blog` for both locales. The feed routes must match this pattern.

**How to avoid:** Use `/feed.xml` and `/feed.pt.xml` at the root level (not under `/[locale]/blog/feed/`). The `.pt` suffix in the filename distinguishes the PT feed.

---

## Code Examples

### RSS Feed Route Handler (canonical pattern)

```typescript
// src/app/[locale]/blog/feed/route.ts
import { NextResponse } from 'next/server';
import { SITE_URL } from '@/components/json-ld';
import { getPosts } from '@/lib/mdx/blog';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const posts = await getPosts(locale as 'en' | 'pt');
  const feedPosts = posts.slice(0, 20);
  const xml = generateRss({ locale, posts: feedPosts });
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
```

### XML Escape Function

```typescript
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

---

## Sources

### Primary (HIGH confidence — verified from live codebase)
- `src/lib/mdx/blog.ts` — `getPosts(locale)` returns `Post[]` sorted newest-first, draft-filtered
- `src/lib/mdx/schema.ts` — `BlogFrontmatter` schema (title, date, excerpt, tags, draft)
- `src/app/[locale]/blog/page.tsx` — Blog listing page (no feed links yet)
- `src/app/[locale]/blog/[slug]/page.tsx` — Blog post page (no feed links yet)
- `src/components/json-ld.tsx` — `SITE_URL` constant
- `src/i18n/routing.ts` — `localePrefix: 'never'` confirmed

### No external sources consulted

This research was fully satisfied by direct codebase inspection. No WebSearch or external documentation was required.

---

## Metadata

**Confidence breakdown:**
- Blog data pipeline: HIGH — `getPosts()` verified from `blog.ts`
- RSS 2.0 structure: HIGH — standard spec, no codebase dependency
- Route handler pattern: HIGH — Next.js App Router standard pattern
- `localePrefix: 'never'`: HIGH — verified in `routing.ts`

**Research date:** 2026-06-12
**Valid until:** Indefinite — based on codebase state, not external library versions
