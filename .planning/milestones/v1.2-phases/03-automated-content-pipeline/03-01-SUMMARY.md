---
phase: 03-automated-content-pipeline
plan: "01"
subsystem: content-pipeline
tags:
  - content
  - mdx
  - automation
  - blog
dependency_graph:
  requires: []
  provides:
    - content/blog/.pipeline-state.json
    - scripts/generate-post-prompt.md
    - content/projects-context/*.md
  affects:
    - .github/workflows/generate-post.yml (Plan 03-02 reads these artifacts)
tech_stack:
  added: []
  patterns:
    - JSON state file committed to repo for topic rotation tracking
    - External prompt file read via $(cat ...) for YAML-escape-free prompt editing
    - Project context pool (content/projects-context/*.md) injected into generation prompt
key_files:
  created:
    - content/blog/.pipeline-state.json
    - scripts/generate-post-prompt.md
    - content/projects-context/doacao.md
    - content/projects-context/mtg-price.md
    - content/projects-context/notificame.md
    - content/projects-context/pansarinitech.md
    - content/projects-context/touchdown-foot.md
  modified: []
decisions:
  - "topic_sequence canonical order locked: nextjs-react-frontend, software-engineering-career, ai-in-development, personal-projects-open-source (first run picks index 0 after null)"
  - "External prompt file (scripts/generate-post-prompt.md) chosen over heredoc in YAML — editable without YAML escaping, reviewable independently in PRs"
  - "Project context stub files left uncommitted — Luiz must enrich with real learnings before first pipeline run"
  - "pansarinitech.md pre-seeded with portfolio-specific learnings (OKLCH contrast fix, AnimatePresence jsdom stub, next-intl localePrefix) from existing codebase knowledge"
metrics:
  duration_seconds: 480
  completed_date: "2026-05-13"
  tasks_completed: 3
  files_created: 7
  files_modified: 0
---

# Phase 3 Plan 1: Pipeline Static Artifacts Summary

**One-liner:** Bootstrap artifacts for the automated blog pipeline — topic rotation state file, external generation prompt with excerpt/JS/date constraints, and 5 project context stubs for the agent to draw from.

---

## What Was Built

Three categories of static artifacts were created:

**Topic rotation state (`content/blog/.pipeline-state.json`)** — committed to the repo so topic state is tracked atomically with each PR. Initial state: `last_topic: null`, `run_count: 0`, `last_run_date: null`, and the four-topic sequence. On first workflow run, `null` causes index 0 (`nextjs-react-frontend`) to be selected.

**Generation prompt (`scripts/generate-post-prompt.md`)** — the workflow reads this via `$(cat scripts/generate-post-prompt.md)` and substitutes `${SLUG}`, `${TODAY}`, `${TOPIC}`, `${PROJECTS_CONTEXT}`, and `${STYLE_REF}` before calling `claude -p`. The prompt contains seven sections (ROLE, TASK, TOPIC, FRONTMATTER, CONTENT RULES, PROJECT CONTEXT, STYLE REFERENCE) and explicitly addresses every known generation failure mode:
- Excerpt length: "MUST be between 40 and 280 characters inclusive. Count the characters explicitly." with a concrete 73-char example.
- Date format: Three FORBIDDEN patterns listed (`"May 13, 2026"`, ISO-8601 timestamp, etc.) with exact required format.
- Inline JS: Three FORBIDDEN categories (`{expression}`, `import`, `export`) with explanation that `blockJS: true` strips them silently.
- Slug format: Must match `${SLUG}` exactly — lowercase alphanumeric with hyphens.

**Project context pool (`content/projects-context/*.md`)** — 5 stub files left uncommitted (working tree only) for Luiz to enrich with real learnings before the first pipeline run. The `pansarinitech.md` file was pre-seeded with concrete learnings from the portfolio codebase (OKLCH contrast fix, AnimatePresence jsdom stub pattern, Tailwind v4 CSS-first config). The other 4 files have `[FILL IN]` markers at the learning entries.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create initial .pipeline-state.json | `63d6d98` | `content/blog/.pipeline-state.json` |
| 2 | Create scripts/generate-post-prompt.md | `55493ef` | `scripts/generate-post-prompt.md` |
| 3 | Create content/projects-context/ stub files | (uncommitted per plan) | 5 stub files in `content/projects-context/` |

---

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- Task 3 specified `touchdown-foot.md` which does not correspond to any entry in `src/data/personal-projects.ts` (closest matches are `redzone-boss` and `starlimp`). The file was created per the plan's explicit instruction with `[FILL IN]` placeholders for Luiz to populate. This is by design — the context pool is Luiz's to maintain.

---

## Verification Results

- `node -e "JSON.parse(require('fs').readFileSync('content/blog/.pipeline-state.json','utf8'))"` exits 0
- `grep -c "40 and 280 characters" scripts/generate-post-prompt.md` returns 1
- `grep -c "FORBIDDEN" scripts/generate-post-prompt.md` returns 3
- `grep -c '\${TODAY}' scripts/generate-post-prompt.md` returns 5
- `grep -c '\${SLUG}' scripts/generate-post-prompt.md` returns 4
- `grep -c '\${STYLE_REF}' scripts/generate-post-prompt.md` returns 2
- `grep -c '\${PROJECTS_CONTEXT}' scripts/generate-post-prompt.md` returns 2
- `grep -c '\${TOPIC}' scripts/generate-post-prompt.md` returns 4
- `pnpm verify:posts` passes: `✓ blog: 1 EN / 1 PT (parity ok)` (dotfile and context stubs correctly skipped)

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `[FILL IN: key challenges]` | content/projects-context/doacao.md | Luiz must add real learnings before first pipeline run |
| `[FILL IN: key challenges]` | content/projects-context/mtg-price.md | Luiz must add real learnings before first pipeline run |
| `[FILL IN: key challenges]` | content/projects-context/notificame.md | Luiz must add real learnings before first pipeline run |
| `[FILL IN: other challenges]` | content/projects-context/pansarinitech.md | Partially pre-seeded; Luiz to complete |
| `[FILL IN: all fields]` | content/projects-context/touchdown-foot.md | Project not in personal-projects.ts; Luiz must supply all details |

These stubs do NOT block Plan 03-01's goal (the pipeline infrastructure artifacts exist and are valid). They must be enriched before the first workflow run for the PROJECT CONTEXT injection to have real value.

---

## Threat Flags

None. All files are static config/content committed to the repo. No network endpoints, auth paths, or schema changes introduced. The prompt file contains no secrets — `ANTHROPIC_API_KEY` is injected by the workflow via GitHub Actions secrets, not embedded in this file.

---

## Self-Check: PASSED

- `content/blog/.pipeline-state.json` exists: FOUND
- `scripts/generate-post-prompt.md` exists: FOUND
- `content/projects-context/doacao.md` exists: FOUND
- `content/projects-context/mtg-price.md` exists: FOUND
- `content/projects-context/notificame.md` exists: FOUND
- `content/projects-context/pansarinitech.md` exists: FOUND
- `content/projects-context/touchdown-foot.md` exists: FOUND
- Commit `63d6d98` (Task 1): FOUND
- Commit `55493ef` (Task 2): FOUND
