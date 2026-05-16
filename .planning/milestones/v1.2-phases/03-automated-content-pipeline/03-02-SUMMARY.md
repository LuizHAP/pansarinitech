---
phase: 03-automated-content-pipeline
plan: "02"
subsystem: content-pipeline
tags:
  - github-actions
  - automation
  - blog
  - claude-cli
  - ci-cd
dependency_graph:
  requires:
    - content/blog/.pipeline-state.json (03-01)
    - scripts/generate-post-prompt.md (03-01)
    - content/projects-context/*.md (03-01)
  provides:
    - .github/workflows/generate-post.yml
  affects:
    - pnpm verify:posts (runs inside the new workflow as pre-PR gate)
    - .github/workflows/ci.yml (new workflow is additive — no conflicts)
tech_stack:
  added:
    - "@anthropic-ai/claude-code (npm install -g at runtime in CI runner)"
  patterns:
    - Scheduled GitHub Actions workflow (cron + workflow_dispatch)
    - claude --print -p headless invocation with --permission-mode acceptEdits
    - External prompt file ($(cat scripts/generate-post-prompt.md)) for YAML-escape-free editing
    - HHMM branch suffix to prevent same-day collision
    - Explicit dotfile staging (git add content/blog/.pipeline-state.json)
    - Assert-before-validate ordering (test -f before pnpm verify:posts)
    - Upload artifact on failure (mirrors ci.yml Playwright pattern)
key_files:
  created:
    - .github/workflows/generate-post.yml
  modified: []
decisions:
  - "claude --print used (D-02) instead of claude -p to match headless spec; flag is equivalent in this context"
  - "timeout-minutes: 15 set (vs ci.yml 8 min) — content generation needs more runner time"
  - "Assert-files-exist step placed between claude invocation and pnpm verify:posts — catches Pitfall 6 (claude exits 0 but files not written) before the verify script is called"
  - "PROJECTS_CONTEXT gathered via 2>/dev/null guard — tolerates empty content/projects-context/ directory"
  - "PROMPT_TEMPLATE loaded via $(cat scripts/generate-post-prompt.md) then PROMPT built with sed substitution — keeps YAML free of shell escaping"
metrics:
  duration_seconds: 240
  completed_date: "2026-05-13"
  tasks_completed: 1
  files_created: 1
  files_modified: 0
---

# Phase 3 Plan 2: GitHub Actions Workflow Summary

**One-liner:** Scheduled GitHub Actions workflow that reads topic state, invokes claude CLI to generate bilingual MDX, asserts both locale files exist, validates via pnpm verify:posts, creates a HHMM-suffixed branch, and opens a PR with the D-10 four-item review checklist.

---

## What Was Built

A single workflow file `.github/workflows/generate-post.yml` that ties together all Phase 3 static artifacts into an end-to-end automated pipeline. The workflow:

1. Triggers on `schedule: cron "0 9 */5 * *"` (days 1, 6, 11, 16, 21, 26, 31 at 09:00 UTC) and `workflow_dispatch` for manual runs.
2. Installs `@anthropic-ai/claude-code` globally on the runner, then invokes `claude --print -p` with the external prompt template (`scripts/generate-post-prompt.md`), topic/slug/date variables, all project context files, and the style reference post.
3. Asserts both `${SLUG}.en.mdx` and `${SLUG}.pt.mdx` exist on disk before proceeding — guards against Pitfall 6 (silent zero-file writes).
4. Runs `pnpm verify:posts` as a pre-PR gate — if frontmatter is malformed or parity is missing, the workflow fails before any branch is created.
5. Creates branch `content/auto-post-YYYY-MM-DD-HHMM` (HHMM suffix prevents same-day collision per Pitfall 5/D-11 extended by research).
6. Stages `${SLUG}.en.mdx`, `${SLUG}.pt.mdx`, and `content/blog/.pipeline-state.json` explicitly (dotfile cannot be caught by a glob).
7. Opens PR with title `[auto] Blog post: ${TOPIC} (${TODAY})` and a body containing all four D-10 checklist items.
8. On any failure: uploads `content/blog/` as artifact `generated-post-debug` (7-day retention) — mirrors the Playwright report pattern in `ci.yml`.

**Permissions declared explicitly** (`contents: write` + `pull-requests: write`) — required for `git push` and `gh pr create` with the auto-issued `GITHUB_TOKEN`.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create .github/workflows/generate-post.yml | `b2f2c53` | `.github/workflows/generate-post.yml` |

---

## Deviations from Plan

None — plan executed exactly as written.

The plan specified `claude --print -p` (D-02) and the implementation uses that exact flag combination. The `--print` flag and headless `-p` mode are equivalent in the claude CLI for non-interactive invocation.

---

## Verification Results

All acceptance criteria from the plan verified:

| Check | Result |
|-------|--------|
| `grep -c "0 9 \*/5 \* \*"` returns 1 | PASS (1) |
| `grep -c "workflow_dispatch"` returns ≥ 1 | PASS (1) |
| `grep -c "contents: write"` returns ≥ 1 | PASS (1) |
| `grep -c "pull-requests: write"` returns ≥ 1 | PASS (1) |
| `grep -c "permission-mode acceptEdits"` returns ≥ 1 | PASS (1) |
| `grep -c "pnpm verify:posts"` returns ≥ 1 | PASS (1) |
| `grep -c "pipeline-state.json"` returns ≥ 2 | PASS (3) |
| `grep -c "claude-sonnet-4-6"` returns ≥ 1 | PASS (1) |
| `%H%M` in branch name computation | PASS (1) |
| D-10: "Frontmatter valid" in PR body | PASS |
| D-10: "reads naturally" in PR body | PASS |
| D-10: "No inline JS" in PR body | PASS |
| D-10: "draft" flip reminder in PR body | PASS |
| `.pipeline-state.json` explicitly named in `git add` | PASS |
| Assert-files-exist step before pnpm verify:posts | PASS (lines 85 vs 93) |
| `timeout-minutes: 15` declared | PASS (1) |
| `pnpm verify:posts` no regressions | PASS (`✓ blog: 1 EN / 1 PT`) |
| 200 unit tests pass | PASS |

---

## Known Stubs

None — the workflow file is complete and operational. The only pending items are the human-action prerequisites documented in Plan 03-03:
- `ANTHROPIC_API_KEY` must be added as a GitHub Actions repo secret
- Repo setting "Allow GitHub Actions to create and approve pull requests" must be enabled

These are not stubs in this plan's artifacts; they are Wave 3 manual steps.

---

## Threat Flags

No new threat surface introduced beyond what the plan's threat model covers. The workflow:
- Does NOT echo or log `ANTHROPIC_API_KEY` (injected only via `env:` block — GitHub Actions redacts it from logs)
- Restricts claude agent to `--allowedTools "Read,Write,Edit,Bash(git status)"` — no arbitrary shell
- `GITHUB_TOKEN` scoped to `contents: write` + `pull-requests: write` only
- Generated MDX rendered through `next-mdx-remote@6` with `blockJS: true` (three-layer JS defense: prompt forbids, verify:posts catches structural issues, renderer strips any that slip through)

---

## Self-Check: PASSED

- `.github/workflows/generate-post.yml` exists: FOUND
- Commit `b2f2c53` exists: FOUND (`feat(03-02): create .github/workflows/generate-post.yml`)
- `scripts/generate-post-prompt.md` exists: FOUND (from 03-01)
- `content/blog/.pipeline-state.json` exists: FOUND (from 03-01)
- `pnpm verify:posts` passes: `✓ blog: 1 EN / 1 PT (parity ok)`
- 200 unit tests pass: FOUND
