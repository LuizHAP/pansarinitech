---
phase: quick-261006-fc8
plan: 01
status: complete
subsystem: client-previews
tags: [admin, server-actions, vercel-blob, unstable_cache, cdn-cache, cache-tags, disable-preview]
requires:
  - "Cached Blob index (unstable_cache, tag client-previews) and the hidden admin from 261005-qnn"
provides:
  - "PREVIEW_DISABLED_MARKER ('.disabled'): a <slug>/.disabled blob flags the preview as disabled in the index"
  - "/preview/<slug> and /client-previews/<slug>/... answer 404 for a disabled Blob preview (asset 404s are no-store, untagged)"
  - "disablePreview / enablePreview Server Actions (requireAdmin + isPreviewSlug guarded)"
  - "Admin: Desativada badge, Desativar/Reativar toggle on Blob detail pages, offline rendering"
affects: [src/lib/client-preview-source.ts, src/app/preview, src/lib/admin, src/app/admin, README.md]
tech-stack:
  added: []
  patterns:
    - "State as a marker blob in the store, read from the listing the index already does (no extra Blob call)"
    - "Disable order: put marker, updateTag(index), dangerouslyDeleteByTag(site tag), so a failed write touches no cache"
key-files:
  created: []
  modified:
    - src/lib/client-preview-source.ts
    - src/lib/client-preview-source.test.ts
    - src/app/preview/[slug]/page.tsx
    - src/lib/admin/actions.ts
    - src/lib/admin/actions.test.ts
    - src/lib/admin/view.ts
    - src/lib/admin/view.test.ts
    - src/app/admin/page.tsx
    - src/app/admin/[slug]/page.tsx
    - README.md
decisions:
  - "The marker body is the string 'disabled', because put() rejects an empty body"
  - "The marker does not move updatedAt; a folder holding only the marker is dated by the marker"
  - "Only .disabled directly under the slug folder is the marker; <slug>/img/.disabled is an ordinary file"
  - "Disable deletes only the client-preview:<slug> CDN entries, never the global client-previews tag"
  - "The Desativar/Reativar toggle is shown only for Blob rows; repo previews come down through a commit"
metrics:
  started: 2026-10-06T14:16:34Z
  completed: 2026-10-06T15:08:24Z
  duration: 52min (wall clock, including a machine reboot mid-verification)
  tasks_completed: 3
  tasks_total: 3
  files_changed: 10
---

# Quick 261006-fc8 Plan 01: Disable Blob client previews from the admin Summary

A Blob preview can now be taken offline and brought back without deleting its files. The state is a marker blob `<slug>/.disabled` in the private store. The Blob index already lists every blob, so the marker costs no extra call. It sets `disabled: true` on the indexed preview, which makes `findClientPreview` and `generateStaticParams` skip it (`/preview/<slug>` 404s). `servePreviewAsset` checks the cached index after the path guard and before any Blob `get()`, then answers the existing no-store, untagged 404. In the admin, a Blob detail page offers "Desativar prévia" (writes the marker, expires the index and ISR page with `updateTag`, deletes the site's CDN entries with `dangerouslyDeleteByTag('client-preview:<slug>')`) or "Reativar prévia" (deletes the marker, expires the index). Disabled previews get a "Desativada" badge, lose their frame and file links, and drop out of "Copiar todas as URLs".

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1. Disabled flag in the index, 404 on /preview and /client-previews | `5acf17d` feat(preview): take Blob previews offline with a .disabled marker | src/lib/client-preview-source.ts, src/lib/client-preview-source.test.ts, src/app/preview/[slug]/page.tsx, src/lib/admin/view.test.ts (4) |
| 2. disablePreview / enablePreview and disabled-aware view helpers | `d538d37` feat(admin): disable and re-enable Blob previews | src/lib/admin/actions.ts, src/lib/admin/actions.test.ts, src/lib/admin/view.ts, src/lib/admin/view.test.ts (4) |
| 3. Admin UI, README EN/PT | `6789bf6` feat(admin): show disabled previews and document taking them offline | src/app/admin/page.tsx, src/app/admin/[slug]/page.tsx, README.md (3) |

Each commit went through the husky pre-commit hook (`pnpm lint`, `pnpm verify:ci-safety`, `pnpm test:unit`). No `--no-verify`. Nothing pushed, no branch switch, no Blob or Vercel writes. `.claude-flow/`, `.swarm/` and `src/data/skill-icons.json` were never staged.

## Final verification (clean tree at `6789bf6`, no mutations or stub left)

| # | Command | Real output |
|---|---------|-------------|
| 1 | `pnpm lint` | `Checked 201 files in 124ms. No fixes applied.`, exit 0 |
| 2 | `pnpm exec next typegen && pnpm exec tsc --noEmit` | `✓ Types generated successfully`, tsc exit 0, no errors |
| 3 | `pnpm test:unit` | exit 0, `Test Files 42 passed (42)`, `Tests 386 passed (386)` |
| 3 | `pnpm test:unit:coverage` | exit 0, 386/386. lcov: `client-preview-source.ts` LH 92/92, BRH 79/79, FNH 22/22; `admin/actions.ts` 32/32, 14/14, 8/8; `admin/view.ts` 20/20, 11/11, 13/13 |
| 4 | `pnpm verify:ci-safety` | `[check-ci-safety] ✓ No CI-safety violations found.`, exit 0 |
| 5 | `pnpm build` (with prebuild) | exit 0. Prebuild rewrote `src/data/skill-icons.json`, restored with `git checkout --`, not committed |
| 5 | `pnpm next build > log` + `pnpm verify:static log` | build exit 0; `✓ Static rendering verified: all /[locale] routes are SSG`, exit 0 |
| 6 | `PLAYWRIGHT_PORT=3100 pnpm test:e2e` | final run: `21 passed (6.4s)` (see the runs table below) |
| 7 | `git status --short` | empty. `git log --oneline origin/main..HEAD` shows only `6789bf6`, `d538d37`, `5acf17d`; `## feat/disable-preview...origin/main [ahead 3]` |

Build route lines from the final `pnpm next build` log:

```
├ ƒ /admin
├ ƒ /admin/[slug]
├ ƒ /admin/login
├ ƒ /client-previews/[slug]/[...path]
├ ● /preview/[slug]                                   1m      1y
│ └ /preview/exemplo                                  1m      1y
```

### e2e runs, all of them

| Run | Conditions | Result |
|-----|------------|--------|
| 1 | clean tree at `6789bf6`, load average 240 on 10 cores (other projects' vitest workers, a headed Playwright daemon and a VM were running) | 10 failed, 11 passed (5.8m). Every failure was a 30 s timeout: `browserContext.newPage: Test timeout of 30000ms exceeded` while setting up "page", `page.goto: net::ERR_ABORTED`, `Target page, context or browser has been closed`. The tests that passed took 13 to 25 s each (the 261005-qnn suite ran in 4.8 s). The 3 admin tests passed |
| 2 (final) | same commit after the machine rebooted, load average ~15, fresh `pnpm build` + `pnpm next build` | `21 passed (6.4s)`, including the 3 admin tests (the repo `exemplo` detail page still shows its frame) and `Theme toggle persistence across reload` |

I attribute run 1 to the machine, not the change. The failures were in page setup and navigation on locale, theme, 404 and case-study routes that this plan does not touch, and the same commit passed in full once the load dropped. No code was changed between the runs.

## Task 3 visual check (375x812, headless Chromium, logged in, fixture stub never committed)

The Blob-only UI cannot render with real data locally (no credentials). Following the plan, I temporarily changed the `catch` branch of `buildPreviewIndex` to return `available: true` with two fixture previews: `heris-clinica-medica` (Héris Clínica Médica, disabled, `index.html` + `css/style.css`) and `acme-on` (Acme, enabled, `index.html`). Then I ran `pnpm next build` and `ADMIN_USER=e2e-admin ADMIN_PASSWORD=e2e-password-not-a-secret pnpm next start -p 3100`. No action button was clicked.

curl against the stub build:

```
== curl /preview/heris-clinica-medica
HTTP/1.1 404 Not Found
== curl /client-previews/heris-clinica-medica/index.html
HTTP/1.1 404 Not Found
X-Robots-Tag: noindex, nofollow, noarchive
cache-control: no-store
== curl /preview/acme-on
HTTP/1.1 200 OK
```

The stub build's route list also showed the `generateStaticParams` filter working. It prerendered `/preview/exemplo` and `/preview/acme-on` but not `/preview/heris-clinica-medica`.

Printed checks from the Playwright script:

```
dashboard Desativada badge count: 1
dashboard Desativada badge inside the Héris card: 1
dashboard scroll delta: 0
dashboard Copiar todas as URLs clipboard: "https://pansarini.dev/preview/exemplo\nhttps://pansarini.dev/preview/acme-on"
disabled detail: Desativada visible: true
disabled detail: Reativar prévia visible: true
disabled detail: offline note visible: true
disabled detail: iframe count: 0
disabled detail: Desativar prévia count: 0
disabled detail: Limpar cache count: 0
disabled detail: Abrir present: 1
disabled detail: asset link count: 0
disabled detail: scroll delta: 0
enabled detail: Desativar prévia visible: true
enabled detail: Limpar cache visible: true
enabled detail: Reativar prévia count: 0
enabled detail: Desativada count: 0
enabled detail: iframe count: 1
enabled detail: asset link count: 1
enabled detail: scroll delta: 0
```

`document.documentElement.scrollWidth - clientWidth` was 0 on all three pages. The clipboard check clicks "Copiar todas as URLs", which is a client-side copy button, not a Server Action.

Screenshots (scratchpad only, not committed), viewed with Read:

- `/private/tmp/claude-501/-Users-luiz-Documents-Projetos-Pessoal-pansarinitech/8022b1de-12ca-4404-bdeb-f9f0efdb08ad/scratchpad/admin-dashboard-disabled-375.png`: the Héris card shows "Blob" and "Desativada" badges side by side, and the Acme card has no badge
- `.../scratchpad/admin-detail-disabled-375.png`: "Desativada" sits next to the h1. The offline note is under the URL, "Copiar URL" and "Abrir" are kept, file paths are plain monospace text, there is no "Prévia" section, and "Reativar prévia" is the only action
- `.../scratchpad/admin-detail-enabled-375.png`: underlined file link, frame, then "Desativar prévia" and "Limpar cache deste site" on one row. The frame shows "Not found" because the fixture has no real Blob behind it

Afterwards I stopped the server (only the PID on 3100 whose cwd is this repo), ran `git checkout -- src/lib/client-preview-source.ts`, and `git status --short` was empty. I then ran a clean `pnpm next build`, so `.next` matches HEAD again (it prerenders only `/preview/exemplo`). The visual check ran twice, once before and once after the reboot (the reboot cleared `/private/tmp`, screenshots included), with the same results both times. The screenshots listed above come from the second run.

## Mutation proofs

Each mutation was applied alone, the suite run, then the file restored with `git checkout -- <file>`. `git status` was empty after each batch. The runner printed the `×` lines from `vitest --reporter=verbose`.

### Task 1 (`pnpm exec vitest --run src/lib/client-preview-source.test.ts`, 60 tests)

| Mutation | Failing test(s) |
|----------|-----------------|
| the marker is pushed into files | flags a folder with the .disabled marker without counting it as a file; lists a folder holding only the marker as disabled, dated by the marker |
| the marker bumps updatedAt | flags a folder with the .disabled marker without counting it as a file |
| `disabled` is always false | flags a folder with the .disabled marker...; lists a folder holding only the marker...; findClientPreview › returns undefined for a disabled preview; servePreviewAsset › returns an uncached 404 for a disabled preview without reading the blob |
| any path ending in `.disabled` counts as the marker | only treats .disabled at the folder root as the marker |
| marker-only fallback removed (updatedAt stays empty) | lists a folder holding only the marker as disabled, dated by the marker |
| findClientPreview ignores `disabled` | returns undefined for a disabled preview |
| servePreviewAsset without the disabled check | returns an uncached 404 for a disabled preview without reading the blob |
| servePreviewAsset blocks when ANY preview is disabled (slug not compared) | still serves a preview when another folder is disabled |
| servePreviewAsset reads `buildPreviewIndex()` instead of `getPreviewIndex()` | returns an uncached 404 for a disabled preview without reading the blob |
| index read moved before `isSafePreviewPath` | returns an uncached 404 for an unsafe path without reading Blob |
| the preview object omits `disabled` | groups blobs by folder with sorted files...; ignores root-level blobs and lists an empty folder...; flags a folder with the .disabled marker...; only treats .disabled at the folder root...; lists a folder holding only the marker...; returns undefined for a disabled preview; returns an uncached 404 for a disabled preview... (7) |

Every new or changed test in this file fails under at least one mutation.

The `generateStaticParams` filter in `src/app/preview/[slug]/page.tsx` has no unit test, because page modules are outside Vitest. The verify grep gate (`!preview.disabled` in the non-comment lines) covers it. So does the stub build above, where the disabled fixture was not prerendered.

### Task 2 (`pnpm exec vitest --run src/lib/admin`, 63 tests)

| Mutation | Failing test(s) |
|----------|-----------------|
| disablePreview without requireAdmin | disablePreview › changes nothing without a session |
| disablePreview without isPreviewSlug | disablePreview › ignores a slug outside [a-z0-9-] |
| marker body `''` | writes the marker, expires the index and deletes the site from the CDN |
| `allowOverwrite: false` | writes the marker, expires the index and deletes the site from the CDN |
| invalidateByTag instead of dangerouslyDeleteByTag | writes the marker, expires the index and deletes the site from the CDN |
| CDN tag `PREVIEW_CACHE_TAG` instead of `previewCacheTag(slug)` | writes the marker, expires the index and deletes the site from the CDN |
| updateTag dropped from disablePreview | writes the marker, expires the index and deletes the site from the CDN |
| dangerouslyDeleteByTag moved before put | touches no cache when writing the marker fails |
| enablePreview without requireAdmin | enablePreview › changes nothing without a session |
| enablePreview without isPreviewSlug | enablePreview › ignores a slug outside [a-z0-9-] |
| del path `${slug}/disabled` | deletes the marker and expires the index |
| updateTag dropped from enablePreview | deletes the marker and expires the index |
| repo rows `disabled: true` | keeps a disabled Blob row disabled and its repo twin public; lists the repo registry first...; keeps URLs that resolve, once each, in list order |
| Blob rows forced to `disabled: false` | keeps a disabled Blob row disabled and its repo twin public; keeps URLs that resolve, once each, in list order |
| publicUrls without the disabled filter | keeps URLs that resolve, once each, in list order |

Every new or changed test in `actions.test.ts` and `view.test.ts` fails under at least one mutation. Without the `publicUrls` filter, only the changed publicUrls test fails, not "keeps a disabled Blob row disabled and its repo twin public". The reason is that the disabled Blob `exemplo` and its repo twin share one URL, and de-duplication collapses them. That test's job is the other direction: the repo twin must keep its URL, and the "repo rows disabled: true" mutation proves that.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in the plan's test spec] The disabled-asset test cannot assert "get was not called"**
- **Found during:** Task 1 (RED)
- **Issue:** The plan lists `off-asset/index.html` in the Blob listing and asserts `get` was never called. But `buildPreviewIndex` reads every listed `index.html` through `get` to get the title, so `get` is always called once by the index itself.
- **Fix:** The test asserts `get` was called exactly once, with the index read's arguments `('off-asset/index.html', { access: 'private' })`, plus the 404 and the cached-index call count. Without the disabled check, `get` runs a second time and the response is 200, so the mutation proof still holds (see the Task 1 table).
- **Files modified:** src/lib/client-preview-source.test.ts
- **Commit:** 5acf17d

### Implementation choices worth knowing

- In `buildPreviewIndex`, `groups.set` now runs right after the group lookup, and the marker branch ends with `continue`. The existing updatedAt and folder-marker lines stay as they were, so the diff stays small.
- The README says the hand-made marker file "cannot be empty" (EN) / "não pode estar vazio" (PT), in line with the plan's own note that the SDK rejects `''`. The rest of the README text follows the plan.
- "Limpar cache deste site" keeps its existing `variant="destructive"`, so on an enabled Blob page both action buttons are red. That matches the plan ("the existing purge form unchanged").
- Comments added: one why-line on the marker branch (does not move "Atualizado em" or the list order), one on the put body (rejects empty), one on `dangerouslyDeleteByTag` (invalidateByTag would serve each cached file once more), one in a test on the single expected `get`. No IDs or narration.
- `rtk` (the shell's output filter) broke `pnpm exec biome check .` ("Linter process terminated abnormally"). Every Biome, lint and verify run above used `rtk proxy` to get the raw command and its real exit code. The husky hook is not affected.

## Deferred Issues

None from this plan. The machine-load e2e failures in run 1 are environmental and are recorded above.

## Known Stubs

None. The visual-check fixture lived only in the working tree and was reverted both times.

## Threat Flags

None. The new surfaces (two Server Actions, put/del on the private store, the CDN delete-by-tag) are all in the plan's threat register. T-fc8-01 and T-fc8-02 are covered by unit tests and mutations (no session, '../x', 'Bad_Slug'). T-fc8-04 is covered by the index, lookup and asset tests and by the curls against the stub build. T-fc8-06 is covered by the unsafe-path test asserting `list` is not called.

## Take Héris offline (for the orchestrator and Luiz, after deploy)

1. Open https://pansarini.dev/admin and click "Atualizar índice" once. An index cached by the previous deployment has no `disabled` field.
2. Open https://pansarini.dev/admin/heris-clinica-medica and click "Desativar prévia". This is preferred over a hand upload because it also deletes the CDN copies. If the marker is uploaded by hand instead, its body must be non-empty (the SDK rejects `''`). After a hand upload, click "Atualizar índice" and run `vercel cache dangerously-delete --tag client-preview:heris-clinica-medica`.
3. `curl -sI https://pansarini.dev/preview/heris-clinica-medica` returns 404. `curl -sI https://pansarini.dev/client-previews/heris-clinica-medica/index.html`, run twice, returns 404 with `cache-control: no-store` both times and no `x-vercel-cache: HIT`.
4. The dashboard shows the "Desativada" badge on Héris, and "Copiar todas as URLs" no longer includes it.

## Self-Check: PASSED

- Files: all 10 modified files exist on disk. This SUMMARY exists.
- Commits: `5acf17d`, `d538d37`, `6789bf6` are in `git log` on `feat/disable-preview`, ahead of origin/main by 3, not pushed.
- Tree: `git status --short` empty. No server I started is running. Port 3100 is free, and both servers I started there (PID 27289 before the reboot, PID 17682 after) were stopped with SIGTERM (exit 143). I never touched a process whose cwd is not this repo.
- STATE.md, ROADMAP.md and PLAN.md were not modified. The orchestrator owns the docs commit and the STATE.md quick-task row.
