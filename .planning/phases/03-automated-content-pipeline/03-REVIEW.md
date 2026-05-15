---
phase: 03-automated-content-pipeline
reviewed: 2026-05-15T14:45:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - .github/workflows/generate-post.yml
  - scripts/generate-post-openai.mjs
  - scripts/generate-post-prompt.md
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: issues_found
---

# Phase 03: Automated Content Pipeline — Code Review Report

**Reviewed:** 2026-05-15T14:45:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

This phase ships a GitHub Actions cron workflow that calls OpenAI gpt-4o to generate bilingual MDX blog posts and opens a pull request. The overall approach is sound: environment variable validation is present, the dual-locale assertion step is correct, and the pipeline state fallback logic handles a missing state file gracefully.

Three blockers require fixes before this ships. The most serious is that the file-writing loop in `generate-post-openai.mjs` accepts every path the model returns without an allowlist check — a compromised or misbehaving model response could instruct the script to write files outside `content/blog/`. The second is the absence of a `finish_reason` check, meaning a truncated model response (OpenAI stops mid-output at the `max_tokens` ceiling) passes silently and produces broken MDX files that may only fail at the Zod verification step with a confusing error. The third is the missing fetch timeout, which could leave the script hanging until the 15-minute workflow timeout instead of failing fast with a useful error.

Five warnings cover prompt-injection-adjacent issues, state integrity, and robustness gaps.

---

## Critical Issues

### CR-01: Model-controlled file paths written without an allowlist (path traversal)

**File:** `scripts/generate-post-openai.mjs:147-150`

**Issue:** The file-writing loop iterates over every `===FILE:` block parsed from the model response and writes each to the filesystem without validating the path:

```js
for (const [filePath, content] of Object.entries(blocks)) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
```

`filePath` originates from the model's text output. A jailbroken, manipulated, or simply buggy model response can include `===FILE: .github/workflows/evil.yml` or `===FILE: ../../outside-repo/file` and the script will write those files verbatim. The two MDX assertions (`if (!blocks[enPath])`) do nothing to constrain what extra files the loop writes.

In the GitHub Actions context the ephemeral runner is discarded after the job, so files written outside the `git add` scope are never committed. However, writing an arbitrary file to `.github/workflows/` during the job itself is sufficient for a persistent compromise if a later step (e.g. a future composite action or `act` runner) reads from that directory within the same job. The risk level is currently medium-low due to the ephemeral runner, but the pattern is wrong and should be fixed unconditionally.

**Fix:** Validate every parsed path against an explicit allowlist before writing:

```js
const ALLOWED_PATHS = new Set([
  `content/blog/${SLUG}.en.mdx`,
  `content/blog/${SLUG}.pt.mdx`,
  'content/blog/.pipeline-state.json',
]);

for (const [filePath, content] of Object.entries(blocks)) {
  if (!ALLOWED_PATHS.has(filePath)) {
    console.warn(`Skipping unexpected file path from model: ${filePath}`);
    continue;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`Written: ${filePath}`);
}
```

---

### CR-02: Truncated model response not detected — broken MDX files written silently

**File:** `scripts/generate-post-openai.mjs:119`

**Issue:** The script reads the model output but never checks `data.choices[0].finish_reason`. When the model hits `max_tokens: 6000` mid-response, OpenAI sets `finish_reason: "length"` instead of `"stop"`. The truncated output may contain a valid `===FILE: ...en.mdx` block (written early in the response) but a missing or cut-off `===FILE: ...pt.mdx` block — which IS caught by the existing `if (!blocks[ptPath])` guard. However it can also truncate _inside_ a block, producing a syntactically incomplete MDX file that passes the file-existence assertion and may only fail at `pnpm verify:posts` with a Zod parse error, making the root cause non-obvious.

More concretely: at 6000 tokens, two 1200-word posts with frontmatter occupy roughly 4000–4500 tokens, leaving a thin margin. Any model response that is verbose in the EN post will truncate the PT post.

**Fix:** Check `finish_reason` immediately after parsing the response and exit with an actionable error:

```js
const choice = data.choices?.[0];
if (!choice) {
  console.error('ERROR: Empty choices array from OpenAI API');
  process.exit(1);
}
if (choice.finish_reason === 'length') {
  console.error(
    'ERROR: OpenAI response was truncated (finish_reason=length). ' +
    'Increase max_tokens or shorten the prompt.'
  );
  process.exit(1);
}
const output = choice.message?.content ?? '';
```

Also consider raising `max_tokens` to `8000` to give the model more headroom.

---

### CR-03: No fetch timeout — script can hang until workflow timeout

**File:** `scripts/generate-post-openai.mjs:96-110`

**Issue:** The `fetch` call to the OpenAI API has no `AbortSignal` timeout. If the OpenAI endpoint stalls (network issue, slow streaming, or edge-case gpt-4o latency spike), the script will block indefinitely until the workflow's `timeout-minutes: 15` fires. This burns 15 minutes of Actions minutes per stuck run and produces a confusing "timeout" error at the workflow level rather than a clear API error from the script.

**Fix:** Wrap the fetch with an `AbortController` and a reasonable timeout (90 seconds is generous for a non-streaming completion):

```js
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  controller.abort();
}, 90_000); // 90 seconds

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  signal: controller.signal,
  body: JSON.stringify({ ... }),
});
clearTimeout(timeoutId);

if (!response.ok) {
  // existing error handling
}
```

---

## Warnings

### WR-01: Pipeline state written from untrusted model output, not from computed `newState`

**File:** `scripts/generate-post-openai.mjs:66-71, 147-150`

**Issue:** The script correctly computes `newState` (lines 66–71) with the updated `last_topic`, incremented `run_count`, and current date. This value is injected into the system prompt telling the model "output exactly this JSON." However, the actual `.pipeline-state.json` file written to disk comes from whatever the model outputs in its `===FILE: content/blog/.pipeline-state.json` block — not from `newState` directly. The model could output a different `run_count`, a wrong `last_topic`, or additional fields, and the script will write that corrupted state without complaint. A corrupted `last_topic` breaks the topic rotation permanently on the next run.

**Fix:** Write the pipeline state directly from `newState` instead of relying on the model to echo it back. Remove `.pipeline-state.json` from the system prompt's output instructions:

```js
// After parsing and validating the MDX blocks, write state directly:
const enContent = blocks[enPath];
const ptContent = blocks[ptPath];

if (!enContent) { /* ... exit */ }
if (!ptContent) { /* ... exit */ }

fs.mkdirSync('content/blog', { recursive: true });
fs.writeFileSync(enPath, enContent);
fs.writeFileSync(ptPath, ptContent);
fs.writeFileSync(stateFile, JSON.stringify(newState, null, 2) + '\n');
console.log(`Written: ${stateFile}`);
```

This also eliminates the need for the state block in the system prompt, reducing token usage and the attack surface.

---

### WR-02: Unknown topic in `.pipeline-state.json` silently resets rotation to index 0

**File:** `.github/workflows/generate-post.yml:48-52`

**Issue:** The topic rotation uses `seq.indexOf(last)` to find the current position. If `last_topic` in the state file contains a value not present in `seq` (e.g. after a topic is renamed or removed), `indexOf` returns `-1`, and `(-1 + 1) % 4 = 0` — the rotation silently resets to `nextjs-react-frontend` with no warning. This is a silent state corruption that is hard to diagnose.

```js
// Current code — indexOf("unknown") = -1, idx = 0 (silent reset)
const idx = last === null ? 0 : (seq.indexOf(last) + 1) % seq.length;
```

**Fix:** Fail explicitly when an unrecognized topic is detected:

```js
const idx = (() => {
  if (last === null) return 0;
  const found = seq.indexOf(last);
  if (found === -1) {
    process.stderr.write('ERROR: last_topic "' + last + '" not in sequence\n');
    process.exit(1);
  }
  return (found + 1) % seq.length;
})();
```

---

### WR-03: `fs.readFileSync` on style reference file has no error handling

**File:** `scripts/generate-post-openai.mjs:25`

**Issue:** Line 25 reads `content/blog/building-this-portfolio.en.mdx` with no `try/catch`. If this file is renamed, deleted, or temporarily missing (e.g. on a branch where the initial content has not yet been committed), the script throws an uncaught `ENOENT` exception. Node will print a stack trace and exit with a non-zero code, but the error message won't be as clear as the explicit `console.error` / `process.exit(1)` pattern used for every other failure in the script.

**Fix:**
```js
let styleRef;
try {
  styleRef = fs.readFileSync('content/blog/building-this-portfolio.en.mdx', 'utf8');
} catch (err) {
  console.error('ERROR: Could not read style reference file:', err.message);
  process.exit(1);
}
```

---

### WR-04: `String.replace()` with user-sourced content is vulnerable to special replacement patterns

**File:** `scripts/generate-post-openai.mjs:38-44`

**Issue:** The template substitutions use `String.prototype.replace()` with a regex first argument and a string second argument:

```js
userPrompt = userPrompt
  .replace(/\$\{PROJECTS_CONTEXT\}/g, projectsContext || '(no project context available)')
  .replace(/\$\{STYLE_REF\}/g, styleRef);
```

JavaScript's `String.replace()` interprets special patterns in the replacement string: `$&` inserts the matched substring, `` $` `` inserts the string before the match, `$'` inserts the string after the match. If `projectsContext` (read from `.md` files in `content/projects-context/`) or `styleRef` (read from the MDX file) contains any of these sequences, the replacement produces incorrect output — silently corrupting the prompt sent to OpenAI.

This is currently latent (confirmed: no existing content files contain these patterns), but future content additions could introduce them unintentionally, especially in code blocks that contain shell or JS snippets.

**Fix:** Use a replacer function to bypass special-pattern processing:

```js
userPrompt = userPrompt
  .replace(/\$\{SLUG\}/g, () => SLUG)
  .replace(/\$\{TOPIC\}/g, () => TOPIC)
  .replace(/\$\{TODAY\}/g, () => TODAY)
  .replace(/\$\{PROJECTS_CONTEXT\}/g, () => projectsContext || '(no project context available)')
  .replace(/\$\{STYLE_REF\}/g, () => styleRef);
```

A replacer function's return value is used literally, with no special-pattern expansion.

---

### WR-05: No assertion that `.pipeline-state.json` was actually written

**File:** `.github/workflows/generate-post.yml:66-71`

**Issue:** The "Assert generated files exist" step (lines 66–71) verifies both MDX locale files but does not check for `content/blog/.pipeline-state.json`. Per CR-01 (allowlist fix) and WR-01 (writing state directly), once the pipeline state is written unconditionally the assertion becomes a no-op. But under the current code, if the model omits the state block the file is silently not written, `git add` stages nothing for it, and the topic rotation will reset on the next run because the state file won't exist.

**Fix:** Add a state-file assertion alongside the locale assertions:

```yaml
- name: Assert generated files exist
  env:
    SLUG: ${{ steps.topic.outputs.slug }}
  run: |
    test -f "content/blog/${SLUG}.en.mdx" || { echo "ERROR: EN file not generated"; exit 1; }
    test -f "content/blog/${SLUG}.pt.mdx" || { echo "ERROR: PT file not generated"; exit 1; }
    test -f "content/blog/.pipeline-state.json" || { echo "ERROR: pipeline-state.json not written"; exit 1; }
    echo "All required files present."
```

---

## Info

### IN-01: Prompt template contains stale Claude CLI references

**File:** `scripts/generate-post-prompt.md:9, 21, 26`

**Issue:** The prompt template header says it is passed to `claude -p`, and the TASK section instructs the model to "Write TWO files using the Write tool" and "update `content/blog/.pipeline-state.json` using the Edit or Write tool." These are Claude tool-use instructions. The actual implementation uses OpenAI gpt-4o with a custom file-block protocol; the Write/Edit tool instructions are contradictory and may confuse the model, competing with the system prompt's `===FILE:` block instructions.

**Fix:** Remove or rewrite the header comment and replace the "Write tool" / "Edit or Write tool" instructions with the `===FILE:` block format already described in the system prompt. The TASK section should read:

```markdown
## TASK

Output THREE file blocks using the ===FILE: / ===ENDFILE format described in the system prompt:

1. `content/blog/${SLUG}.en.mdx` — English version
2. `content/blog/${SLUG}.pt.mdx` — Brazilian Portuguese version
3. `content/blog/.pipeline-state.json` — updated pipeline state (exact JSON provided in system prompt)
```

---

### IN-02: Inconsistent error detail between missing EN and PT file blocks

**File:** `scripts/generate-post-openai.mjs:136-143`

**Issue:** When the EN block is missing, the script logs the first 800 characters of the raw model output as a diagnostic aid (line 138). When the PT block is missing, no preview is logged. Since the EN block is output first by the model, a missing PT block is more likely to indicate late truncation — exactly the case where a raw-output preview would be most useful for diagnosis.

**Fix:** Add the same diagnostic preview for the PT failure path:

```js
if (!blocks[ptPath]) {
  console.error('ERROR: PT file block not found in model output');
  console.error('Output preview (first 800 chars):', output.slice(0, 800));
  process.exit(1);
}
```

---

_Reviewed: 2026-05-15T14:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
