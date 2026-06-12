# Phase 14: New Blog Post via Pipeline — Research

**Researched:** 2026-06-12
**Domain:** OpenAI blog post generation pipeline, MDX content authoring
**Confidence:** HIGH — all findings verified directly from the live codebase

---

## Summary

Phase 14 generates a new bilingual blog post via the existing OpenAI gpt-4o automated pipeline. The pipeline is fully built and tested — it's called by `.github/workflows/generate-post.yml` and uses `scripts/generate-post-openai.mjs` to call the OpenAI API.

The pipeline:
1. Reads a style reference from an existing post (`content/blog/building-this-portfolio.en.mdx`)
2. Reads project context from `content/projects-context/` (optional)
3. Calls OpenAI API with a prompt template (`scripts/generate-post-prompt.md`)
4. Parses the response for file blocks (`===FILE: ... ===ENDFILE`)
5. Writes the MDX files to `content/blog/{slug}.{en,pt}.mdx`
6. Updates pipeline state in `content/blog/.pipeline-state.json`

**Primary recommendation:** Run the pipeline with a new topic. The pipeline state shows the topic sequence: `nextjs-react-frontend`, `software-engineering-career`, `ai-in-development`, `personal-projects-open-source`. The first two have been used (posts exist). The next topic should be `ai-in-development` or `personal-projects-open-source`.

**Key files:**
- `scripts/generate-post-openai.mjs` — OpenAI API caller
- `scripts/generate-post-prompt.md` — Prompt template
- `content/blog/.pipeline-state.json` — Pipeline state (run_count, last_topic)
- `content/blog/building-this-portfolio.en.mdx` — Style reference

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Blog post generation | External API (OpenAI) | — | gpt-4o via `generate-post-openai.mjs` |
| MDX content files | Filesystem (static) | — | `content/blog/` directory |
| Frontmatter parsing + Zod validation | API/Backend (RSC build) | — | `factory.ts` runs at build time |
| Route resolution | Frontend Server (Next.js App Router) | — | `[locale]/blog/[slug]/page.tsx` SSG |
| RSS feed inclusion | Frontend Server (RSC) | — | `getPosts()` auto-discovers new posts |

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASE-27 | New blog post exists as `content/blog/{slug}.{en,pt}.mdx` | Pipeline generates both files atomically |
| CASE-28 | Post is discoverable at `/en/blog/{slug}` and `/pt/blog/{slug}` | Automatic via MDX pipeline — `generateStaticParams` enumerates all slugs |

---

## Standard Stack

### Core (all verified from codebase — no new packages needed)

| File / Library | Role in This Phase | Notes |
|----------------|-------------------|-------|
| `scripts/generate-post-openai.mjs` | Pipeline runner | Calls OpenAI API, parses response, writes files |
| `scripts/generate-post-prompt.md` | Prompt template | Substitutes `${SLUG}`, `${TOPIC}`, `${TODAY}`, `${PROJECTS_CONTEXT}`, `${STYLE_REF}` |
| `content/blog/.pipeline-state.json` | Pipeline state | Tracks `last_topic`, `run_count`, `topic_sequence` |
| `content/blog/building-this-portfolio.en.mdx` | Style reference | Used by pipeline to calibrate tone/structure |
| `src/lib/mdx/blog.ts` — `getPosts` | Post data source | Auto-discovers new posts via MDX pipeline |
| `src/lib/mdx/schema.ts` — `BlogFrontmatter` | Zod validation | Required fields: title, date, excerpt, tags, draft |

[VERIFIED: codebase direct inspection]

### No New Packages Required

The full blog post generation pipeline is pre-built. Phase 14 is 100% pipeline execution.

---

## Architecture Patterns

### Pipeline Execution

```bash
# Run the pipeline with environment variables
SLUG="new-post-slug" \
TOPIC="ai-in-development" \
TODAY="2026-06-12" \
OPENAI_API_KEY="$OPENAI_API_KEY" \
node scripts/generate-post-openai.mjs
```

The pipeline:
1. Reads `content/blog/building-this-portfolio.en.mdx` as style reference
2. Reads `content/projects-context/` if it exists
3. Calls OpenAI API with gpt-4o (max_tokens: 8000, 90s timeout)
4. Parses response for `===FILE: content/blog/{slug}.{en,pt}.mdx ===ENDFILE` blocks
5. Writes files to `content/blog/`
6. Updates `content/blog/.pipeline-state.json`

### Pipeline State

```json
{
  "last_topic": "software-engineering-career",
  "run_count": 2,
  "last_run_date": "2026-05-16",
  "topic_sequence": [
    "nextjs-react-frontend",
    "software-engineering-career",
    "ai-in-development",
    "personal-projects-open-source"
  ]
}
```

The `topic_sequence` defines the rotation of topics. After `software-engineering-career` (run_count: 2), the next topic should be `ai-in-development`.

### MDX Content Requirements

The pipeline prompt enforces strict content rules:
- **Length:** 800–1200 words per locale
- **Headings:** H2 only (H1 is from frontmatter title)
- **Voice:** Technical, direct, low-fluff, first-person past tense
- **Required components:** At least one `<Callout>`, one `<CodeFilename>`, one `<InlineBadge>`
- **Forbidden:** `{expression}` JS, `import`/`export`, unknown JSX tags
- **Date format:** Exactly `"YYYY-MM-DD"` (10 characters)
- **Excerpt:** 40–280 characters

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blog post generation | Manual MDX authoring | Existing `generate-post-openai.mjs` pipeline | Pipeline handles bilingual generation, style matching, and pipeline state automatically |
| Style calibration | Manual tone matching | Pipeline reads existing post as style reference | Ensures consistent voice across all posts |
| Pipeline state | Manual run_count tracking | Pipeline updates `.pipeline-state.json` automatically | Guarantees state integrity regardless of model output |

---

## Common Pitfalls

### Pitfall 1: OpenAI API Key Not Set

**What goes wrong:** Running the pipeline without `OPENAI_API_KEY` set causes immediate failure.

**How to avoid:** Ensure `OPENAI_API_KEY` is set before running. The pipeline checks for it and exits with error if missing.

### Pitfall 2: Style Reference File Missing

**What goes wrong:** If `content/blog/building-this-portfolio.en.mdx` doesn't exist, the pipeline fails.

**How to avoid:** This file is the canonical style reference and exists in the codebase. It's required for the pipeline to run.

### Pitfall 3: Response Truncation

**What goes wrong:** If the OpenAI response is truncated (`finish_reason: length`), the pipeline fails.

**How to avoid:** The pipeline has a 90s timeout and checks for truncation. If it happens, increase `max_tokens` or shorten the prompt.

---

## Code Examples

### Pipeline Execution

```bash
# Run the pipeline
SLUG="ai-in-development" \
TOPIC="ai-in-development" \
TODAY="2026-06-12" \
OPENAI_API_KEY="$OPENAI_API_KEY" \
node scripts/generate-post-openai.mjs
```

### Pipeline State Update

```json
// After running the pipeline, .pipeline-state.json is updated:
{
  "last_topic": "ai-in-development",
  "run_count": 3,
  "last_run_date": "2026-06-12",
  "topic_sequence": [
    "nextjs-react-frontend",
    "software-engineering-career",
    "ai-in-development",
    "personal-projects-open-source"
  ]
}
```

---

## Sources

### Primary (HIGH confidence — verified from live codebase)
- `scripts/generate-post-openai.mjs` — full pipeline implementation (OpenAI API caller, response parser, file writer)
- `scripts/generate-post-prompt.md` — prompt template with all content rules
- `content/blog/.pipeline-state.json` — current pipeline state
- `content/blog/building-this-portfolio.en.mdx` — style reference
- `src/lib/mdx/blog.ts` — `getPosts()` auto-discovers new posts
- `src/lib/mdx/schema.ts` — `BlogFrontmatter` Zod schema

### No external sources consulted

This research was fully satisfied by direct codebase inspection. No WebSearch or external documentation was required.

---

## Metadata

**Confidence breakdown:**
- Pipeline implementation: HIGH — `generate-post-openai.mjs` verified from live codebase
- Prompt template: HIGH — `generate-post-prompt.md` verified from live codebase
- Pipeline state: HIGH — `.pipeline-state.json` verified from live codebase
- Style reference: HIGH — `building-this-portfolio.en.mdx` verified from live codebase

**Research date:** 2026-06-12
**Valid until:** Indefinite — based on codebase state, not external library versions
