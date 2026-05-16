---
phase: 04-seo-enrichment
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/components/json-ld.tsx
  - src/lib/seo.ts
  - src/app/[locale]/blog/[slug]/page.tsx
  - src/app/[locale]/projects/[slug]/page.tsx
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files implementing the SEO enrichment phase were reviewed: the shared `JsonLd` component, the `buildMetadata` factory, and the two dynamic route pages for blog posts and project case studies. The core metadata pipeline is well-structured, but three correctness issues and four quality/robustness gaps were found. The most pressing issues are a cross-site scripting vector in the JSON-LD serializer, a missing locale validation guard that allows invalid locales to silently proceed in the projects page, and a relative-path `heroImage` being emitted verbatim into structured data consumed by Google's indexer.

---

## Critical Issues

### CR-01: JSON-LD serializer does not escape `</script>` sequences — XSS in structured data

**File:** `src/components/json-ld.tsx:28`

**Issue:** `JSON.stringify(schema)` does NOT escape the sequence `</script>`. A browser's HTML parser terminates the current `<script>` block the moment it sees `</`, regardless of whether it is inside a JSON string literal. If any frontmatter field (title, blurb, excerpt, tag, or `heroImage`) ever contains `</script>`, the remainder of the JSON-LD becomes raw HTML in the page, enabling script injection. `JSON.stringify` is not HTML-safe by default — this is a well-known browser parsing quirk documented by OWASP.

The biome suppression comment claims safety because "content comes from Zod-validated frontmatter." Zod validates shape and length, not the absence of HTML-special sequences. A title such as `"My post </script><script>alert(1)</script>"` passes all Zod constraints and produces injectable output today.

**Fix:** Replace the raw `JSON.stringify` call with an HTML-safe serializer that escapes `</`, `<!--`, and `<!` inside string values:

```tsx
// Escapes </script> and <!-- inside JSON string values so the browser
// HTML parser cannot terminate the <script> block prematurely.
function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires dangerouslySetInnerHTML; < escaping prevents </script> injection
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
```

`<` is valid JSON — parsers treat it identically to `<` — and is the escape strategy used by Rails, Django, and Google's own structured-data docs.

---

### CR-02: `CaseStudyPage` does not validate `locale` before calling `setRequestLocale`

**File:** `src/app/[locale]/projects/[slug]/page.tsx:42-46`

**Issue:** `BlogPostPage` (line 56) guards against invalid locales with `if (!routing.locales.includes(locale)) notFound()` before calling `setRequestLocale`. `CaseStudyPage` omits this guard entirely. If the Next.js catch-all route is ever hit with an invalid locale segment (e.g. a path like `/fr/projects/foo`), `setRequestLocale` is called with an unsupported locale, which can throw or silently misconfigure the request context — and then `getProject` is called with an invalid locale, falling through to `notFound()` only because the project lookup fails, not because the locale is invalid. This is inconsistent defensive posture and can mask bugs when new locales are added.

**Fix:**

```tsx
export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale)) notFound(); // guard missing in current code
  setRequestLocale(locale);

  const project = await getProject(slug, locale);
  if (!project) notFound();
  // ...
}
```

Similarly, `generateMetadata` in this file (line 24-35) has no locale guard, whereas the blog equivalent (line 36) returns `{}` on invalid locale. Add `if (!routing.locales.includes(locale)) return {};` after destructuring params.

---

### CR-03: Project JSON-LD emits a relative `heroImage` path that is invalid structured data

**File:** `src/app/[locale]/projects/[slug]/page.tsx:62`

**Issue:** `image: project.heroImage` is taken verbatim from the MDX frontmatter. The current content files set `heroImage` to relative paths such as `"./magazine-luiza-superapp/images/hero.jpg"`. The `image` property of a `WebPage` schema must be an absolute URL; Google's Rich Results validator rejects relative paths and ignores the `image` field entirely. This silently produces invalid structured data on every project page.

**Fix:** Resolve `heroImage` to an absolute URL before embedding it. If `heroImage` is always a path under `SITE_URL`, prepend it; if it may be external, validate it is already absolute:

```tsx
const heroImageUrl = project.heroImage.startsWith('http')
  ? project.heroImage
  : `${SITE_URL}${project.heroImage.startsWith('/') ? '' : '/'}${project.heroImage}`;

// In JSON-LD:
image: heroImageUrl,
```

A better long-term fix is to enforce absolute URLs in the `ProjectFrontmatter` Zod schema with `z.string().url()`.

---

## Warnings

### WR-01: `wordCount` in JSON-LD is computed with the wrong WPM constant

**File:** `src/app/[locale]/blog/[slug]/page.tsx:81` and `src/app/[locale]/projects/[slug]/page.tsx:63`

**Issue:** Both pages reconstruct word count by multiplying `readingTime.minutes * 200`. However, `calculateReadingTime` in `src/lib/mdx/reading-time.ts` uses `WORDS_PER_MINUTE = 220` (and `Math.ceil`). Reversing with `* 200` consistently under-reports the word count in structured data. For a 1000-word article: actual 1000 words → ceiling(1000/220) = 5 minutes → `5 * 200 = 1000` (coincidental match at this input). For 700 words: ceiling(700/220) = 4 → `4 * 200 = 800` (over-report). For 221 words: ceiling(221/220) = 2 → `2 * 200 = 400` (over-report by 2×). The schema.org `wordCount` property is expected to be accurate; incorrect values mislead crawlers.

**Fix:** Either export `WORDS_PER_MINUTE` from `reading-time.ts` for use in the reverse calculation, or (better) add `wordCount` as a field on the return type of `calculateReadingTime`:

```ts
// reading-time.ts
export function calculateReadingTime(body: string): { minutes: number; wordCount: number } {
  const prose = body.replace(FENCED_CODE, ' ').replace(INLINE_CODE, ' ');
  const words = prose.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return { minutes, wordCount: words };
}

// blog/[slug]/page.tsx
wordCount: post.readingTime.wordCount,
```

---

### WR-02: `hreflang` alternates are documented in the comment but never emitted

**File:** `src/lib/seo.ts:74`

**Issue:** The module header (lines 6-7) explicitly promises "hreflang map (en + pt-BR + x-default)" as a core deliverable. The `alternates` object emitted at line 74 contains only `canonical` — no `languages` map. Without `hreflang` alternates, Google cannot determine which locale version of a page to serve to which audience, and duplicate-content signals accumulate across the bilingual pages. The CLAUDE.md doc cites `generateMetadata returning alternates.languages` as the preferred approach.

**Fix:** Add a `languages` map to `alternates`. Because `localePrefix: 'never'`, the canonical URL is the same for both locales. The alternate-language URL must include the locale cookie, which search engines cannot honor — the typical workaround is to use the path-based URL even when live traffic does not use it, or accept that hreflang requires locale-prefixed URLs. If the decision is to keep `localePrefix: 'never'`, the team must document this explicitly; if hreflang is desired, switch to `localePrefix: 'as-needed'` for crawlers or emit locale-qualified alternates:

```ts
// In buildMetadata, compute the other-locale path:
const otherLocale = locale === 'en' ? 'pt' : 'en';
// ...
alternates: {
  canonical: canonicalUrl,
  languages: {
    'en': `${SITE_URL}/en${path || '/'}`,
    'pt-BR': `${SITE_URL}/pt${path || '/'}`,
    'x-default': `${SITE_URL}${path || '/'}`,
  },
},
```

---

### WR-03: `publisher` on `WebPage` JSON-LD is not a valid schema.org property

**File:** `src/app/[locale]/projects/[slug]/page.tsx:57`

**Issue:** The project page emits a `WebPage` schema with a `publisher` property. `schema.org/WebPage` does not define a `publisher` property — it is defined on `CreativeWork` subtypes such as `Article`, `Book`, and `NewsArticle`. Validators will flag this as an unrecognized property and ignore it. The correct property for `WebPage` authorship is `author` (which is already present) or, if the intent is publishing credit, the schema type should be changed to `Article` (consistent with the OG `type: 'article'` already set on line 32).

**Fix:** Either remove `publisher` from the `WebPage` schema, or change the `@type` to `TechArticle` (a `schema.org/Article` subtype appropriate for technical case studies, and consistent with the `type: 'article'` set in `generateMetadata`):

```tsx
'@type': 'TechArticle',
// publisher is then valid
```

---

### WR-04: `SITE_URL` is evaluated at module initialization time — NEXT_PUBLIC env var may not be available in all build contexts

**File:** `src/lib/seo.ts:16`

**Issue:** `NEXT_PUBLIC_SITE_URL` is read and frozen into the `SITE_URL` constant at module load time. In Next.js App Router with Turbopack (the default in Next 16), `NEXT_PUBLIC_*` variables are inlined at build time — this is by design. However, the `.env` file checked in the repo does not contain `NEXT_PUBLIC_SITE_URL` (verified), so the fallback `'https://pansarinitech.vercel.app'` is always used, including locally. If the custom domain is later added but `NEXT_PUBLIC_SITE_URL` is never set in Vercel's environment, structured data and canonical URLs will silently point to the wrong origin on production. No validation or startup warning exists.

**Fix:** Add a build-time assertion (safe for server-only code):

```ts
// Fail the build early if SITE_URL is the fallback on a non-dev build
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    '[seo.ts] NEXT_PUBLIC_SITE_URL is not set — canonical URLs will use fallback origin. ' +
    'Set this env var in Vercel for the production deployment.'
  );
}
```

---

## Info

### IN-01: `buildHomeMetadata` passes an empty string `path: ''` which generates a canonical URL without a trailing slash

**File:** `src/lib/seo.ts:98-102`

**Issue:** `buildHomeMetadata` passes `path: ''`, and `buildMetadata` resolves this to `${SITE_URL}/` (line 46). That is correct. However, all other call sites pass paths such as `"/blog/foo"` (with a leading slash). If a caller accidentally passes `path: 'blog/foo'` (no leading slash), the canonical URL will be `https://example.com/blog/foo` (no separator), producing an invalid URL. The function has no guard against this.

**Fix:** Normalize the path in `buildMetadata`:

```ts
const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/';
const canonicalUrl = `${SITE_URL}${normalizedPath}`;
```

---

### IN-02: `AUTHOR_PERSON` lacks `url` and `sameAs` fields, limiting Knowledge Graph signal

**File:** `src/components/json-ld.tsx:14-17`

**Issue:** The `Person` schema used as both `author` and `publisher` across all structured data contains only `name`. Google's documentation for author markup in Articles recommends including at minimum a `url` pointing to an authoritative page about the author (e.g. the homepage or a `/about` page). Without `url` or `sameAs` (LinkedIn, GitHub), Google cannot link the structured data entity to Luiz's Knowledge Graph card. This is an SEO opportunity, not a correctness error.

**Fix:**

```ts
export const AUTHOR_PERSON = {
  '@type': 'Person',
  name: 'Luiz Pansarini',
  url: `${SITE_URL}/`,
  sameAs: [
    'https://www.linkedin.com/in/luizpansarini',
    'https://github.com/luizpansarini',
  ],
} as const;
```

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
