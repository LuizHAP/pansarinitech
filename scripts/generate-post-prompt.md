# Blog Post Generation Prompt

This file is read by `.github/workflows/generate-post.yml` via:

```bash
PROMPT=$(cat scripts/generate-post-prompt.md)
```

The workflow substitutes `${SLUG}`, `${TOPIC}`, `${TODAY}`, `${PROJECTS_CONTEXT}`, and `${STYLE_REF}` before passing to `claude -p`.

---

## ROLE

You are writing a bilingual technical blog post for Luiz Pansarini's portfolio at pansarini.tech. Luiz is a Principal Software Engineer with experience building at BR scale and shipping to the US market. He writes with a direct, technical, low-fluff voice in first person.

---

## TASK

Write TWO files using the Write tool:

1. `content/blog/${SLUG}.en.mdx` — English version
2. `content/blog/${SLUG}.pt.mdx` — Brazilian Portuguese version (not a translation — write naturally in idiomatic PT-BR, rethink phrasing for each section)

Also update `content/blog/.pipeline-state.json` using the Edit or Write tool with these exact values:

```json
{
  "last_topic": "${TOPIC}",
  "run_count": <increment the existing run_count value by 1>,
  "last_run_date": "${TODAY}",
  "topic_sequence": ["nextjs-react-frontend", "software-engineering-career", "ai-in-development", "personal-projects-open-source"]
}
```

Read the current `.pipeline-state.json` first to get the current `run_count` before incrementing.

---

## TOPIC

Topic area: **${TOPIC}**. Write substantive, technically grounded content relevant to this area. Draw from real engineering experience — decisions made, tradeoffs weighed, things that did not work the first time.

---

## FRONTMATTER

Both files must open with exactly this frontmatter shape (no extra fields, no missing fields):

```
---
title: "<title in the post's language>"
date: "${TODAY}"
excerpt: "<YOUR EXCERPT: count characters, must be 40–280>"
tags:
  - <tag1>
  - <tag2>
draft: false
---
```

**Critical constraints:**

- `date` must be exactly `"${TODAY}"` — a 10-character string in YYYY-MM-DD format. Do not write `"May 13, 2026"` or `"2026-05-13T09:00:00Z"` or any other format. Use the exact value provided.
- `excerpt` MUST be between 40 and 280 characters inclusive. Count the characters explicitly before writing. Do not write fewer than 40 characters. A minimum viable excerpt: `"A deep dive into ${TOPIC} from a Principal Engineer building at BR scale."` (that is 73 characters — aim for similar or longer). If your draft excerpt is under 40 characters, expand it before writing the file.
- `draft: false` — posts are published immediately when the PR is merged. Set to `true` during PR review if you want to merge without publishing yet.
- `title` must be non-empty and in the post's language (English for `.en.mdx`, Portuguese for `.pt.mdx`).
- `title` must be non-empty and in the post's language (English for `.en.mdx`, Portuguese for `.pt.mdx`).
- `tags` are optional but encouraged; if present must be a YAML string array.

---

## AVAILABLE MDX COMPONENTS

The following JSX components are registered in `mdxComponents` and are available in all MDX bodies (blog posts and project case studies). Use **only** these components — no other component tags will render. Because `next-mdx-remote@6` has `blockJS: true` by default, `import` statements inside MDX bodies are silently stripped — **you do not need to import these components**; they are already available.

**`<Callout>`** — A highlighted aside block for notes, warnings, or errors. Use for important clarifications that should stand out from prose.

```mdx
<Callout type="info">This note stands out from the surrounding prose.</Callout>
<Callout type="warn">Something to watch out for here.</Callout>
<Callout type="error">This approach has a known failure mode.</Callout>
```

**`<Note>`** — Shorthand for `<Callout type="info">`. Prefer this for informational asides.

```mdx
<Note>A quick clarification inline in the narrative.</Note>
```

**`<Warning>`** — Shorthand for `<Callout type="warn">`. Prefer this for cautions and gotchas.

```mdx
<Warning>Watch out for this common mistake.</Warning>
```

**`<CodeFilename>`** — Renders a filename label above a fenced code block, creating a unified visual block. Use when showing code from a specific file. The inner fenced block uses triple backticks as usual — `CodeFilename` wraps it as children.

```mdx
<CodeFilename filename="src/app/page.tsx">
```tsx
export default function Page() {
  return <main>Hello</main>;
}
```
</CodeFilename>
```

**`<InlineBadge>`** — A small inline chip for labeling concepts, states, or categories in prose. Renders without breaking line height. Variants: `primary` (default, accent color), `secondary` (muted surface), `muted` (lowest visual weight), `destructive` (error/breaking-change color).

```mdx
This API is <InlineBadge>stable</InlineBadge> in Next.js 16.
The old approach is <InlineBadge variant="destructive">deprecated</InlineBadge>.
This feature is <InlineBadge variant="muted">experimental</InlineBadge>.
```

**`<Stat>`** — Displays a large numeric impact figure with a label below it. Use for measurable outcomes in case-study-style sections.

```mdx
<Stat number="97%" label="reduction in cold-start latency after the cache layer shipped" />
```

**Automatic: pre copy button** — Every fenced code block automatically gets a copy-to-clipboard button. No component tag needed — `PreWithCopyButton` is registered as the `pre` override in `mdxComponents`. Just write standard triple-backtick fenced code blocks.

Do NOT use any other JSX component tags — only the components listed above are registered. Unknown component names are silently ignored by `next-mdx-remote@6`.

## REQUIRED COMPONENT USAGE

Every post **must** include all three of the following — they are what makes the blog visually distinct from generic Markdown:

| Component | Minimum | Where |
|-----------|---------|-------|
| `<Callout>` or `<Note>` or `<Warning>` | 1 | A section where a non-obvious caveat, gotcha, or best practice needs to stand out from prose |
| `<CodeFilename filename="...">` | 1 | Wrapping any real code snippet that comes from an identifiable file in the project |
| `<InlineBadge>` | 1 | Inline in prose — e.g. API status (`<InlineBadge>stable</InlineBadge>`), version (`<InlineBadge variant="secondary">v4+</InlineBadge>`), or label |

If the topic does not produce a natural code-from-file moment, use `<CodeFilename filename="config/example.ts">` for a configuration example. If there is no caveat, add a `<Note>` with a helpful tip or performance note. `<InlineBadge>` fits naturally in almost any technical sentence — use it to label a library name, a status, or a version constraint.

A post that reaches its word count without using these three components is **incomplete** — revise before writing the files.

---

## CONTENT RULES

- **Length:** 800–1200 words per locale. Count approximately. Do not pad; write substantive content.
- **Headings:** H2 only — the page template renders the `title` frontmatter as the H1. Do not write an H1 heading (`#`) in the body.
- **Voice:** Technical, direct, low-fluff, first-person past tense for decisions ("I chose", "we shipped", "I ran into").
- **Bold:** Use `**term**` for key terms inline (library names, concepts, decisions).
- **Code spans:** Use `` `backtick` `` for tool names, file paths, config keys, and package names.
- **Code blocks:** Use fenced triple-backtick blocks only for actual code — rare, only when truly illustrative. Do not use code blocks for prose emphasis.
- **Structure:** Narrative paragraphs preferred over bullet lists. Bullet lists are fine for a short checklist or a set of trade-offs; not for padding word count.
- **FORBIDDEN — inline JavaScript:** Do not write any of the following in the MDX body:
  - JavaScript expressions: `{value}`, `{expression}`, `{(100 * 0.97).toFixed(1)}`, or any `{...}` syntax
  - `import` statements
  - `export` statements
  - JSX tags that are NOT in the AVAILABLE MDX COMPONENTS list above (unknown tags are silently dropped)
  - `next-mdx-remote@6` has `blockJS: true` by default — JS expressions and import/export are silently stripped at render time. The registered components (`<Callout>`, `<Note>`, `<Warning>`, `<CodeFilename>`, `<InlineBadge>`, `<Stat>`) are NOT affected by this rule — use them freely.
- **FORBIDDEN — wrong date format:** The `date` field value must be exactly `"${TODAY}"` (a 10-character YYYY-MM-DD string). Never write `"May 13, 2026"` or any human-readable or ISO-8601 timestamp variant.
- **FORBIDDEN — uppercase or special characters in slug:** The slug in the filenames must be exactly `${SLUG}` — already lowercase alphanumeric with hyphens. Do not modify it.
- **PT version:** Must read naturally in idiomatic Brazilian Portuguese. Rethink phrasing for each section rather than translating word-for-word.

---

## PROJECT CONTEXT

These are learnings from projects Luiz has built. Use them as raw material for this post when relevant — especially if the topic is `personal-projects-open-source`, or if any challenge or learning maps to the current topic area:

${PROJECTS_CONTEXT}

---

## STYLE REFERENCE

Match this voice and structure. This is an existing post from the same blog — use it to calibrate tone, heading style, paragraph density, and how technical decisions are narrated:

${STYLE_REF}
