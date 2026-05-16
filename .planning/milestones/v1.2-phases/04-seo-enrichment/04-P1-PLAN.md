---
phase: "04-seo-enrichment"
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/json-ld.tsx
  - src/app/[locale]/blog/[slug]/page.tsx
  - src/app/[locale]/projects/[slug]/page.tsx
autonomous: true
requirements:
  - SEO-01
  - SEO-02

must_haves:
  truths:
    - "Blog and project post headings (h2, h3) have visible vertical spacing that reads as a section break rather than inline text"
    - "Every blog post route includes a <script type=\"application/ld+json\"> block with Article schema"
    - "Every project post route includes a <script type=\"application/ld+json\"> block with WebPage schema"
    - "Lighthouse SEO score remains ≥ 95 and pnpm build exits 0"
  artifacts:
    - path: "src/components/json-ld.tsx"
      provides: "Shared RSC that serializes any schema object into a <script type=\"application/ld+json\"> tag"
      exports: ["default JsonLd"]
    - path: "src/app/[locale]/blog/[slug]/page.tsx"
      provides: "Blog post page with prose heading overrides and JsonLd injection"
      contains: "prose-h2:mt-10 prose-headings:scroll-mt-20"
    - path: "src/app/[locale]/projects/[slug]/page.tsx"
      provides: "Project post page with prose heading overrides and JsonLd injection"
      contains: "prose-h2:mt-10 prose-headings:scroll-mt-20"
  key_links:
    - from: "src/app/[locale]/blog/[slug]/page.tsx"
      to: "src/components/json-ld.tsx"
      via: "import JsonLd from '@/components/json-ld'"
      pattern: "JsonLd schema=\\{\\{"
    - from: "src/app/[locale]/projects/[slug]/page.tsx"
      to: "src/components/json-ld.tsx"
      via: "import JsonLd from '@/components/json-ld'"
      pattern: "JsonLd schema=\\{\\{"
    - from: "src/components/json-ld.tsx"
      to: "src/lib/seo.ts"
      via: "SITE_URL re-exported or inline import"
      pattern: "SITE_URL"
---

<objective>
Deliver both SEO Phase 4 improvements: (1) add inline Tailwind prose-heading overrides to both post pages for visual hierarchy, and (2) create a shared JsonLd server component and inject Article/WebPage structured data into blog and project post pages.

Purpose: Search engines and AI crawlers can parse post metadata; headings are visually distinct for readers and semantically structured for crawlers.
Output: src/components/json-ld.tsx (new); blog/page.tsx and projects/page.tsx updated (prose classes + JsonLd injection).
</objective>

<execution_context>
@/Users/luizpansarini/.claude/get-shit-done/workflows/execute-plan.md
@/Users/luizpansarini/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-seo-enrichment/04-CONTEXT.md

<interfaces>
<!-- Key types and exports the executor needs — extracted from codebase. -->

From src/lib/seo.ts:
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pansarinitech.vercel.app'
  export function buildMetadata(input: BuildMetadataInput): Metadata
  (SITE_URL is not exported; JsonLd must re-declare it or be passed the value from the page)

From src/lib/mdx/schema.ts:
  export type Post = BlogFrontmatter & { slug: string; readingTime: { minutes: number } }
  export type PostWithContent = Post & { content: ReactElement; rawBody: string }
  export type Project = ProjectFrontmatter & { slug: string; readingTime: { minutes: number } }
  export type ProjectWithContent = Project & { content: ReactElement; rawBody: string }

  BlogFrontmatter fields: title, date (YYYY-MM-DD), excerpt, tags[], draft
  ProjectFrontmatter fields: title, role, year (number), stack[], blurb, heroImage, tags[], featured, order

Blog page (line 94):
  &lt;div className="prose prose-neutral mt-8 max-w-none dark:prose-invert"&gt;{post.content}&lt;/div&gt;

Project page (line 50):
  &lt;div className="prose prose-neutral mx-auto max-w-3xl px-4 py-8 dark:prose-invert"&gt;{project.content}&lt;/div&gt;

Blog page article wrapper (line 66):
  &lt;article className="mx-auto max-w-5xl px-4 py-12 lg:grid lg:grid-cols-[1fr_240px] lg:gap-10"&gt;

Project page article wrapper (line 48):
  &lt;article&gt;

OG image routes (Next.js serves at /{locale}/blog/{slug}/opengraph-image and /{locale}/projects/{slug}/opengraph-image)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create src/components/json-ld.tsx shared server component</name>
  <files>src/components/json-ld.tsx</files>

  <read_first>
    - src/lib/seo.ts — SITE_URL constant (not exported; note the exact declaration to replicate)
    - src/lib/mdx/schema.ts — BlogFrontmatter and ProjectFrontmatter type shapes
    - src/components/blog/toc-sidebar.tsx — RSC-only pattern (no "use client", no hooks, pure JSX return)
  </read_first>

  <action>
Create src/components/json-ld.tsx as an RSC (no "use client" directive). The component accepts a single prop schema: Record&lt;string, unknown&gt; and renders &lt;script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /&gt;. Export it as default.

Also export a SITE_URL constant from this file (copy the same declaration from seo.ts: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pansarinitech.vercel.app') so page files can import it alongside JsonLd without a separate import — OR import SITE_URL from a shared location if seo.ts exports it. Since seo.ts does NOT export SITE_URL currently, either: (a) add export to seo.ts and import from there in json-ld.tsx, or (b) declare SITE_URL inline in json-ld.tsx. Prefer option (a): add export const SITE_URL to seo.ts (one line change) then import in json-ld.tsx — this keeps the single source of truth clean.

Also export a helper const AUTHOR_PERSON = { "@type": "Person", "name": "Luiz Pansarini" } — both Article and WebPage schemas use it for author and publisher.

The component interface:
  - Props: { schema: Record&lt;string, unknown&gt; }
  - No runtime behavior, no state, no event handlers
  - Suppress ESLint react/no-danger if project has that rule (use eslint-disable-next-line or the dangerouslySetInnerHTML is idiomatic here)

Per D-04 and D-05.
  </action>

  <verify>
    <automated>grep -n "application/ld+json" /Users/luizpansarini/Documents/Projetos/Pessoal/pansarinitech/src/components/json-ld.tsx</automated>
  </verify>

  <acceptance_criteria>
    - src/components/json-ld.tsx exists with export default function JsonLd
    - Component renders &lt;script type="application/ld+json"&gt; with dangerouslySetInnerHTML
    - AUTHOR_PERSON constant exported from the file (or from seo.ts — either is fine)
    - SITE_URL is importable from seo.ts (either newly exported or inline in json-ld.tsx)
    - No "use client" directive present
    - pnpm build exits 0 (TypeScript compiles cleanly)
  </acceptance_criteria>

  <done>json-ld.tsx exists, exports JsonLd default, renders the ld+json script tag, AUTHOR_PERSON and SITE_URL are available for page-level imports.</done>
</task>

<task type="auto">
  <name>Task 2: Wire prose heading overrides and JsonLd into both post pages</name>
  <files>
    src/app/[locale]/blog/[slug]/page.tsx,
    src/app/[locale]/projects/[slug]/page.tsx,
    src/lib/seo.ts
  </files>

  <read_first>
    - src/app/[locale]/blog/[slug]/page.tsx — full file; prose wrapper at line 94; article element at line 66
    - src/app/[locale]/projects/[slug]/page.tsx — full file; prose wrapper at line 50; article element at line 48
    - src/lib/seo.ts — current SITE_URL declaration (to add export if Task 1 chose option a)
    - src/components/json-ld.tsx — the component created in Task 1
    - src/app/[locale]/blog/[slug]/opengraph-image.tsx — confirm OG image is served at /{locale}/blog/{slug}/opengraph-image
  </read_first>

  <action>
Make three coordinated changes:

CHANGE 1 — seo.ts (only if Task 1 chose option a): Change `const SITE_URL` to `export const SITE_URL` on line 16. No other changes to seo.ts.

CHANGE 2 — blog/[slug]/page.tsx:
  a) Add import: import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld' (adjust to match what Task 1 exported).
  b) Heading overrides (per D-01, D-02, D-03): Change the prose wrapper div className from:
       "prose prose-neutral mt-8 max-w-none dark:prose-invert"
     to:
       "prose prose-neutral mt-8 max-w-none dark:prose-invert prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20"
  c) JsonLd injection (per D-05, D-06, D-07): Add &lt;JsonLd schema={{...}} /&gt; as the first child of the &lt;article&gt; element (before the &lt;div className="min-w-0"&gt;).
     Article schema object:
       @context: "https://schema.org"
       @type: "Article"
       headline: post.title
       description: post.excerpt
       author: AUTHOR_PERSON
       publisher: AUTHOR_PERSON
       datePublished: post.date
       url: `${SITE_URL}/blog/${post.slug}`
       inLanguage: locale === 'pt' ? 'pt-BR' : 'en'
       keywords: post.tags.join(', ')
       image: `${SITE_URL}/${locale}/blog/${post.slug}/opengraph-image`
       wordCount: Math.round(post.readingTime.minutes * 200)

CHANGE 3 — projects/[slug]/page.tsx:
  a) Add import: import JsonLd, { AUTHOR_PERSON, SITE_URL } from '@/components/json-ld'.
  b) Heading overrides (per D-01, D-02, D-03): Change the prose wrapper div className from:
       "prose prose-neutral mx-auto max-w-3xl px-4 py-8 dark:prose-invert"
     to:
       "prose prose-neutral mx-auto max-w-3xl px-4 py-8 dark:prose-invert prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20"
  c) JsonLd injection (per D-05, D-08, D-09, D-10): Add &lt;JsonLd schema={{...}} /&gt; as the first child of the &lt;article&gt; element (before &lt;CaseStudyHero&gt;).
     WebPage schema object:
       @context: "https://schema.org"
       @type: "WebPage"
       name: project.title
       description: project.blurb
       author: AUTHOR_PERSON
       publisher: AUTHOR_PERSON
       datePublished: `${project.year}-01-01`
       url: `${SITE_URL}/projects/${slug}`
       inLanguage: locale === 'pt' ? 'pt-BR' : 'en'
       keywords: project.stack.join(', ')
       image: project.heroImage
       wordCount: Math.round(project.readingTime.minutes * 200)

Note: project.heroImage is already a URL (from ProjectFrontmatter). No OG route needed for image field on WebPage schema.
  </action>

  <verify>
    <automated>cd /Users/luizpansarini/Documents/Projetos/Pessoal/pansarinitech && pnpm build 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - grep for "prose-h2:mt-10" in blog/[slug]/page.tsx returns 1 match
    - grep for "prose-h2:mt-10" in projects/[slug]/page.tsx returns 1 match
    - grep for "prose-headings:scroll-mt-20" in both page files returns 1 match each
    - grep for "JsonLd" in blog/[slug]/page.tsx returns at least 2 lines (import + usage)
    - grep for "JsonLd" in projects/[slug]/page.tsx returns at least 2 lines (import + usage)
    - grep for "application/ld+json" in pnpm build output HTML (or: pnpm build exits 0 and no TS errors)
    - pnpm build exits 0 with no TypeScript or module-resolution errors
    - Blog post rendered HTML contains application/ld+json script with "@type":"Article"
    - Project post rendered HTML contains application/ld+json script with "@type":"WebPage"
  </acceptance_criteria>

  <done>Both page files have prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20 on their prose wrappers, and both render a valid JSON-LD script block whose @type matches the schema decision (Article for blog, WebPage for projects).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| MDX frontmatter → JSON-LD output | Post title, excerpt, tags, and blurb flow from author-controlled MDX files into serialized JSON embedded in HTML |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-01 | Injection | json-ld.tsx dangerouslySetInnerHTML | accept | Content originates from Zod-validated frontmatter (title, excerpt, tags) authored by the site owner. No user-supplied input reaches the JSON-LD script. Zod schema enforces string types before values reach this component. |
| T-04-02 | Information Disclosure | wordCount calculation | accept | wordCount is approximate (minutes * 200 wpm) and non-sensitive. No PII in schema fields. |
| T-04-03 | Spoofing | heroImage URL in WebPage schema | accept | heroImage is a string validated by Zod (min 1 char); it's an internal asset path. No SSRF risk — URL is serialized into JSON, not fetched server-side in this component. |
</threat_model>

<verification>
Run after both tasks complete:

1. pnpm build — must exit 0, no TypeScript errors
2. pnpm test -- --run — 200 tests must still pass (no regressions from prose class changes)
3. Manual spot-check: curl or view-source on a blog post route — look for &lt;script type="application/ld+json"&gt; containing "@type":"Article"
4. Manual spot-check: view-source on a project post route — look for "@type":"WebPage"
5. Google's Rich Results Test (https://search.google.com/test/rich-results) — paste any post URL after deploy; no structured data errors expected
</verification>

<success_criteria>
- pnpm build exits 0 after all changes
- Both post page types render a valid &lt;script type="application/ld+json"&gt; block
- Blog posts use @type Article with headline, description, author, datePublished, url, inLanguage, keywords, image, wordCount populated from frontmatter
- Project posts use @type WebPage with name, description, author, datePublished, url, inLanguage, keywords, image, wordCount populated from frontmatter
- Prose wrapper divs in both page files include prose-h2:mt-10 prose-h3:mt-8 prose-headings:scroll-mt-20
- SEO-01 and SEO-02 requirements are fully implemented
</success_criteria>

<output>
After completion, create .planning/phases/04-seo-enrichment/04-P1-SUMMARY.md following the summary template at @/Users/luizpansarini/.claude/get-shit-done/templates/summary.md
</output>
