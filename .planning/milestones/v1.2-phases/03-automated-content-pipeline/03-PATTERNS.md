# Phase 3: Automated Content Pipeline — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 3 new files
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.github/workflows/generate-post.yml` | workflow/config | event-driven (schedule + dispatch) | `.github/workflows/ci.yml` | role-match (different trigger) |
| `content/blog/.pipeline-state.json` | state file | batch (read-then-write per run) | no code analog — schema defined in RESEARCH.md | no analog |
| `content/blog/<slug>.en.mdx` + `content/blog/<slug>.pt.mdx` | content (MDX) | batch (agent writes both at once) | `content/blog/building-this-portfolio.en.mdx` + `building-this-portfolio.pt.mdx` | exact |

---

## Pattern Assignments

### `.github/workflows/generate-post.yml` (workflow, event-driven)

**Analog:** `.github/workflows/ci.yml`

**Trigger + permissions pattern** (ci.yml lines 1–11 as negative reference; new pattern differs):

```yaml
# ci.yml uses pull_request + push; generate-post.yml uses schedule + workflow_dispatch
# Copy this block structure, substitute trigger events and add permissions block

name: Generate Blog Post

on:
  schedule:
    - cron: "0 9 */5 * *"    # ~every 5 days at 09:00 UTC (days 1, 6, 11, 16, 21, 26, 31)
  workflow_dispatch:           # manual on-demand trigger from GitHub Actions UI

jobs:
  generate-post:
    runs-on: ubuntu-latest
    timeout-minutes: 15        # ci.yml uses 8; content generation needs more runway
    permissions:
      contents: write          # required for git push (branch creation)
      pull-requests: write     # required for gh pr create
```

**Node + pnpm setup pattern** (ci.yml lines 14–27 — copy verbatim):

```yaml
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install (frozen lockfile)
        run: pnpm install --frozen-lockfile
```

**pnpm verify invocation pattern** (ci.yml lines 58–61 — reuse exact command):

```yaml
      - name: Verify blog content (parity + Zod)
        run: pnpm verify:posts
```

**Upload artifact on failure pattern** (ci.yml lines 124–130 — adapt for generated files):

```yaml
      - name: Upload generated files on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: generated-post-debug
          path: content/blog/
          retention-days: 7
```

**New steps with no ci.yml analog** (copy from RESEARCH.md code examples):

```yaml
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
          LAST=$(node -e "
            const fs = require('fs');
            const state = fs.existsSync('content/blog/.pipeline-state.json')
              ? JSON.parse(fs.readFileSync('content/blog/.pipeline-state.json', 'utf8'))
              : { last_topic: null };
            console.log(state.last_topic || 'null');
          ")
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
          claude -p "..." \
            --permission-mode acceptEdits \
            --allowedTools "Read,Write,Edit,Bash(git status)" \
            --no-session-persistence \
            --model claude-sonnet-4-6

      - name: Assert generated files exist
        env:
          SLUG: ${{ steps.topic.outputs.slug }}
        run: |
          test -f "content/blog/${SLUG}.en.mdx" || { echo "ERROR: EN file not generated"; exit 1; }
          test -f "content/blog/${SLUG}.pt.mdx" || { echo "ERROR: PT file not generated"; exit 1; }

      - name: Create branch and commit
        env:
          SLUG: ${{ steps.topic.outputs.slug }}
          TODAY: ${{ steps.topic.outputs.today }}
          TOPIC: ${{ steps.topic.outputs.topic }}
        run: |
          BRANCH="content/auto-post-$(date -u +%Y-%m-%d-%H%M)"
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

**Key divergences from ci.yml:**
- ci.yml has no `permissions:` block (uses default read-only); generate-post.yml must declare `contents: write` + `pull-requests: write` explicitly
- ci.yml has no external secret usage beyond `GITHUB_TOKEN`; generate-post.yml requires `ANTHROPIC_API_KEY` as a manually-added repo secret
- Branch-name collision guard: use `date -u +%Y-%m-%d-%H%M` (not just date) so same-day `workflow_dispatch` re-runs don't conflict — RESEARCH.md Pitfall 5

---

### `content/blog/.pipeline-state.json` (state file, batch)

**No codebase analog.** This is the first machine-managed state file in the repo. Use the schema defined in RESEARCH.md Pattern 4 directly.

**Initial state to commit** (RESEARCH.md lines 514–527):

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

**Field semantics:**
- `last_topic` — string key of last-used topic slug; `null` on first run (next topic = index 0 = `nextjs-react-frontend`)
- `run_count` — integer counter incremented by each agent run; useful for slug uniqueness and debugging
- `last_run_date` — ISO date `YYYY-MM-DD`; records when last post was generated
- `topic_sequence` — canonical order array; agent reads this to compute `next_topic = sequence[(sequence.indexOf(last_topic) + 1) % 4]`

**Validation note:** This file is not validated by `pnpm verify:posts` (the check-mdx-content.mjs `FILE_PATTERN` regex `/^([a-z0-9-]+)\.(en|pt)\.mdx$/` skips all non-MDX files). The `.` prefix also makes it invisible to standard directory listings. The workflow must explicitly `git add content/blog/.pipeline-state.json` — it will not be staged by wildcard patterns.

---

### `content/blog/<slug>.en.mdx` + `content/blog/<slug>.pt.mdx` (content/MDX, batch)

**Analog:** `content/blog/building-this-portfolio.en.mdx` (lines 1–13) and `content/blog/building-this-portfolio.pt.mdx` (lines 1–13)

**Frontmatter pattern — EN** (building-this-portfolio.en.mdx lines 1–13, exact shape to replicate):

```yaml
---
title: "Building this portfolio"
date: "2026-05-02"
excerpt: "Architectural diary of a bilingual, mobile-first, AA-accessible portfolio. Stack rationale, contrast fixes, MDX factory pattern, and what got cut."
tags:
  - nextjs
  - tailwind
  - i18n
  - mdx
  - biome
  - accessibility
draft: false
---
```

**Frontmatter pattern — generated posts** (same shape, different values per D-09):

```yaml
---
title: "<title in English>"
date: "<TODAY injected by workflow, format YYYY-MM-DD>"
excerpt: "<substantive 40–280 char summary — agent must count chars, minimum 40>"
tags:
  - <tag1>
  - <tag2>
draft: true
---
```

**Frontmatter pattern — PT** (building-this-portfolio.pt.mdx lines 1–13):

```yaml
---
title: "Construindo este portfolio"
date: "2026-05-02"
excerpt: "Diário arquitetural de um portfolio bilíngue, mobile-first e acessível AA. Justificativa de stack, correções de contraste, padrão fábrica MDX e o que ficou de fora."
tags:
  - nextjs
  - tailwind
  - i18n
  - mdx
  - biome
  - accessibility
draft: false
---
```

**Voice and structure pattern** (building-this-portfolio.en.mdx — characteristic traits to embed in the agent prompt):
- Sections introduced with `## Heading` (H2 only; no H1 — the page template renders the title)
- Direct, low-fluff sentences: "This is not a 'look at my pretty hover effects' post."
- Technical precision: exact values cited ("oklch(54% 0.21 28)", "3.67:1", "80ms")
- First-person past tense for decisions: "We did both.", "I never looked back."
- Bold for key terms inline: `**Next.js 16.2 with the App Router**`
- Code spans for tool names, file paths, config keys: `` `useActionState` ``, `` `globals.css` ``
- Fenced code blocks only when showing actual code — rare in the existing post
- No bullet lists at top level; narrative paragraphs preferred
- PT version is written to read naturally in Brazilian Portuguese, not word-for-word translated (compare `.en.mdx` vs `.pt.mdx` — notice "I never looked back" → "nunca olhei para trás", rewritten as natural BR idiom)

**Validation constraints the agent must satisfy** (from check-mdx-content.mjs lines 123–141):
- `title`: `typeof data.title === 'string' && data.title.length >= 1`
- `date`: regex `/^\d{4}-\d{2}-\d{2}$/` — exactly 10 chars, no time component; inject `TODAY` from the workflow step
- `excerpt`: `data.excerpt.length >= 40 && data.excerpt.length <= 280` — agent must explicitly count; excerpts under 40 chars are the #1 CI failure mode
- `tags`: optional; if present must be string array
- `draft`: boolean; generated posts always write `true`
- No inline JS expressions: `{value}`, `import`, `export` — blocked at render by `next-mdx-remote@6` `blockJS: true`

**Slug constraints** (check-mdx-content.mjs line 25):
- FILE_PATTERN: `/^([a-z0-9-]+)\.(en|pt)\.mdx$/`
- Slugs must be lowercase alphanumeric with hyphens only
- The workflow shell step should normalize: `slug=$(echo "$NEXT_TOPIC-$(date -u +%Y%m%d)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')`

---

## Shared Patterns

### Workflow Environment Setup
**Source:** `.github/workflows/ci.yml` lines 14–27
**Apply to:** `generate-post.yml` — copy these steps verbatim before installing Claude CLI

```yaml
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install (frozen lockfile)
        run: pnpm install --frozen-lockfile
```

### Frontmatter Validation Gate
**Source:** `.github/workflows/ci.yml` line 60; `scripts/check-mdx-content.mjs`
**Apply to:** `generate-post.yml` step after file generation, before branch/PR creation

```yaml
      - name: Verify blog content (Phase 4 BLOG-01..04 parity + Zod)
        run: pnpm verify:posts
```

This runs `scripts/check-mdx-content.mjs --kind=posts`, which:
1. Scans `content/blog/` for files matching `/^([a-z0-9-]+)\.(en|pt)\.mdx$/`
2. Checks bilingual parity — both `.en.mdx` and `.pt.mdx` must exist for every slug
3. Validates frontmatter shape against `validatePostFrontmatter()` (title, date regex, excerpt 40–280, tags array, draft boolean)
4. Exits 1 on any violation, preventing PR creation

### BlogFrontmatter Zod Schema (authoritative shape)
**Source:** `src/lib/mdx/schema.ts` lines 24–30
**Apply to:** Generated MDX frontmatter must satisfy this schema exactly

```typescript
export const BlogFrontmatter = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  excerpt: z.string().min(40).max(280),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});
```

### Git Identity Configuration
**Source:** No existing analog — required for all workflows that commit
**Apply to:** `generate-post.yml` before any `git commit` step

```bash
git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `content/blog/.pipeline-state.json` | state file | batch (read-then-write) | No machine-managed state files exist in the repo; first one |

---

## Critical Anti-Patterns (from RESEARCH.md)

These are patterns to explicitly avoid when writing the plan actions:

| Anti-Pattern | Why | Correct Pattern |
|---|---|---|
| Missing `--permission-mode acceptEdits` in `claude -p` call | Without it, file writes silently hang in non-interactive mode | Always include `--permission-mode acceptEdits --allowedTools "Read,Write,Edit,..."` |
| Branch name `content/auto-post-YYYY-MM-DD` (date only) | Collides on same-day `workflow_dispatch` re-runs | Use `content/auto-post-$(date -u +%Y-%m-%d-%H%M)` |
| Slug with uppercase or special characters | FILE_PATTERN regex `/^([a-z0-9-]+)\.(en|pt)\.mdx$/` silently skips the file — parity check reports "0 posts" | Force normalization: `tr '[:upper:]' '[:lower:]' \| sed 's/[^a-z0-9-]/-/g'` |
| `git add content/blog/*.mdx` without adding `.pipeline-state.json` explicitly | Glob won't match dotfiles; state update is omitted from commit | `git add "content/blog/${SLUG}.en.mdx" "content/blog/${SLUG}.pt.mdx" "content/blog/.pipeline-state.json"` |
| Excerpt under 40 chars | `pnpm verify:posts` exits 1; most common LLM generation failure | Prompt must say: "excerpt MUST be 40–280 characters — count them; minimum 40" |
| `date: "May 13, 2026"` or ISO-8601 with time component | Fails regex `/^\d{4}-\d{2}-\d{2}$/` | Inject `TODAY=$(date -u +%Y-%m-%d)` as env var before `claude -p` call |
| Missing repo setting "Allow GitHub Actions to create PRs" | `gh pr create` fails: "GitHub Actions is not permitted to create or approve pull requests" | One-time manual toggle in repo Settings → Actions → General (Wave 0 task) |

---

## Metadata

**Analog search scope:** `.github/workflows/`, `content/blog/`, `scripts/`, `src/lib/mdx/`
**Files scanned:** 7 (ci.yml, lighthouse.yml, building-this-portfolio.en.mdx, building-this-portfolio.pt.mdx, check-mdx-content.mjs, schema.ts, check-data.ts)
**Pattern extraction date:** 2026-05-13
