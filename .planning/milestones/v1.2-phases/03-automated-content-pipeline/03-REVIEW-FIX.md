---
phase: 03-automated-content-pipeline
fixed_at: 2026-05-15T12:00:00Z
review_path: .planning/phases/03-automated-content-pipeline/03-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-05-15T12:00:00Z
**Source review:** .planning/phases/03-automated-content-pipeline/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (Critical: 3, Warning: 5; Info excluded per fix_scope=critical_warning)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: Model-controlled file paths written without an allowlist (path traversal)

**Files modified:** `scripts/generate-post-openai.mjs`
**Commit:** 8214ed8
**Applied fix:** Added `ALLOWED_PATHS` Set containing only the two MDX locale paths (`enPath`, `ptPath`). The file-writing loop now skips any path not in the allowlist with `console.warn`. Applied after WR-01 so the state file was already removed from model output scope — the allowlist covers only the two MDX files as required.

---

### CR-02: Truncated model response not detected — broken MDX files written silently

**Files modified:** `scripts/generate-post-openai.mjs`
**Commit:** e57d3da
**Applied fix:** Extracted `data.choices?.[0]` into a `choice` variable. Added null check for missing choices array. Added `finish_reason === 'length'` check with actionable error message before reading content. Also raised `max_tokens` from 6000 to 8000.

---

### CR-03: No fetch timeout — script can hang until workflow timeout

**Files modified:** `scripts/generate-post-openai.mjs`
**Commit:** e57d3da
**Applied fix:** Wrapped the `fetch` call in an `AbortController` with a 90-second `setTimeout`. `clearTimeout` is called in the `finally` block after the fetch resolves. The `catch` block checks `err.name === 'AbortError'` and exits with a clear error message. Non-abort errors are re-thrown.

---

### WR-01: Pipeline state written from untrusted model output, not from computed `newState`

**Files modified:** `scripts/generate-post-openai.mjs`
**Commit:** 8214ed8
**Applied fix:** Removed the `===FILE: content/blog/.pipeline-state.json` block from the system prompt. After writing the two MDX files from allowlisted model output, the state file is now written directly from `JSON.stringify(newState, null, 2) + '\n'`. File header comment updated to reflect the two-block (not three-block) model output.

---

### WR-02: Unknown topic in `.pipeline-state.json` silently resets rotation to index 0

**Files modified:** `.github/workflows/generate-post.yml`
**Commit:** 872c8fa
**Applied fix:** Replaced the single-expression `idx` computation with an IIFE that calls `process.exit(1)` with a clear error message when `seq.indexOf(last)` returns `-1`. Unknown topics now fail the workflow explicitly instead of silently resetting to index 0.

---

### WR-03: `fs.readFileSync` on style reference file has no error handling

**Files modified:** `scripts/generate-post-openai.mjs`
**Commit:** 872c8fa
**Applied fix:** Wrapped the `fs.readFileSync('content/blog/building-this-portfolio.en.mdx', 'utf8')` call in a `try/catch`. On error, logs `ERROR: Could not read style reference file: <err.message>` and calls `process.exit(1)`.

---

### WR-04: `String.replace()` with user-sourced content is vulnerable to special replacement patterns

**Files modified:** `scripts/generate-post-openai.mjs`
**Commit:** 872c8fa
**Applied fix:** Changed all five `.replace(regex, string)` calls to use replacer functions (`.replace(regex, () => value)`). This bypasses JavaScript's special `$&`, `` $` ``, `$'` pattern expansion in replacement strings, preventing prompt corruption when content files contain these sequences.

---

### WR-05: No assertion that `.pipeline-state.json` was actually written

**Files modified:** `.github/workflows/generate-post.yml`
**Commit:** b79adec
**Applied fix:** Added `test -f "content/blog/.pipeline-state.json" || { echo "ERROR: pipeline-state.json not written"; exit 1; }` to the "Assert generated files exist" step. Updated the final echo to `"All required files present."` to reflect the three-file assertion.

---

## Skipped Issues

None — all in-scope findings were fixed successfully.

---

_Fixed: 2026-05-15T12:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
