# Phase 3: Automated Content Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 3-automated-content-pipeline
**Areas discussed:** Scheduling mechanism, Content quality & voice, PR structure & review flow

---

## Scheduling mechanism

### Where should the agent live / what triggers it?

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions cron | `.github/workflows/generate-post.yml` with `schedule: cron` and the `claude` CLI | ✓ |
| Claude Code /schedule skill | Remote agent on Anthropic infrastructure, runs on schedule | |
| Vercel Cron + API route | Pure API approach: Vercel Cron → API route → Anthropic API → GitHub API | |
| Local machine cron (launchd) | Script on Luiz's Mac, fragile | |

**User's choice:** GitHub Actions cron

---

### How should the workflow authenticate with Claude?

| Option | Description | Selected |
|--------|-------------|----------|
| claude CLI | `npm install -g @anthropic-ai/claude-code`, run `claude --print -p "..."` | ✓ |
| Direct Anthropic API via Node script | Small Node script calling Anthropic SDK | |
| gh CLI + curl | Shell-only approach | |

**User's choice:** claude CLI

---

### Should the workflow have a `workflow_dispatch` trigger?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — workflow_dispatch | Manual trigger alongside the cron for on-demand generation and testing | ✓ |
| No — cron only | Only runs on the 5-day schedule | |

**User's choice:** Yes — workflow_dispatch

---

### What happens if the workflow fails?

| Option | Description | Selected |
|--------|-------------|----------|
| Fail silently — GitHub default email | Standard GitHub Actions failure notification via email | ✓ |
| Explicit comment on GitHub issue | Opens/comments on a dedicated issue on failure | |
| You decide | Leave to implementation | |

**User's choice:** Fail silently — GitHub Actions default email notification

---

## Content quality & voice

### Should generated posts sound like Luiz's voice?

| Option | Description | Selected |
|--------|-------------|----------|
| Luiz's voice — feed examples | Use `building-this-portfolio.en.mdx` as style reference in the prompt | ✓ |
| Good generic tech voice | Standard high-quality tech blog tone | |
| Minimal draft — skeleton only | Structure + headers + bullets, Luiz writes the body | |

**User's choice:** Luiz's voice — feed the agent the existing post as style reference

---

### How long should generated posts be?

| Option | Description | Selected |
|--------|-------------|----------|
| Short — 400-600 words | Quick reads, easier bilingual, faster review | |
| Medium — 800-1200 words | Substantive, matches existing post length | ✓ |
| Long — 1500+ words | Deep dives, high editing burden | |

**User's choice:** Medium — 800-1200 words

---

### Bilingual generation strategy?

| Option | Description | Selected |
|--------|-------------|----------|
| Single run — both EN + PT together | One claude invocation, consistent across locales | ✓ |
| Two runs — EN first then translate to PT | More predictable translation quality, doubles API calls | |
| You decide | Leave to implementation | |

**User's choice:** Single run — agent writes both EN and PT in one claude invocation

---

## PR structure & review flow

### What should the PR contain beyond MDX files?

| Option | Description | Selected |
|--------|-------------|----------|
| MDX files + topic state file | `.en.mdx`, `.pt.mdx`, and `content/blog/.pipeline-state.json` merged atomically | ✓ |
| MDX files only — state elsewhere | State tracked in GitHub env/gist | |
| You decide | Leave to implementation | |

**User's choice:** MDX files + topic state file (`content/blog/.pipeline-state.json`)

---

### Should generated posts use `draft: true`?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — draft: true until published | Safe default; Luiz flips to `false` before/after merging | ✓ |
| No — draft: false from the start | Publishes immediately on merge | |
| draft field absent (schema default) | Same risk as draft:false | |

**User's choice:** Yes — `draft: true` in generated frontmatter

---

### Should the PR include a review checklist?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — checklist in PR body | Frontmatter valid, PT reads naturally, no inline JS, flip draft:false | ✓ |
| No — minimal PR body | One-liner description | |
| You decide | Leave to implementation | |

**User's choice:** Yes — a review checklist in the PR description

---

### Branch naming convention?

| Option | Description | Selected |
|--------|-------------|----------|
| content/auto-post-YYYY-MM-DD | Date-stamped, predictable, unique per run | ✓ |
| content/auto-post-[topic-slug] | Topic-named, may collide | |
| You decide | Leave to implementation | |

**User's choice:** `content/auto-post-YYYY-MM-DD`

---

## Claude's Discretion

- Exact cron expression for "every 5 days"
- Which Claude model to use (Haiku vs Sonnet — cost vs quality tradeoff)
- Full prompt structure and system message beyond the style-reference file
- Slug generation format
- Whether to run `pnpm verify:posts` in the workflow before opening the PR
- Schema fields for `.pipeline-state.json` beyond `last_topic`

## Deferred Ideas

None — discussion stayed within phase scope.
