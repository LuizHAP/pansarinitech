# Phase 3: Automated Content Pipeline — Research

**Researched:** 2026-05-13
**Domain:** GitHub Actions scheduled workflows + Claude Code CLI (`claude -p`) + `gh` CLI PR creation + bilingual MDX generation
**Confidence:** HIGH (all claims verified against official docs or codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Workflow at `.github/workflows/generate-post.yml`; triggers: `schedule: cron` (approximately every 5 days) AND `workflow_dispatch`
- **D-02:** Installs `@anthropic-ai/claude-code` via `npm install -g @anthropic-ai/claude-code`; invokes `claude --print -p "..."` with the generation prompt; requires `ANTHROPIC_API_KEY` GitHub Actions secret
- **D-03:** Failure handling = default GitHub Actions email notification; no extra alerting setup
- **D-04:** Agent prompt feeds `content/blog/building-this-portfolio.en.mdx` as style reference (direct, technical, low-fluff, first-person voice)
- **D-05:** Target post length: 800–1200 words per locale
- **D-06:** Single `claude` invocation writes both `.en.mdx` and `.pt.mdx` in one run
- **D-07:** Topic rotation tracked in `content/blog/.pipeline-state.json`; four topics round-robin: `nextjs-react-frontend`, `software-engineering-career`, `ai-in-development`, `personal-projects-open-source`
- **D-08:** PR includes updated `.pipeline-state.json` + both MDX files (atomic merge)
- **D-09:** Generated posts use `draft: true` in frontmatter; existing blog gating hides them until Luiz flips to `draft: false`
- **D-10:** PR body includes review checklist (frontmatter valid, PT natural, no inline JS, draft flip reminder)
- **D-11:** Branch naming: `content/auto-post-YYYY-MM-DD`

### Claude's Discretion

- Exact cron expression for "every 5 days" (e.g. `0 9 */5 * *` or similar; month-boundary behavior acceptable)
- Which Claude model to use (`claude-haiku-4-5` for cost, `claude-sonnet-4-6` for quality)
- Full prompt structure and system message content beyond the style-reference file
- Slug generation from topic area
- Whether to run `pnpm verify:posts` inside the workflow after generation, before PR creation
- Schema for `.pipeline-state.json` fields beyond `last_topic`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIPE-01 | Scheduled Claude Code agent runs every 5 days and generates bilingual MDX blog post draft | Cron schedule `0 9 */5 * *`; `claude -p` headless mode; `--dangerously-skip-permissions` or `--permission-mode acceptEdits` for file writes |
| PIPE-02 | Topics rotate in round-robin across 4 areas; tracked to avoid consecutive repeats | `.pipeline-state.json` read before prompt construction; prompt instructs agent to use next topic and update state |
| PIPE-03 | Generated MDX includes all required frontmatter valid against `BlogFrontmatter` Zod schema | `pnpm verify:posts` runs post-generation (pre-PR); schema: title, date (YYYY-MM-DD), excerpt (40–280 chars), tags[], draft (boolean) |
| PIPE-04 | Agent creates git branch and opens GitHub PR | `git checkout -b`, `git add`, `git commit`, `git push`, `gh pr create`; `GITHUB_TOKEN` with `contents: write` + `pull-requests: write` |
| PIPE-05 | Merging approved PR triggers Vercel auto-deploy via existing CI | Vercel auto-deploys all pushes to `main`; `ci.yml` already runs `pnpm verify:posts` on every PR — no new config needed |
| PIPE-06 | Tracks recently generated topics to avoid consecutive duplicate themes | `.pipeline-state.json` records `last_topic`; agent reads it before writing post; updates atomically in same PR |
| PIPE-07 | Posts follow MDX conventions: `content/blog/[slug].[locale].mdx`, frontmatter schema, no inline JS | Agent instructed explicitly: no `import`/`export`, no `{expression}` JS; `blockJS: true` is enforced by next-mdx-remote v6 at render time |
</phase_requirements>

---

## Summary

Phase 3 delivers a GitHub Actions workflow that schedules a `claude -p` invocation every 5 days to generate a bilingual MDX blog post draft and open a PR for review. The entire system is a single YAML workflow file, a topic-state JSON, and a carefully constructed prompt — no new NPM packages, no new routes, no UI changes.

The key technical insight is that `claude -p` in headless mode can write files to disk when granted `--permission-mode acceptEdits` (or `--allowedTools "Write,Edit,Read,Bash(...)"`). The workflow checks out the repo, runs the claude agent to write two MDX files and update `.pipeline-state.json`, then uses the built-in `gh` CLI (available by default on GitHub-hosted runners) to create the branch and PR. The `GITHUB_TOKEN` needs `contents: write` and `pull-requests: write` — granted via a `permissions:` block in the workflow YAML; no PAT or GitHub App required for a personal repo.

The two strategic choices left to Claude's discretion are: (1) model selection — `claude-haiku-4-5` keeps API cost negligible for a 12-run/year workflow, `claude-sonnet-4-6` produces better bilingual prose; and (2) whether to invoke `pnpm verify:posts` inside the workflow before PR creation to catch frontmatter errors preemptively (the CI gate already catches it, but early failure is faster feedback).

**Primary recommendation:** Use `claude-sonnet-4-6` (quality over pennies at ~$0.01–0.05/run), run `pnpm verify:posts` pre-PR as an explicit workflow step, and keep the prompt as a heredoc string in the YAML for auditability.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scheduling / triggering | CI (GitHub Actions) | — | cron + workflow_dispatch are GitHub Actions native |
| Content generation | AI agent (`claude -p`) | — | Agent writes MDX files directly to checked-out repo on runner |
| Topic rotation state | Repo file (`content/blog/.pipeline-state.json`) | — | Git is the source of truth; atomic PR ensures state + content stay in sync |
| Frontmatter validation | Existing CI script (`pnpm verify:posts`) | Workflow pre-PR step | Script already parses YAML frontmatter + checks Zod schema; reusable |
| PR creation | `gh` CLI on runner | — | `gh` is pre-installed on all GitHub-hosted runners |
| Publish gate | Existing Vercel integration | — | Vercel auto-deploys on merge to `main`; `draft: true` hides content until flipped |

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `@anthropic-ai/claude-code` | `2.1.140` (current) | Claude CLI — generates MDX content in headless mode | Decision D-02; official Anthropic CLI, runs as `claude -p` |
| GitHub Actions | — | Workflow scheduling (`schedule: cron`) + runner execution | Decision D-01; free on public/personal repos |
| `gh` CLI | pre-installed on `ubuntu-latest` | Branch creation + PR opening | Available on all GitHub-hosted runners by default; no install step needed |
| `pnpm` | (repo's existing version) | Run `verify:posts` pre-PR | Already in repo; avoids re-installing Node toolchain from scratch |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `actions/checkout@v4` | v4 | Check out repo on runner | Required first step in any workflow that touches repo files |
| `pnpm/action-setup@v4` | v4 | Install pnpm on runner | Already pattern in `ci.yml`; copy setup steps from there |
| `actions/setup-node@v4` | v4 | Set up Node 22 | Already pattern in `ci.yml` |

### Not Needed

| Excluded | Reason |
|----------|--------|
| `anthropics/claude-code-action@v1` | Decision D-02 chose direct `claude -p` invocation; the GitHub Action is designed for PR/issue comment triggers, not for generating content from scratch in scheduled automation |
| `peter-evans/create-pull-request` | `gh pr create` is simpler and already available; no 3rd-party action needed |
| Python SDK / TypeScript SDK | Overkill; `claude -p` with file-write permissions is the direct path |

**Version verification:** `npm view @anthropic-ai/claude-code version` returns `2.1.140` (verified 2026-05-13). [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
GitHub Actions Runner (ubuntu-latest)
│
├── Trigger
│   ├── schedule: cron "0 9 */5 * *"   ← ~every 5 days at 09:00 UTC
│   └── workflow_dispatch               ← manual on-demand trigger
│
├── Step 1: actions/checkout@v4
│   └── full repo on runner disk
│
├── Step 2: pnpm/action-setup + setup-node + pnpm install --frozen-lockfile
│   └── Node + pnpm ready (for verify:posts)
│
├── Step 3: npm install -g @anthropic-ai/claude-code
│   └── `claude` binary available on PATH
│
├── Step 4: Read .pipeline-state.json → compute next topic + slug
│   └── Shell script: jq or node -e to read last_topic, rotate to next
│
├── Step 5: claude -p "<prompt>" --permission-mode acceptEdits
│   │   ├── Reads:  content/blog/building-this-portfolio.en.mdx (style ref)
│   │   │           content/blog/.pipeline-state.json (state)
│   │   ├── Writes: content/blog/<slug>.en.mdx
│   │   │           content/blog/<slug>.pt.mdx
│   │   └── Writes: content/blog/.pipeline-state.json (updated last_topic)
│   └── claude exits; files on runner disk
│
├── Step 6: pnpm verify:posts
│   └── Validates frontmatter + bilingual parity → exits 0 or fails workflow
│
├── Step 7: git config + checkout -b content/auto-post-YYYY-MM-DD
│            git add content/blog/<slug>.*.mdx content/blog/.pipeline-state.json
│            git commit -m "content(auto): <topic> post YYYY-MM-DD"
│            git push origin content/auto-post-YYYY-MM-DD
│
└── Step 8: gh pr create
            --title "[auto] Blog post: <topic> (YYYY-MM-DD)"
            --body "<checklist>"
            --draft
            --base main
            → PR opened; CI runs automatically on PR (verify:posts, lint, build)
```

### Recommended Project Structure

No new source directories needed. All deliverables are new files:

```
.github/
└── workflows/
    ├── ci.yml                          (existing — unchanged)
    ├── lighthouse.yml                  (existing — unchanged)
    └── generate-post.yml               (NEW — this phase)

content/
└── blog/
    ├── .pipeline-state.json            (NEW — topic rotation state)
    ├── building-this-portfolio.en.mdx  (existing — used as style reference)
    └── building-this-portfolio.pt.mdx  (existing)
```

### Pattern 1: Headless claude with `--permission-mode acceptEdits`

**What:** `claude -p "..."` in non-interactive mode with `--permission-mode acceptEdits` allows the agent to write files without permission prompts. This is the correct mode for CI automation — it auto-approves file edits + common filesystem commands (`mkdir`, `touch`, `mv`, `cp`) while still requiring explicit `--allowedTools` entries for Bash commands.

**When to use:** Any CI/CD scenario where the agent needs to write files but shouldn't have unrestricted shell access.

```bash
# Source: https://code.claude.com/docs/en/headless
claude -p "..." \
  --permission-mode acceptEdits \
  --allowedTools "Read,Write,Edit,Bash(git *)" \
  --no-session-persistence
```

**Why `--permission-mode acceptEdits` over `--dangerously-skip-permissions`:**
- `acceptEdits` auto-approves file writes + common FS ops; shell commands outside `--allowedTools` still abort — safer
- `--dangerously-skip-permissions` (alias `bypassPermissions`) is the nuclear option; fine for isolated runner but semantically more than needed
- Either works for this phase; `acceptEdits` is the principle-of-least-privilege choice [CITED: code.claude.com/docs/en/headless]

### Pattern 2: Cron schedule for "every 5 days"

**What:** GitHub Actions cron uses POSIX syntax. `*/5` in the day-of-month field means "every 5 days starting from day 1 of the month." This produces runs on days 1, 6, 11, 16, 21, 26, 31 of each month — 6–7 times per month rather than exactly every 5 calendar days. Month-boundary gaps are acceptable (decision acknowledged in CONTEXT.md).

```yaml
# Source: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows
on:
  schedule:
    - cron: "0 9 */5 * *"   # 09:00 UTC on days 1, 6, 11, 16, 21, 26, 31
  workflow_dispatch:
```

**Important:** GitHub Actions minimum cron interval is 5 minutes. Scheduled runs on inactive public repos are disabled after 60 days without activity. [CITED: docs.github.com]

### Pattern 3: GITHUB_TOKEN permissions for branch push + PR creation

**What:** The `GITHUB_TOKEN` auto-issued to each workflow run needs explicit `contents: write` (for `git push`) and `pull-requests: write` (for `gh pr create`). Set at the job level:

```yaml
# Source: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token
jobs:
  generate-post:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
```

**Additional requirement:** The repo setting "Allow GitHub Actions to create and approve pull requests" must be enabled in repo Settings → Actions → General → Workflow permissions. Default for personal repos created after 2023-02-02 is **disabled** — this is a one-time manual toggle in repo settings. [CITED: docs.github.com/actions/security-guides/automatic-token-authentication]

### Pattern 4: .pipeline-state.json schema

Minimal schema that satisfies D-07 (last_topic) and Claude's discretion (additional fields):

```json
{
  "last_topic": "nextjs-react-frontend",
  "run_count": 3,
  "last_run_date": "2026-05-13",
  "topic_sequence": [
    "nextjs-react-frontend",
    "software-engineering-career",
    "ai-in-development",
    "personal-projects-open-source"
  ]
}
```

- `last_topic` — string key of the last-used topic slug (required for PIPE-06)
- `run_count` — integer counter; useful for slug uniqueness and debugging
- `last_run_date` — ISO date; documents when last post was generated
- `topic_sequence` — the canonical order; agent reads this to determine `next_topic = sequence[(sequence.indexOf(last_topic) + 1) % 4]`

**Initial state** (when file does not yet exist): workflow step initializes it to `{"last_topic": null, "run_count": 0, "last_run_date": null, "topic_sequence": [...]}` so first run picks `nextjs-react-frontend` (index 0 after null).

### Pattern 5: BlogFrontmatter shape the agent must produce

This is the Zod schema from `src/lib/mdx/schema.ts` that `pnpm verify:posts` validates against. The agent's output MUST satisfy all constraints:

```yaml
---
title: "Title in English (or Portuguese)"
date: "YYYY-MM-DD"          # must be ISO date of generation day
excerpt: "40–280 character summary string"
tags:
  - tag1
  - tag2
draft: true                 # ALWAYS true for generated posts (D-09)
---
```

**Strict constraints from `check-mdx-content.mjs`:**
- `title`: non-empty string
- `date`: regex `/^\d{4}-\d{2}-\d{2}$/` — must be 10-char ISO date, no time component
- `excerpt`: 40–280 characters **inclusive** — agent must count chars; too-short excerpts are a known generation failure mode
- `tags`: optional array (omit or provide); if present must be string array
- `draft`: boolean `true` or `false`; agent ALWAYS writes `true`
- No inline JS expressions (`{...}`) — `blockJS: true` strips them at render; generate pure Markdown + allowed MDX components [VERIFIED: codebase inspection]

### Pattern 6: Bilingual parity requirement

`pnpm verify:posts` (in `scripts/check-mdx-content.mjs`) REQUIRES both `.en.mdx` and `.pt.mdx` to exist for every slug. The agent must write BOTH files in one invocation. If only one file is written, the CI gate (which also runs on the PR) fails.

The FILE_PATTERN regex the script uses: `/^([a-z0-9-]+)\.(en|pt)\.mdx$/` — slugs must be lowercase alphanumeric with hyphens only. The agent must generate slugs matching this pattern. [VERIFIED: codebase inspection `scripts/check-mdx-content.mjs`]

### Anti-Patterns to Avoid

- **Using `anthropics/claude-code-action@v1` for this workflow:** That action is designed for PR/issue-triggered interactive automation (responding to `@claude`). For scheduled content generation from scratch, direct `claude -p` invocation is simpler and avoids the action's overhead and interactive-mode detection logic.
- **Generating slug with spaces or uppercase:** `FILE_PATTERN` in `check-mdx-content.mjs` only matches `[a-z0-9-]+`. Any uppercase or space in the slug breaks parity detection silently.
- **Writing frontmatter with YAML double-quoted strings containing unescaped colons:** The frontmatter parser in `check-mdx-content.mjs` is a light hand-rolled parser (not a full YAML parser). Avoid nested colons in unquoted values; always quote title and excerpt.
- **Generating MDX with `import` statements or `{jsExpression}`:** `next-mdx-remote@6` has `blockJS: true` by default. The prompt must explicitly forbid this — generated content should be pure Markdown + any of the existing `mdxComponents` (Callout, Note, Warning, Stat) by name only.
- **Not configuring git identity on the runner:** GitHub Actions runners have no global git user by default. The workflow must run `git config user.email "github-actions[bot]@users.noreply.github.com"` and `git config user.name "github-actions[bot]"` before any `git commit`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PR creation | Custom REST API calls to GitHub | `gh pr create` | `gh` is pre-installed on runners; simpler, handles auth via `GITHUB_TOKEN` automatically |
| Frontmatter validation | Inline validation logic in the workflow | `pnpm verify:posts` | Script already exists, already validates the exact schema, already runs in CI; calling it twice (workflow + CI) adds no complexity |
| Bilingual parity check | Manual file existence checks | `pnpm verify:posts` | Same script does parity check — treats missing `.pt.mdx` as a hard error |
| Topic rotation logic | Complex state machine | Simple JSON file + `node -e` or `jq` | State is one field; no library needed |
| Content scheduling | External cron service | GitHub Actions `schedule:` | Built-in, free, auditable alongside code |

**Key insight:** The hardest part of this phase is prompt engineering, not infrastructure. The infrastructure layer is 50 lines of YAML. Invest time in the generation prompt — especially the excerpt length constraint (must be explicitly stated to avoid <40 char excerpts) and the no-inline-JS requirement.

---

## Common Pitfalls

### Pitfall 1: `pnpm verify:posts` fails on excerpt length
**What goes wrong:** The agent generates an excerpt of ~30 characters ("A look at Next.js patterns.") — valid English but too short. CI on the PR fails. Luiz must manually edit before merge.
**Why it happens:** LLMs tend toward brevity without explicit length constraints.
**How to avoid:** Prompt must state: "The excerpt field must be between 40 and 280 characters — count the characters and ensure it meets the minimum." Include a concrete 40-char example in the prompt.
**Warning signs:** `pnpm verify:posts` output: `excerpt must be 40-280 chars; got 35`.

### Pitfall 2: Frontmatter date field wrong format
**What goes wrong:** Agent writes `date: "May 13, 2026"` or `date: "2026-05-13T09:00:00Z"` — both fail the regex `/^\d{4}-\d{2}-\d{2}$/`.
**Why it happens:** LLMs default to human-readable dates or ISO-8601 full timestamps.
**How to avoid:** Prompt must specify: "date field must be exactly YYYY-MM-DD format, e.g. 2026-05-13." Inject the actual run date as a GitHub Actions variable: `date: "${{ env.TODAY }}"` resolved via `TODAY=$(date -u +%Y-%m-%d)` before the `claude -p` invocation.
**Warning signs:** `date must be YYYY-MM-DD; got "2026-05-13T09:00:00.000Z"`.

### Pitfall 3: Slug contains uppercase or special characters
**What goes wrong:** Agent generates `slug: "NextJS-Patterns-2026"` and writes `content/blog/NextJS-Patterns-2026.en.mdx`. The `check-mdx-content.mjs` FILE_PATTERN regex `/^([a-z0-9-]+)\.(en|pt)\.mdx$/` does not match — file is silently skipped, parity check sees 0 posts, reports `✓ blog: 0 EN / 0 PT (parity ok)`, PR lands with no validation of the new files.
**Why it happens:** Slugs are inferred from topic titles; LLMs uppercase naturally.
**How to avoid:** Force slug normalization in the workflow's shell step: `slug=$(echo "$TOPIC_SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')`. OR instruct the agent to generate the slug AND write the filenames in lowercase-hyphenated form, then verify post-write.
**Warning signs:** `pnpm verify:posts` reports 0 posts despite two new files being visible in `git status`.

### Pitfall 4: Repo setting blocks `gh pr create`
**What goes wrong:** Workflow fails with `Error: pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests`.
**Why it happens:** The repo setting "Allow GitHub Actions to create and approve pull requests" defaults to **disabled** for personal repos created after 2023-02-02.
**How to avoid:** Enable the setting once in repo Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests". This is a one-time manual step documented in the Wave 0 tasks.
**Warning signs:** First workflow run fails at the `gh pr create` step with the above error message.

### Pitfall 5: `git push` fails because branch already exists
**What goes wrong:** A previous workflow run created the same branch `content/auto-post-2026-05-13` but the PR was never merged or the branch was not deleted. The push fails with "branch already exists".
**Why it happens:** `workflow_dispatch` allows re-running the workflow manually on the same day.
**How to avoid:** Include a timestamp or short hash suffix in the branch name: `content/auto-post-$(date -u +%Y-%m-%d-%H%M)`. Or check for existing branch and delete/reuse it.
**Warning signs:** `git push` exits nonzero with "remote: error: cannot lock ref".

### Pitfall 6: `claude -p` exits before files are written
**What goes wrong:** The workflow runs, `claude -p` outputs some text, exits 0, but no MDX files appear on disk.
**Why it happens:** Without `--permission-mode acceptEdits` (or `--allowedTools "Write,Edit"`), file write tool calls hit a permission prompt that hangs indefinitely in non-interactive mode, then times out — but because the GitHub Actions runner kills the process, it may exit 0 with no files written.
**How to avoid:** Always include `--permission-mode acceptEdits` or `--allowedTools "Write,Edit,Read"` in the `claude -p` invocation. Verify the workflow step that checks for generated files: `test -f "content/blog/$SLUG.en.mdx" || exit 1`.
**Warning signs:** Workflow "succeeds" but no new files appear in `git status`.

### Pitfall 7: MDX body contains inline JS that silently strips
**What goes wrong:** Agent writes `## Performance is {(100 * 0.97).toFixed(1)}%` in the MDX body. `next-mdx-remote@6` with `blockJS: true` silently strips the JS expression — the blog renders "## Performance is %" with no error.
**Why it happens:** LLMs write JavaScript expressions naturally.
**How to avoid:** Prompt must explicitly forbid: "Do not write any JavaScript expressions like `{value}`, `{expression}`, `import ...`, or `export ...` in the MDX body. Use plain Markdown and allowed MDX components only."
**Warning signs:** Rendered blog post shows missing numbers or garbled text that was an expression in the raw MDX.

---

## Code Examples

### Workflow skeleton (generate-post.yml)

```yaml
# Source: code.claude.com/docs/en/headless, docs.github.com/actions
name: Generate Blog Post

on:
  schedule:
    - cron: "0 9 */5 * *"    # ~every 5 days at 09:00 UTC
  workflow_dispatch:

jobs:
  generate-post:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install project deps (for verify:posts)
        run: pnpm install --frozen-lockfile

      - name: Install Claude CLI
        run: npm install -g @anthropic-ai/claude-code

      - name: Configure git identity
        run: |
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git config user.name "github-actions[bot]"

      - name: Resolve topic and slug
        id: topic
        run: |
          TODAY=$(date -u +%Y-%m-%d)
          # Read last_topic from state file (or default to null)
          LAST=$(node -e "
            const fs = require('fs');
            const state = fs.existsSync('content/blog/.pipeline-state.json')
              ? JSON.parse(fs.readFileSync('content/blog/.pipeline-state.json', 'utf8'))
              : { last_topic: null };
            console.log(state.last_topic || 'null');
          ")
          # Rotate to next topic
          TOPICS="nextjs-react-frontend software-engineering-career ai-in-development personal-projects-open-source"
          NEXT=$(node -e "
            const seq = ['nextjs-react-frontend','software-engineering-career','ai-in-development','personal-projects-open-source'];
            const last = process.argv[1] === 'null' ? null : process.argv[1];
            const idx = last === null ? 0 : (seq.indexOf(last) + 1) % seq.length;
            console.log(seq[idx]);
          " "$LAST")
          SLUG="${NEXT}-$(date -u +%Y%m%d)"
          echo "today=$TODAY" >> $GITHUB_OUTPUT
          echo "topic=$NEXT" >> $GITHUB_OUTPUT
          echo "slug=$SLUG" >> $GITHUB_OUTPUT

      - name: Generate bilingual MDX post
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TOPIC: ${{ steps.topic.outputs.topic }}
          SLUG: ${{ steps.topic.outputs.slug }}
          TODAY: ${{ steps.topic.outputs.today }}
        run: |
          STYLE_REF=$(cat content/blog/building-this-portfolio.en.mdx)
          claude -p "$(cat <<PROMPT
          You are writing a bilingual technical blog post for Luiz Pansarini's portfolio.
          
          ## Your task
          Write TWO MDX files:
          - content/blog/${SLUG}.en.mdx  (English version)
          - content/blog/${SLUG}.pt.mdx  (Brazilian Portuguese version — not a translation, write naturally)
          
          Also update content/blog/.pipeline-state.json with:
          {
            "last_topic": "${TOPIC}",
            "run_count": <increment existing run_count by 1>,
            "last_run_date": "${TODAY}",
            "topic_sequence": ["nextjs-react-frontend","software-engineering-career","ai-in-development","personal-projects-open-source"]
          }
          
          ## Topic: ${TOPIC}
          
          ## Required frontmatter (both files must include exactly this shape):
          ---
          title: "<title in the post's language>"
          date: "${TODAY}"
          excerpt: "<REQUIRED: 40 to 280 characters inclusive. Count the characters. Minimum 40.>"
          tags:
            - <tag1>
            - <tag2>
          draft: true
          ---
          
          ## Content rules
          - Length: 800–1200 words per locale
          - Voice: technical, direct, low-fluff, first-person (see style reference below)
          - NO inline JavaScript: no {expressions}, no import, no export
          - NO dynamic imports or JSX components other than standard Markdown
          - Use only plain Markdown: headings, paragraphs, bold, code blocks (fenced with backticks), lists
          - Slug in filenames must be exactly: ${SLUG} (lowercase, hyphens only)
          - The PT version should read naturally in Brazilian Portuguese — not a literal word-for-word translation
          
          ## Style reference (match this voice and structure):
          ${STYLE_REF}
          PROMPT
          )" \
            --permission-mode acceptEdits \
            --allowedTools "Read,Write,Edit,Bash(git status)" \
            --no-session-persistence \
            --model claude-sonnet-4-6

      - name: Verify generated posts (frontmatter + parity)
        run: pnpm verify:posts

      - name: Create branch and commit
        env:
          SLUG: ${{ steps.topic.outputs.slug }}
          TODAY: ${{ steps.topic.outputs.today }}
          TOPIC: ${{ steps.topic.outputs.topic }}
        run: |
          BRANCH="content/auto-post-${TODAY}"
          git checkout -b "$BRANCH"
          git add "content/blog/${SLUG}.en.mdx" "content/blog/${SLUG}.pt.mdx" "content/blog/.pipeline-state.json"
          git commit -m "content(auto): ${TOPIC} post ${TODAY}"
          git push origin "$BRANCH"

      - name: Open PR
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TOPIC: ${{ steps.topic.outputs.topic }}
          TODAY: ${{ steps.topic.outputs.today }}
        run: |
          gh pr create \
            --title "[auto] Blog post: ${TOPIC} (${TODAY})" \
            --body "$(cat <<'BODY'
          ## Automated blog post — review checklist
          
          - [ ] Frontmatter valid: date (YYYY-MM-DD), excerpt (40–280 chars), tags present
          - [ ] PT version reads naturally — not a literal translation
          - [ ] No inline JS or dynamic imports in MDX body
          - [ ] Flip \`draft: false\` to publish (or leave \`true\` to merge without publishing)
          
          > Generated by the automated content pipeline. Merge to add to repo; flip draft to publish.
          BODY
          )" \
            --base main
```

### .pipeline-state.json initial state

```json
{
  "last_topic": null,
  "run_count": 0,
  "last_run_date": null,
  "topic_sequence": [
    "nextjs-react-frontend",
    "software-engineering-career",
    "ai-in-development",
    "personal-projects-open-source"
  ]
}
```

### Verifying file write worked (defensive check)

```bash
# Add this step between claude invocation and verify:posts
- name: Assert generated files exist
  env:
    SLUG: ${{ steps.topic.outputs.slug }}
  run: |
    test -f "content/blog/${SLUG}.en.mdx" || { echo "ERROR: EN file not generated"; exit 1; }
    test -f "content/blog/${SLUG}.pt.mdx" || { echo "ERROR: PT file not generated"; exit 1; }
    echo "Both locale files present."
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` import | `motion/react` import | mid-2025 | Not relevant to this phase |
| `anthropics/claude-code-action@beta` (mode, direct_prompt) | `@v1` (prompt, claude_args) | GA 2025 | D-02 uses `claude -p` directly — irrelevant, but good to know if we ever switch |
| `@anthropic-ai/claude-code` v1.x | v2.1.x (current `2.1.140`) | ongoing | `--permission-mode acceptEdits` is v2+ flag; v2.1.x also adds `--bare` mode for faster CI startup |
| `--enable-auto-mode` flag | `--permission-mode auto` | v2.1.111 | The old flag was removed; use `--permission-mode` |

**Deprecated/outdated:**
- `--enable-auto-mode`: Removed in v2.1.111. Use `--permission-mode auto` instead. [CITED: code.claude.com/docs/en/cli-reference]
- `direct_prompt` in `claude-code-action`: Renamed to `prompt` in v1 GA. [CITED: code.claude.com/docs/en/github-actions]

---

## Runtime State Inventory

> Step 2.5: This phase is greenfield infrastructure (new workflow file + new state file). No rename/refactor scope. Omitting.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@anthropic-ai/claude-code` | Step 3 (npm install -g) | Installed via npm at runtime | 2.1.140 | None — required |
| `gh` CLI | Step 8 (pr create) | Pre-installed on `ubuntu-latest` | 2.x | None — use `curl` GitHub API but `gh` is simpler |
| `pnpm` | Verify:posts step | Via `pnpm/action-setup@v4` | Same as repo | None — required |
| `node` | Topic rotation script | Via `actions/setup-node@v4` (Node 22) | 22 | None — required |
| `ANTHROPIC_API_KEY` | claude -p invocation | Must be manually added to repo secrets | — | None — workflow fails without it |
| `GH_TOKEN` (GITHUB_TOKEN) | gh pr create | Auto-issued by GitHub Actions | — | None — but needs `contents: write` + `pull-requests: write` permissions AND repo setting enabled |

**Missing dependencies with no fallback:**
- `ANTHROPIC_API_KEY` — must be added to repo Settings → Secrets and variables → Actions before first run. This is a Wave 0 manual step.
- Repo setting "Allow GitHub Actions to create and approve pull requests" — must be enabled in Settings → Actions → General. One-time manual toggle. Wave 0 task.

**Missing dependencies with fallback:**
- None identified.

---

## Open Questions

1. **Model choice (Claude's discretion)**
   - What we know: `claude-sonnet-4-6` produces higher-quality bilingual prose; `claude-haiku-4-5` is ~10x cheaper per token (~$0.001 vs ~$0.01 per 1K output tokens)
   - What's unclear: At 12 runs/year, the cost delta is negligible ($0.10 vs $1.00/year estimated); quality matters more for a public portfolio
   - Recommendation: Use `claude-sonnet-4-6` — the quality difference in bilingual technical writing is significant, the cost difference is trivial at this volume. Set `--model claude-sonnet-4-6` explicitly so it doesn't default to whatever the current default is.

2. **`pnpm verify:posts` inside workflow (Claude's discretion)**
   - What we know: The CI gate already runs `pnpm verify:posts` on every PR automatically. Running it in the workflow too adds ~5s but catches errors before the PR is created.
   - What's unclear: If `verify:posts` fails in the workflow, the PR is never opened — Luiz gets a GitHub Actions failure email instead of a PR with a broken CI badge.
   - Recommendation: Include it as a pre-PR workflow step. A failed workflow (no PR opened) is cleaner feedback than a PR with a failing CI check. The cost is minimal.

3. **Prompt as heredoc in YAML vs external file**
   - What we know: Large heredocs in YAML are ugly but auditable in the repo. An external prompt file (`scripts/generate-post-prompt.txt`) is cleaner but adds a file the planner must track.
   - Recommendation: Use an external prompt file `scripts/generate-post-prompt.md` — it can be committed, edited without YAML escaping issues, read with `--system-prompt-file` or by injecting via `$()`, and reviewed independently.

4. **Branch name collision on same-day re-runs**
   - What we know: `content/auto-post-YYYY-MM-DD` can collide if the workflow is re-triggered on the same day via `workflow_dispatch`.
   - Recommendation: Append hour-minute: `content/auto-post-$(date -u +%Y-%m-%d-%H%M)`. Minimal ugliness, prevents collision.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `claude -p` with `--permission-mode acceptEdits` reliably writes files to disk on GitHub Actions `ubuntu-latest` runner without additional permission configuration | Standard Stack / Code Examples | If flag behavior differs, files won't be written and the "assert files exist" check catches it before PR creation — workflow fails with clear error |
| A2 | `gh` CLI is available on `ubuntu-latest` without an install step | Environment Availability | If not pre-installed, add `actions/setup-gh` or use `gh` via the GitHub API directly |
| A3 | `GITHUB_TOKEN` with `contents: write` + `pull-requests: write` is sufficient for `gh pr create` against the repo's own `main` branch | Architecture Patterns §3 | If a branch protection rule requires a PAT or GitHub App, a classic PAT (`GH_PAT`) would be needed as a repo secret |
| A4 | `claude-sonnet-4-6` is the current Sonnet model ID for direct API (non-Bedrock) usage | Open Questions §1 | If the model ID changes, use `sonnet` alias instead of the versioned ID |

---

## Project Constraints (from CLAUDE.md)

The following directives from `./CLAUDE.md` apply to this phase:

| Directive | Impact on Phase 3 |
|-----------|------------------|
| **No react-hook-form** — use React 19 `useActionState` + zod | Not applicable (no UI in this phase) |
| **next-seo is anti-pattern** — use built-in Metadata API | Not applicable (no new routes) |
| **`next-mdx-remote@^6` with `blockJS: true` (default)** | Generated MDX must contain no inline JS; constraint baked into agent prompt |
| **Bilingual: every user-facing copy in PT and EN before shipping** | Both `.en.mdx` and `.pt.mdx` must be generated in one run; `pnpm verify:posts` enforces parity |
| **Performance: Lighthouse ≥ 95 mobile** | Not applicable to this phase (no new UI) |
| **WCAG 2.1 AA** | Not applicable (no new UI components) |
| **`content/{type}/{slug}.{locale}.mdx` filename suffix pattern** | Agent filenames must follow `[slug].en.mdx` / `[slug].pt.mdx`; parity check enforces it |
| **No external CMS for v1 — MDX in repo** | Exactly what this phase implements |
| **Theme tokens via CSS variables** | Not applicable (no new UI) |

---

## Sources

### Primary (HIGH confidence)
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference) — `--print`, `--permission-mode`, `--allowedTools`, `--model`, `--no-session-persistence`, `--bare` flags
- [Claude Code Headless/Non-interactive docs](https://code.claude.com/docs/en/headless) — `claude -p` patterns, `--permission-mode acceptEdits`, piping, file writes
- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions) — `anthropics/claude-code-action@v1` usage, `ANTHROPIC_API_KEY` setup, model configuration
- [GitHub Actions: Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows) — cron syntax, `*/5` day-of-month behavior, minimum 5-minute interval
- [GitHub Actions: Controlling permissions for GITHUB_TOKEN](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token) — `contents: write`, `pull-requests: write`
- `src/lib/mdx/schema.ts` — exact `BlogFrontmatter` Zod schema (verified by codebase inspection)
- `scripts/check-mdx-content.mjs` — exact frontmatter validation logic, FILE_PATTERN regex, parity check (verified by codebase inspection)
- `.github/workflows/ci.yml` — existing CI structure, `pnpm verify:posts` invocation pattern (verified by codebase inspection)
- `npm view @anthropic-ai/claude-code version` → `2.1.140` (verified 2026-05-13)

### Secondary (MEDIUM confidence)
- [SmartScope: Claude Code Scheduled Automation Guide](https://smartscope.blog/en/generative-ai/claude/claude-code-scheduled-automation-guide/) — example workflow YAML patterns for scheduled automation
- [Medium: Automate Documentation with Claude Code & GitHub Actions](https://medium.com/@fra.bernhardt/automate-your-documentation-with-claude-code-github-actions-a-step-by-step-guide-2be2d315ed45) — permission patterns (`contents: write`, `pull-requests: write`), allowed tools approach

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via npm registry, official Claude Code docs, existing `ci.yml` patterns
- Architecture: HIGH — built from verified CLI flags + codebase inspection of schema and validation script
- Pitfalls: HIGH — derived from codebase inspection (frontmatter parser, FILE_PATTERN regex) + official docs (permission modes)
- Prompt engineering guidance: MEDIUM — based on known LLM generation failure modes + schema constraints; exact prompt needs iteration

**Research date:** 2026-05-13
**Valid until:** 2026-08-13 (stable infrastructure domain; `@anthropic-ai/claude-code` releases frequently — re-verify CLI flags if more than 30 days pass before implementation)
