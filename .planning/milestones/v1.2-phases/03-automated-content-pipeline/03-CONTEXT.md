# Phase 3: Automated Content Pipeline - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

A GitHub Actions scheduled workflow runs the `claude` CLI every 5 days (plus on-demand via `workflow_dispatch`) to generate a bilingual (PT + EN) MDX blog post draft. The agent writes both locale files and a topic-state update in a single run, opens a GitHub PR for Luiz to review, and the existing Vercel CI deploy handles publishing on merge. No new routes, no new site UI. The only deliverable this phase puts on the site is *the infrastructure that puts future content there*.

Deliverables:
1. `.github/workflows/generate-post.yml` — scheduled + on-demand workflow using `claude` CLI
2. `content/blog/.pipeline-state.json` — topic rotation state file tracked in repo
3. A sample generated post (to validate the pipeline end-to-end during implementation)

</domain>

<decisions>
## Implementation Decisions

### Scheduling & Triggering (PIPE-01)

- **D-01:** The workflow lives in `.github/workflows/generate-post.yml` and uses **both** `schedule: cron` (approximately every 5 days) **and** `workflow_dispatch` so Luiz can trigger it manually from the GitHub Actions UI without waiting.
- **D-02:** The workflow installs the `claude` CLI (`npm install -g @anthropic-ai/claude-code`) and invokes it as `claude --print -p "..."` with the generation prompt. Requires `ANTHROPIC_API_KEY` stored as a GitHub Actions secret.
- **D-03:** Failure handling = default GitHub Actions behavior — failed runs appear in the Actions tab and trigger the existing email notification. No extra setup needed.

### Content Quality & Voice (PIPE-02, PIPE-06, PIPE-07)

- **D-04:** The agent prompt feeds `content/blog/building-this-portfolio.en.mdx` as a **style reference** so generated posts match Luiz's voice: direct, technical, low-fluff, first-person.
- **D-05:** Target post length: **800–1200 words** per locale. Not word-count-padded — the agent is instructed to write substantive content to that range.
- **D-06:** **Single `claude` invocation** writes both `.en.mdx` and `.pt.mdx` files in one run. The agent maintains internal consistency between the two versions rather than translating after the fact.

### Topic Rotation (PIPE-02, PIPE-06)

- **D-07:** Topic rotation state is tracked in `content/blog/.pipeline-state.json` committed to the repo. The file records the last-used topic so the agent can avoid repeating it consecutively. The four topics rotate round-robin: `nextjs-react-frontend`, `software-engineering-career`, `ai-in-development`, `personal-projects-open-source`.
- **D-08:** The PR includes the updated `.pipeline-state.json` alongside the two MDX files — all three are merged atomically when Luiz approves the PR.

### PR Structure & Review Flow (PIPE-04, PIPE-05)

- **D-09:** Generated posts use **`draft: true`** in frontmatter. The existing blog pipeline (`src/lib/mdx/blog.ts`) gates draft posts in production. Luiz flips `draft: false` before or after merging to publish. This makes the PR safe to merge incrementally — posts won't go live until the flag is flipped.
- **D-10:** The PR body includes a **review checklist**:
  - `[ ]` Frontmatter valid (date, excerpt length, tags)
  - `[ ]` PT version reads naturally — not just a literal translation
  - `[ ]` No inline JS or dynamic imports (next-mdx-remote v6 `blockJS: true`)
  - `[ ]` Flip `draft: false` to publish
- **D-11:** Branch naming convention: `content/auto-post-YYYY-MM-DD` (date-stamped, unique per run).

### Project Context Pool (PIPE-02, PIPE-06)

- **D-12:** Each project in the portfolio has a corresponding `content/projects-context/[project-slug].md` file. The agent reads **all** files in that directory as context when generating posts — surfacing learnings, challenges, and what had to be figured out while building each project. The directory is maintained by Luiz: adding a new project means creating a new context file. The 5 starter files created in Plan 03-01 are stubs for Luiz to fill in before the first run.
  - Projects: `doacao`, `mtg-price`, `notificame`, `pansarinitech`, `touchdown-foot`
  - Format: each file has `## What it does`, `## Key challenges & learnings`, and `## Topics these learnings could feed`
  - The workflow injects all available context files via `PROJECTS_CONTEXT=$(cat content/projects-context/*.md 2>/dev/null || echo "")` before calling `claude`

### Claude's Discretion

- Exact cron expression for "every 5 days" — e.g., `0 9 */5 * *` or similar; month-boundary behavior is acceptable
- Which Claude model to use in the workflow (Haiku for cost, Sonnet for quality — tradeoff is implementation's call)
- Full prompt structure and system message content beyond the style-reference file
- Slug generation from topic area
- Whether to run `pnpm verify:posts` inside the workflow (after generation, before PR creation) to catch bad frontmatter automatically — Claude should do this if it fits the workflow cleanly
- Schema for `.pipeline-state.json` fields beyond `last_topic`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/ROADMAP.md` §"Phase 3: Automated Content Pipeline" — Goal, Success Criteria, PIPE-01 through PIPE-07
- `.planning/REQUIREMENTS.md` §PIPE-01 through PIPE-07 — Full requirement text

### Blog content schema (agent output must satisfy this)
- `src/lib/mdx/schema.ts` — `BlogFrontmatter` Zod schema: `title`, `date (YYYY-MM-DD)`, `excerpt (40-280 chars)`, `tags[]`, `draft (boolean)` — generated posts must pass validation against this
- `src/lib/mdx/blog.ts` — Draft post gating logic (`draft: true` posts hidden in production via NODE_ENV check)

### Style reference for agent prompt
- `content/blog/building-this-portfolio.en.mdx` — Only existing blog post; agent uses this as voice/style reference in its prompt

### CI pipeline (new workflow must integrate cleanly)
- `.github/workflows/ci.yml` — Existing CI; runs `pnpm verify:posts` on every PR — generated posts will be validated automatically on PR open. New workflow must not conflict.

### Bilingual file structure pattern
- `content/blog/` — Existing directory; pattern is `[slug].en.mdx` + `[slug].pt.mdx` side by side

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-mdx-content.mjs` — Existing verification script that the `pnpm verify:posts` command calls. The new workflow can invoke `pnpm verify:posts` after generation to validate frontmatter before opening the PR.
- `gh` CLI — GitHub CLI is available in GitHub Actions runners by default; use it to create branches and open PRs without needing extra setup.

### Established Patterns
- Bilingual MDX file structure: `content/blog/[slug].[locale].mdx` — two files per post, same slug, different locale suffix
- `BlogFrontmatter` shape: `title`, `date`, `excerpt`, `tags[]`, `draft` — exact field names from `src/lib/mdx/schema.ts`
- CI gate: `pnpm verify:posts` runs on every PR and fails on malformed frontmatter or missing locale pair — generated posts must produce clean output here

### Integration Points
- `.github/workflows/` — New `generate-post.yml` added here; must not conflict with `ci.yml` or `lighthouse.yml`
- `content/blog/` — Agent writes new MDX files here; `content/blog/.pipeline-state.json` also lives here
- `ANTHROPIC_API_KEY` — Must be added as a GitHub Actions secret (repo settings); the workflow fails without it

</code_context>

<specifics>
## Specific Ideas

- The agent prompt should include the content of `building-this-portfolio.en.mdx` inline (or via file path if the claude CLI supports reading files) so it can pattern-match the voice and structure.
- PR title convention: `[auto] Blog post: [topic-area] (YYYY-MM-DD)` — clearly marks automated PRs.
- The `.pipeline-state.json` should be initialized with a sensible starting state (e.g., `last_topic: null`, `run_count: 0`) during the first workflow run if it doesn't exist yet.
- `draft: true` in generated frontmatter is the safe default; the checklist in the PR body reminds Luiz to flip it before or after merging.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-automated-content-pipeline*
*Context gathered: 2026-05-13*
