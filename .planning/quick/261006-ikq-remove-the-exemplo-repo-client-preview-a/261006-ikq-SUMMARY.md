---
phase: quick-261006-ikq
plan: 01
status: complete
subsystem: client-previews
tags: [client-previews, e2e, vitest, vi-mock, cleanup]
requires:
  - "Disable-preview work from 261006-fc8 (feat/disable-preview, PR #28), which this branch is stacked on"
provides:
  - "No repo client preview: public/client-previews/ has no tracked file, clientPreviews is []"
  - "Repo-preview code paths (getClientPreview, registry branch in findClientPreview, shadowed-by-repo, Repositório rows) covered through a vi.mock('@/data/client-previews') entry 'repo-site'"
  - "e2e admin login test asserts the 'Blob indisponível' alert inside main instead of the exemplo row"
affects: [tests/e2e.spec.ts, src/data/client-previews.ts, src/data/client-previews.test.ts, src/lib/client-preview-source.test.ts, src/lib/admin/view.test.ts, public/client-previews/exemplo]
tech-stack:
  added: []
  patterns:
    - "Module mock for the repo registry, data defined inside the hoisted vi.mock factory, returning both clientPreviews and getClientPreview"
key-files:
  created: []
  modified:
    - tests/e2e.spec.ts
    - src/data/client-previews.ts
    - src/data/client-previews.test.ts
    - src/lib/client-preview-source.test.ts
    - src/lib/admin/view.test.ts
  deleted:
    - public/client-previews/exemplo/index.html
    - public/client-previews/exemplo/style.css
    - public/client-previews/exemplo/script.js
decisions:
  - "Registry test never mutates the real clientPreviews export; the known-slug test is dropped and the existing does-not-exist lookup is the only getClientPreview test (user override of the plan)"
  - "Repo-path unit coverage comes from a mocked one-entry registry ('repo-site') in client-preview-source.test.ts and view.test.ts"
  - "e2e admin assertion scoped to getByRole('main') because Next's route announcer is also role=alert"
metrics:
  started: 2026-10-06T16:31:24Z
  completed: 2026-10-06T16:43:00Z
  duration: 12min
  tasks_completed: 2
  tasks_total: 2
  files_changed: 8
---

# Quick 261006-ikq Plan 01: Remove the exemplo repo client preview Summary

The `exemplo` placeholder preview is gone: its three files are deleted, `clientPreviews` is `[]`, and `/preview/exemplo` plus `/client-previews/exemplo/*` return 404 on a fresh `next start`. The repo-preview mechanism (the `ClientPreview` type, `getClientPreview`, the registry branch in `findClientPreview`, the `shadowed-by-repo` warning, the "Repositório" admin rows, the README instructions) is unchanged. Its unit tests now run against a mocked one-entry registry (`repo-site`), so the 100% gate on `client-preview-source.ts`, `admin/actions.ts` and `admin/view.ts` no longer depends on production data. The e2e suite went from 21 tests to 14. The admin login test now asserts the "Blob indisponível" alert (no Blob credentials in CI), the session cookie attributes and Sair.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1. Drop the exemplo-dependent e2e tests, repoint the admin login test | `fa28127` test(e2e): drop the tests that need the exemplo preview | tests/e2e.spec.ts (1) |
| 2. Remove exemplo, empty the registry, mocked-registry unit tests | `0c8dd37` chore(preview): remove the exemplo repo preview | 3 deletions + 4 edited files (7) |

```
$ git show --stat fa28127
fa28127 test(e2e): drop the tests that need the exemplo preview
 tests/e2e.spec.ts | 124 ++----------------------------------------------------
 1 file changed, 4 insertions(+), 120 deletions(-)

$ git show --stat 0c8dd37
0c8dd37 chore(preview): remove the exemplo repo preview
 public/client-previews/exemplo/index.html | 18 ----------------
 public/client-previews/exemplo/script.js  |  1 -
 public/client-previews/exemplo/style.css  | 18 ----------------
 src/data/client-previews.test.ts          | 11 +---------
 src/data/client-previews.ts               |  4 +---
 src/lib/admin/view.test.ts                | 34 +++++++++++++++++++------------
 src/lib/client-preview-source.test.ts     | 17 +++++++++++-----
 7 files changed, 35 insertions(+), 68 deletions(-)
```

Both commits went through the husky pre-commit hook (`pnpm lint`, `pnpm verify:ci-safety`, `pnpm test:unit`), with no `--no-verify`. The hook's unit run printed `Tests 386 passed (386)` on the first commit and `Tests 385 passed (385)` on the second. Nothing was pushed (the branch has no upstream), there was no branch switch, and nothing was written to Blob or Vercel. `.claude-flow/` (including `public/client-previews/.claude-flow/`, still on disk), `.swarm/` and `src/data/skill-icons.json` were never staged. Only `pnpm next build` was used, so the prebuild hook never ran.

## e2e tests deleted (21 → 14)

From "Client preview viewer (proxy-excluded, always noindex)":

1. `/preview/exemplo returns 200 without a redirect, with noindex header and meta`
2. `/client-previews/exemplo/index.html is served with the preview noindex header`
3. `/client-previews assets allow cross-origin loads from the sandboxed frame`
4. `/preview/exemplo renders the client site under the PT brand bar`
5. `/preview/exemplo runs client scripts in a sandbox without portfolio storage access`
6. `/preview/exemplo brand bar follows the light theme with zero axe violations`
7. `/preview/exemplo brand bar follows the dark theme with zero axe violations`

Kept: `/preview/does-not-exist returns 404 without a locale redirect` and `/client-previews/does-not-exist/index.html returns a noindexed 404, not a 500`.

Renamed: `login lists exemplo, opens its page, and Sair ends the session` became `login shows the dashboard with the Blob alert, and Sair ends the session`. It now asserts `page.getByRole('main').getByRole('alert')` contains "Blob indisponível", and keeps the cookie block (httpOnly, SameSite Strict, Path /admin, Secure, 7.9 to 8.1 h) and Sair with both `/admin/login` URL checks. The clicks into the exemplo detail page, its iframe sandbox assertion and the `page.goto('/admin')` back from it are gone. The `AxeBuilder` import and the `PREVIEW_FRAME_SANDBOX` constant were removed. Baseline: `bebb835:tests/e2e.spec.ts` has 20 `test(` calls, one inside the 2-iteration colour-scheme loop, so 21 tests (fc8 ran `21 passed` on the same file). `playwright test --list` now prints `Total: 14 tests in 1 file`.

## Unit test counts and coverage

| | Before (`fa28127` hook run) | After (`0c8dd37`) |
|---|---|---|
| `pnpm test:unit` | `Test Files 42 passed (42)`, `Tests 386 passed (386)` | `Test Files 42 passed (42)`, `Tests 385 passed (385)` |

The count drops by one on purpose. It does not match the plan's "unchanged" target; see Deviation 1.

`pnpm test:unit:coverage` at the tip: exit 0, 385/385. From `coverage/lcov.info`:

```
SF:src/lib/client-preview-source.ts FNF:22 FNH:22 LF:92 LH:92 BRF:79 BRH:79
SF:src/lib/admin/actions.ts FNF:8 FNH:8 LF:32 LH:32 BRF:14 BRH:14
SF:src/lib/admin/view.ts FNF:13 FNH:13 LF:20 LH:20 BRF:11 BRH:11
```

These are the same numbers fc8 recorded. No threshold was touched.

### Registry tests now pass vacuously

In `src/data/client-previews.test.ts`, `has unique slugs` (renamed from `is non-empty and every slug is unique`, with its `toBeGreaterThan(0)` dropped), `uses only lowercase letters, digits and hyphens in slugs` and `has an index.html on disk for every entry` loop over an empty registry. They pass without checking anything today. They kick in again once a repo entry is added, which is what README step 3 promises.

### RED evidence (registry emptied, tests not yet moved to the mock)

Before switching the tests to the mock, I emptied the registry and ran `vitest --run src/data src/lib/client-preview-source.test.ts src/lib/admin`. Result: `Tests 8 failed | 161 passed (169)`:

- client-previews.test.ts: `is non-empty and every slug is unique`, `returns the entry for a known slug`
- view.test.ts: `lists the repo registry first...`, `falls back to the repo row`, `keeps URLs that resolve, once each, in list order`, `keeps a disabled Blob row disabled and its repo twin public`
- client-preview-source.test.ts: `warns when a repo preview with the same slug wins`, `returns a registry preview without reading Blob`

The six src/lib tests above went green only after `vi.mock('@/data/client-previews')` was added, because the real registry is empty. That proves the mock intercepts the import. `prefers the Blob row when the slug is also in the repo` passed even with the empty registry (it then had only a Blob row); M4 below shows it bites with the mock in place.

## Mutation proofs

Each mutation was applied on its own, and the named file was run with `pnpm exec vitest --run --reporter=verbose <file>`. I recorded the `×` lines, then reverted: `git checkout -- <file>` for client-preview-source.ts, view.ts and page.tsx, and an Edit for client-previews.ts. `git status` showed only the intended task changes after every revert, and `git diff --quiet` was clean after M7.

| # | Mutation | Result |
|---|----------|--------|
| M1 | client-preview-source.ts: delete `if (getClientPreview(slug)) warnings.push({ code: 'shadowed-by-repo' });` | `1 failed / 60`: buildPreviewIndex › warns when a repo preview with the same slug wins |
| M2 | client-preview-source.ts: delete `if (registered) return registered;` | `1 failed / 60`: findClientPreview › returns a registry preview without reading Blob |
| M3 | view.ts: listAdminPreviews returns `blobRows` only | `4 failed / 16`: listAdminPreviews › lists the repo registry first...; findAdminPreview › falls back to the repo row; publicUrls › keeps URLs that resolve, once each, in list order; disabled previews › keeps a disabled Blob row disabled and its repo twin public |
| M4 | view.ts: findAdminPreview returns `rows[0]` | `1 failed / 16`: findAdminPreview › prefers the Blob row when the slug is also in the repo |
| M5 | view.ts: publicUrls without the `new Set` dedupe | `1 failed / 16`: publicUrls › keeps URLs that resolve, once each, in list order |
| M6 | client-previews.ts: `preview.slug === slug` → `!==` | **SURVIVES.** client-previews.test.ts `4 passed (4)`, full suite `385 passed (385)`. See Deviation 2 |
| M7 | admin/page.tsx: `{!index.available && (` → `{index.available && (`, then `pnpm next build` and `-g "Sair ends the session"` | `1 failed`: `tests/e2e.spec.ts:237:61`, `expect(locator).toContainText(expected) failed`, `Locator: getByRole('main').getByRole('alert')`, `Expected substring: "Blob indisponível"`, `Error: element(s) not found` |

## Final verification (clean tree at `0c8dd37`, no mutation left)

| # | Command | Real output |
|---|---------|-------------|
| 1 | `pnpm lint` | `Checked 201 files in 61ms. No fixes applied.`, exit 0 |
| 2 | `pnpm exec next typegen && pnpm exec tsc --noEmit` | `✓ Types generated successfully`, tsc exit 0 (tsconfig includes the test files) |
| 3 | `pnpm test:unit` / `pnpm test:unit:coverage` | both exit 0, `Tests 385 passed (385)`, coverage lines above |
| 4 | `pnpm verify:ci-safety` | `[check-ci-safety] ✓ No CI-safety violations found.` |
| 5 | M7 | failed as required, then reverted (table above) |
| 6 | `pnpm next build > log` + `pnpm verify:static log` | build exit 0, `✓ Static rendering verified: all /[locale] routes are SSG`, exit 0 |
| 7 | `next start -p 3100` + curl | `/preview/exemplo 404`, `/client-previews/exemplo/index.html 404`, `/client-previews/exemplo/style.css 404` |
| 8 | `PLAYWRIGHT_PORT=3100 pnpm test:e2e` | `14 passed (13.9s)`, exit 0 (load average 35 at start; no flake, no rerun) |
| 9 | grep gate | prints nothing (see below) |
| 10 | `git status --short` | empty (the `.planning/` dir is gitignored); `skill-icons.json` unchanged; `## chore/remove-exemplo-preview` with no upstream |

Step 6 route lines from the final build log:

```
├ ƒ /admin
├ ƒ /admin/[slug]
├ ƒ /admin/login
├ ƒ /client-previews/[slug]/[...path]
├ ● /preview/[slug]
```

`/preview/[slug]` is still ● but no longer has prerendered child rows. fc8's build listed `└ /preview/exemplo` under it; this log has no "exemplo" anywhere (`grep -c` = 0). Blob slugs keep rendering on demand.

Step 9 grep gate:

```
$ ! git grep -n -i "exemplo" -- . ':!.planning' ':!content' ':!src/components/preview/preview-viewer.test.tsx'
(no output, exit 0)
$ git grep -n -i "exemplo" -- src/components/preview/preview-viewer.test.tsx
```

The second command still lists the same 9 untouched prop and assertion strings at lines 12, 18, 19, 28, 30, 36, 45, 54 and 60. `git diff --stat HEAD~2 -- src/components/preview/preview-viewer.test.tsx` is empty.

README: `grep -n -i -E "exemplo|sample preview|example preview|prévia de exemplo" README.md` printed nothing (exit 1), so README was not changed.

Servers: I started one server myself, PID 11468 (`next start -p 3100`, cwd this repo), for the curls and stopped it with `kill`. Playwright started and stopped its own `webServer` for M7 and step 8. Port 3100 was empty before each build and run and is empty now. I touched no process from another repo.

## Deviations from Plan

**1. [User override] The registry test does not mutate `clientPreviews`, and the test count drops by one**
- **Found during:** Task 2
- **Issue:** The plan pushed two entries onto the real exported array inside a `finally` to test the known-slug lookup. The orchestrator forbade mutating the readonly module export. It asked to replace the known-slug lookup with `getClientPreview('does-not-exist')` returning undefined.
- **Fix:** I deleted `returns the entry for a known slug`. The file already had `returns undefined for an unknown slug`, which makes exactly that call, so it is now the only getClientPreview test. I did not add a second identical test just to keep the count, so the unit count is 386 → 385 instead of unchanged. I renamed `is non-empty and every slug is unique` to `has unique slugs` and dropped the non-empty line. The slug-format and index.html loops are unchanged.
- **Files modified:** src/data/client-previews.test.ts
- **Commit:** 0c8dd37

**2. [Known gap, not worked around] The real `getClientPreview` match logic is untested (M6 survives)**
- With an empty registry, `clientPreviews.find(...)` returns undefined whatever the predicate is. The two mocked files supply their own `getClientPreview`, so the real function's comparator is never exercised. `src/data/client-previews.ts` is not in the vitest coverage include list or in `LIB_DATA_FILES`, so no coverage gate fails, and none of the three gated files lost coverage. The gap stays even after the next repo entry is added, because no test looks up a known slug. A known-slug assertion in `client-previews.test.ts` is the place to restore it once a real entry exists.

**3. [Process] TDD on Task 2 ran in the working tree, not as separate commits**
- Task 2 is `tdd="true"`, but the plan prescribes one commit for it. The RED run (8 failures, listed above) and the GREEN run were done before that single commit, so there is no separate `test(...)` commit. The plan is `type: execute`, so the plan-level TDD gate does not apply.

No Rule 1-3 auto-fixes were needed. Task 1 was executed as written.

## Known Stubs

None.

## Threat Flags

None. T-ikq-01 is covered by the three 404 curls on a fresh build and by `git ls-files public/client-previews` being empty. For T-ikq-02, the redirect, wrong-password, cookie-attribute and Sair checks all remain and pass (`14 passed`). T-ikq-03: the registry mock exists only in two `*.test.ts` files. T-ikq-04 was accepted by Luiz; the PreviewViewer unit tests still assert the sandbox attribute, and the `/client-previews/does-not-exist` e2e test still asserts noarchive.

## Self-Check: PASSED

- Files: src/data/client-previews.ts, src/data/client-previews.test.ts, src/lib/client-preview-source.test.ts, src/lib/admin/view.test.ts and tests/e2e.spec.ts exist. The three exemplo files are absent from disk and from the index. This SUMMARY exists.
- Commits: `fa28127` and `0c8dd37` are in `git log` on `chore/remove-exemplo-preview`, on top of `bebb835`, not pushed.
- Tree: `git status --short` is empty. STATE.md, ROADMAP.md and the PLAN were not modified, and this SUMMARY is not committed.
