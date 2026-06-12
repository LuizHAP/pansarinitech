# Phase 12: RSS Feed for Blog — Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 3 new files, 2 modified files
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/[locale]/blog/feed/route.ts` (new) | route handler | request-response | self — new RSS generator | exact |
| `src/app/[locale]/blog/page.tsx` (modify) | page | request-response | self — add feed link tags | exact |
| `src/app/[locale]/blog/[slug]/page.tsx` (modify) | page | request-response | self — add feed link tags | exact |

---

## Pattern Assignments

### `src/app/[locale]/blog/feed/route.ts` (new — RSS route handler)

**Analog:** None — this is a new file.

**Required structure:**

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
  // ... RSS 2.0 XML generation
}

function escapeXml(str: string): string {
  // ... XML escaping
}
```

**Key constraints:**
- Must use `NextResponse` with `Content-Type: application/rss+xml; charset=utf-8`
- Must call `getPosts(locale)` — this automatically filters drafts in production
- Must limit to 20 posts (RSS 2.0 convention)
- Must escape all XML special characters in title/excerpt
- Must use `SITE_URL` from `@/components/json-ld` for absolute URLs

---

### `src/app/[locale]/blog/page.tsx` (page, modify)

**Analog:** Self — add `<link>` tags to the page.

**Current structure:** The page is a default export function component. No `<head>` or `<Metadata>` for feed links.

**Addition:** Add feed link tags inside the page's `<head>` via `generateMetadata` or by adding a `<link>` element in the JSX.

**Recommended approach:** Add `<link>` tags in the JSX body (not in `generateMetadata`) since feed links are not metadata but navigation aids:

```tsx
// Add near the top of the component, before the main content:
<>
  <link rel="alternate" type="application/rss+xml" title="Blog (EN)" href="/feed.xml" />
  <link rel="alternate" type="application/rss+xml" title="Blog (PT)" href="/feed.pt.xml" />
  {/* existing content */}
</>
```

**Note:** Since the site uses `localePrefix: 'never'`, the feed URLs are `/feed.xml` and `/feed.pt.xml` at the root level, not under `/[locale]/blog/`.

---

### `src/app/[locale]/blog/[slug]/page.tsx` (page, modify)

**Analog:** Self — same feed link tags as the listing page.

**Addition:** Same `<link>` tags as the blog listing page, added to the post page.

---

## Shared Patterns

### RSS 2.0 XML Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Luiz Pansarini — Blog</title>
    <link>{SITE_URL}/blog</link>
    <description>Principal Software Engineer — technical writing</description>
    <language>{locale === 'pt' ? 'pt-BR' : 'en'}</language>
    <atom:link href="{feedUrl}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>{new Date(posts[0].date).toUTCString()}</lastBuildDate>
    {items}
  </channel>
</rss>
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

## No Analog Found

The RSS route handler is a new pattern — no existing analog in the codebase. All other files have direct analogs.

---

## Metadata

**Analog search scope:** `src/app/[locale]/blog/`, `src/lib/mdx/blog.ts`, `src/components/json-ld.tsx`
**Files read:** 5 source files
**Pattern extraction date:** 2026-06-12

**Critical ordering constraint:** The route handler must be created BEFORE the feed link tags are added to the pages. The link tags reference `/feed.xml` and `/feed.pt.xml` — if the route doesn't exist yet, the links will 404.
