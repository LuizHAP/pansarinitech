# Phase 14: New Blog Post via Pipeline — Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 2 new content files, 1 modified state file
**Analogs found:** 2 / 2

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `content/blog/{slug}.en.mdx` (new) | content (MDX) | static/read | `content/blog/building-this-portfolio.en.mdx` | exact |
| `content/blog/{slug}.pt.mdx` (new) | content (MDX) | static/read | `content/blog/building-this-portfolio.pt.mdx` | exact |
| `content/blog/.pipeline-state.json` (modify) | config/pipeline | static/read | self — update run_count | exact |

---

## Pattern Assignments

### `content/blog/{slug}.en.mdx` (content, static)

**Analog:** `content/blog/building-this-portfolio.en.mdx`

**Frontmatter pattern** (from existing post):

```yaml
---
title: "Building this portfolio: a Principal Engineer's technical deep dive"
date: "2026-05-16"
excerpt: "A deep dive into the technical decisions behind my bilingual portfolio — Next.js 16, Shadcn/UI, Shiki, and the Jedi/Sith theme."
tags:
  - nextjs
  - portfolio
  - react
draft: false
---
```

**Apply for new post — substitute these values:**

```yaml
---
title: "<title in English, topic-specific>"
date: "2026-06-12"
excerpt: "<40-280 char excerpt, topic-specific>"
tags:
  - <tag1>
  - <tag2>
draft: false
---
```

**MDX body structure** (from existing post):

```mdx
## Introduction

[Context paragraph — why this topic matters]

## The Problem

[Technical challenge description]

## The Solution

[Technical approach with MDX components]

<Callout type="info">
Key insight or caveat.
</Callout>

<CodeFilename filename="src/app/example.tsx">
```tsx
// Example code
```
</CodeFilename>

<InlineBadge variant="primary">stable</InlineBadge>

## Results

<Stat number="97%" label="reduction in cold-start latency" />

[Outcome narrative]

## Lessons Learned

[Reflection on decisions made]
```

**Key rules for MDX body:**
- No `{expression}` JS interpolation (blocked by `next-mdx-remote@^6` `blockJS: true` default)
- No `import`/`export` inside the MDX body
- JSX components (`<Callout>`, `<Stat>`, `<CodeFilename>`, `<InlineBadge>`) work correctly
- H2 headings only (H1 is from frontmatter title)
- 800–1200 words per locale

---

### `content/blog/{slug}.pt.mdx` (content, static)

**Analog:** `content/blog/building-this-portfolio.pt.mdx`

**Frontmatter pattern** (from existing post):

```yaml
---
title: "Construindo este portfólio: um mergulho técnico de um Engenheiro Principal"
date: "2026-05-16"
excerpt: "Um mergulho nas decisões técnicas por trás do meu portfólio bilíngue — Next.js 16, Shadcn/UI, Shiki e o tema Jedi/Sith."
tags:
  - nextjs
  - portfolio
  - react
draft: false
---
```

**Apply for new post — substitute these values:**

```yaml
---
title: "<title in PT-BR, topic-specific>"
date: "2026-06-12"
excerpt: "<40-280 char excerpt in PT-BR, topic-specific>"
tags:
  - <tag1>
  - <tag2>
draft: false
---
```

**PT section headings** (from existing post):

```
## Introdução
## O Problema
## A Solução
## Resultados
## Lições Aprendidas
```

**Bilingual parity enforcement:** The pipeline generates both files atomically. Both must pass Zod validation at build time.

---

### `content/blog/.pipeline-state.json` (pipeline config, modify)

**Analog:** Self — update run_count and last_topic.

**Current state:**

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

**Updated state (after running pipeline):**

```json
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

The pipeline updates this automatically — no manual editing needed.

---

## Shared Patterns

### Pipeline Execution

```bash
# Run the pipeline
SLUG="ai-in-development" \
TOPIC="ai-in-development" \
TODAY="2026-06-12" \
OPENAI_API_KEY="$OPENAI_API_KEY" \
node scripts/generate-post-openai.mjs
```

### MDX Component Usage

```mdx
{/* Callout — highlight an architectural insight */}
<Callout type="info">
Key insight text here.
</Callout>

{/* Stat — impact figure */}
<Stat number="97%" label="reduction in cold-start latency" />

{/* CodeFilename — labeled code block */}
<CodeFilename filename="src/app/example.tsx">
```tsx
export default function Page() {
  return <main>Hello</main>;
}
```
</CodeFilename>

{/* InlineBadge — inline tech reference */}
This API is <InlineBadge variant="primary">stable</InlineBadge> in Next.js 16.
```

---

## No Analog Found

The pipeline execution pattern is unique to this project. All content files have direct analogs.

---

## Metadata

**Analog search scope:** `content/blog/`, `scripts/`
**Files read:** 4 source files
**Pattern extraction date:** 2026-06-12

**Critical ordering constraint:** The pipeline must be run with a valid `OPENAI_API_KEY`. The pipeline state file is updated automatically by the pipeline — no manual editing needed.
