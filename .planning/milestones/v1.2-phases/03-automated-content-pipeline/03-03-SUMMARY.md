---
phase: 03-automated-content-pipeline
plan: "03"
subsystem: infra
tags: [github-actions, openai, gpt-4o, mdx, ci-cd, secrets, workflow-dispatch]

# Dependency graph
requires:
  - phase: 03-automated-content-pipeline plan 02
    provides: generate-post.yml workflow + verify:posts CI gate + prompt template
  - phase: 03-automated-content-pipeline plan 01
    provides: blog MDX pipeline, topic_sequence, .pipeline-state.json schema
provides:
  - Verified end-to-end automated bilingual blog post pipeline (OpenAI gpt-4o)
  - scripts/generate-post-openai.mjs replacing claude CLI invocation
  - content/projects-context/ committed (5 raw project context files)
  - GitHub Actions repo setting enabled (Actions can create PRs)
  - OPENAI_API_KEY secret active in repo
  - First successful workflow_dispatch run: PR created with two MDX files + updated .pipeline-state.json
affects: [blog, content-pipeline, ci]

# Tech tracking
tech-stack:
  added: [OpenAI Node SDK (gpt-4o via scripts/generate-post-openai.mjs), content/projects-context/]
  patterns:
    - "===FILE:/===ENDFILE delimiter scheme for parsing multi-file model output from plain text"
    - "system-prompt override of 'Write tool' instruction to redirect model output to text format"
    - "max_tokens: 6000 calibrated for bilingual post (~2400 words + structure tokens)"

key-files:
  created:
    - scripts/generate-post-openai.mjs
    - content/projects-context/ (5 files)
  modified:
    - .github/workflows/generate-post.yml (removed Install Claude CLI step, added call to generate-post-openai.mjs with OPENAI_API_KEY)

key-decisions:
  - "OpenAI gpt-4o used instead of Claude CLI: Anthropic account had no credits; OpenAI key available as immediate fallback"
  - "===FILE:/===ENDFILE delimiter scheme: robust parsing of multi-file model output without tool calls"
  - "system prompt overrides Write-tool instruction from prompt template to redirect output to text format"
  - "max_tokens: 6000 — bilingual post ~2400 words + structure tokens fits with margin"

patterns-established:
  - "Model output parsed via ===FILE: path===...===ENDFILE=== delimiters; resilient to whitespace and markdown fences"

requirements-completed: [PIPE-01, PIPE-04, PIPE-05]

# Metrics
duration: ~90min (human checkpoint tasks — async over two sessions)
completed: "2026-05-15"
---

# Phase 3 Plan 03: Human Enablement — OpenAI Pipeline Verified Summary

**OpenAI gpt-4o pipeline verified end-to-end: repo settings enabled, OPENAI_API_KEY wired, first workflow_dispatch produced a bilingual MDX PR with passing CI**

## Performance

- **Duration:** ~90 min (two human-checkpoint tasks across async sessions)
- **Started:** 2026-05-13
- **Completed:** 2026-05-15
- **Tasks:** 2 (both human-action checkpoints)
- **Files modified:** 3 (generate-post.yml, scripts/generate-post-openai.mjs, content/projects-context/)

## Accomplishments

- GitHub repo setting "Allow GitHub Actions to create and approve pull requests" enabled — unblocks `gh pr create` with GITHUB_TOKEN
- OPENAI_API_KEY secret added to repository (replaces ANTHROPIC_API_KEY — Anthropic account had no credits)
- generate-post.yml updated: removed Install Claude CLI step; now calls `node scripts/generate-post-openai.mjs` with OPENAI_API_KEY
- scripts/generate-post-openai.mjs created: ESM Node.js script calling OpenAI gpt-4o, parsing ===FILE:/===ENDFILE delimited output, writing both locale MDX files and updating .pipeline-state.json
- content/projects-context/ (5 project context files) committed as raw generation material
- First manual workflow_dispatch succeeded: PR opened with `content/blog/nextjs-react-frontend-*.en.mdx`, `content/blog/nextjs-react-frontend-*.pt.mdx`, and updated .pipeline-state.json; pnpm verify:posts passed; CI green
- Scheduled cron active — will fire automatically every 5 days without further setup

## Task Commits

These tasks were human-action checkpoints — no automated commits produced by this plan. Supporting code changes were committed as part of this plan's execution:

1. **Task 1: Enable repo settings + OPENAI_API_KEY secret** — human action (GitHub UI), no commit
2. **Task 2: Trigger manual workflow_dispatch + verify PR end-to-end** — human action + OpenAI pivot, commits: `fcab78a` (docs: update plan files with project-context task and PROJECTS_CONTEXT integration)

The generate-post-openai.mjs and updated workflow were committed during plan execution before the final human verify step.

## Files Created/Modified

- `.github/workflows/generate-post.yml` — removed Install Claude CLI step; now invokes `node scripts/generate-post-openai.mjs` with OPENAI_API_KEY
- `scripts/generate-post-openai.mjs` — ESM Node.js script: calls OpenAI Chat Completions API (gpt-4o, max_tokens: 6000), parses ===FILE:/===ENDFILE multi-file output, writes locale MDX files, updates .pipeline-state.json
- `content/projects-context/` — 5 raw project context files used as generation material (injected into OpenAI prompt)

## Decisions Made

1. **OpenAI gpt-4o over Claude CLI** — Anthropic account had no credits at time of execution; OpenAI key was available immediately. The script is structurally equivalent (prompt in → multi-file text out → parse → write). Migration path back to Claude API is straightforward.

2. **===FILE:/===ENDFILE delimiter scheme** — Robust parsing of multi-file model output without requiring tool calls or JSON mode. The model outputs plain text with file path headers; the script splits on delimiters and writes each block. Resilient to markdown fences and whitespace.

3. **system prompt override** — The prompt template was authored expecting a Write-tool invocation (Claude CLI). For OpenAI text completion, the system prompt instructs the model to output text using the delimiter format instead. No changes to the prompt file itself.

4. **max_tokens: 6000** — Calibrated for a bilingual post (~2400 words across both locales) plus frontmatter structure tokens. Provides headroom without hitting OpenAI rate limits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced Claude CLI with OpenAI API call**
- **Found during:** Task 1 (when attempting to add ANTHROPIC_API_KEY secret)
- **Issue:** Anthropic account had no API credits — ANTHROPIC_API_KEY would authenticate but every Claude CLI call would fail with a billing error, making the workflow non-functional
- **Fix:** Created `scripts/generate-post-openai.mjs` (ESM Node.js, OpenAI SDK, gpt-4o, ===FILE: delimiter parsing); updated `generate-post.yml` to remove Install Claude CLI step and instead run `node scripts/generate-post-openai.mjs`; committed `content/projects-context/` as generation context files; updated plan docs
- **Files modified:** `.github/workflows/generate-post.yml`, `scripts/generate-post-openai.mjs` (created), `content/projects-context/` (created)
- **Verification:** Manual workflow_dispatch run completed successfully; PR opened with two valid MDX files; pnpm verify:posts passed; CI green; user confirmed "approved"
- **Committed in:** `fcab78a`

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking: no Anthropic credits)
**Impact on plan:** Required pivoting the generation engine from Claude CLI to OpenAI gpt-4o. All plan goals achieved: bilingual post generated, CI validated, PR opened, cron active. No scope creep. Migration path back to Claude API is one script swap.

## Issues Encountered

- Anthropic account had no API credits at execution time — the workflow would authenticate with ANTHROPIC_API_KEY but fail at every generation call. Resolved by pivoting to OpenAI gpt-4o (Rule 3 auto-fix). The pivot required creating a new generation script and updating the workflow, but the overall pipeline contract (prompt in → bilingual MDX out → PR) was unchanged.

## User Setup Required

The following were completed during this plan execution:

- **GitHub Actions PR creation setting:** Repository Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests" — checked and saved
- **OPENAI_API_KEY secret:** Repository Settings → Secrets and variables → Actions → `OPENAI_API_KEY` added

No further external service configuration is required. The cron trigger is active.

## Next Phase Readiness

- Automated bilingual blog post pipeline is fully operational — cron fires every 5 days, opens a PR with two MDX files, CI validates frontmatter parity via pnpm verify:posts
- The human review gate (PR checklist + manual merge) is in place before any post is published to main
- Phase 3 (Automated Content Pipeline) is **complete** — all three plans shipped
- Forward risk: generate-post-openai.mjs uses OpenAI gpt-4o; if the OpenAI key expires or quota is exceeded, the workflow will fail at the Generate step with a non-zero exit code and the assert-files step will surface it clearly
- Migration path back to Claude API: replace `scripts/generate-post-openai.mjs` with a Claude SDK equivalent; workflow change is one line (env var name + script name)

---
*Phase: 03-automated-content-pipeline*
*Completed: 2026-05-15*
