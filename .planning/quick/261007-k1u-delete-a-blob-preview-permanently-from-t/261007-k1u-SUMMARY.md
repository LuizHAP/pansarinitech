---
phase: quick-261007-k1u
plan: 01
subsystem: admin
tags: [admin, vercel-blob, server-actions, client-previews, mobile-375]
requires:
  - hidden admin with requireAdmin (261005-qnn)
  - Blob preview index and disable marker (261006-fc8)
provides:
  - deletePreview(slug, formData) Server Action
  - "Excluir prévia" typed-slug confirmation block on Blob preview admin pages
  - "/admin/<slug>?delete=failed" retry alert
affects:
  - src/app/admin/[slug]/page.tsx
  - README.md (Admin section, EN and PT)
tech-stack:
  added: []
  patterns:
    - list everything under `<slug>/` first, then del() in batches of 100 pathnames
    - one try/catch sets a failed flag; cache expiry and redirect stay outside it because redirect throws NEXT_REDIRECT
    - native `pattern` + `required` on the confirmation input, server equality check stays the authority
key-files:
  created: []
  modified:
    - src/lib/admin/actions.ts
    - src/lib/admin/actions.test.ts
    - src/app/admin/[slug]/page.tsx
    - README.md
decisions:
  - "deletePreview deletes only when the `confirmation` field equals the slug exactly (no trim, no case folding)"
  - "Blob deletes run in batches of 100 pathnames after the full listing; a listing failure deletes nothing, a failed batch stops the loop"
  - "On failure the action still runs updateTag and dangerouslyDeleteByTag, then redirects to /admin/<slug>?delete=failed for a retry"
metrics:
  duration: 11 min
  completed: 2026-10-07
  tasks: 2
  files: 4
---

# Quick 261007-k1u Plan 01: Delete a Blob preview for good from the admin

`deletePreview` Server Action that, after requireAdmin, a valid slug and an exactly typed slug, lists every blob under `<slug>/` page by page, deletes them in batches of 100, expires the index and the site's CDN entries and returns to `/admin`, with an "Excluir prévia" block and a `?delete=failed` retry alert on Blob preview pages.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1. deletePreview action + tests | e7bbb4a | src/lib/admin/actions.ts, src/lib/admin/actions.test.ts |
| 2. Excluir prévia block, failure alert, README EN/PT | 83e06b7 | src/app/admin/[slug]/page.tsx, README.md |

Both commits ran the husky pre-commit hook (lint, verify:ci-safety, test:unit) with no `--no-verify`. Staged by explicit path only. Nothing pushed.

## What was built

- `src/lib/admin/actions.ts`: `list` added to the `@vercel/blob` import, non-exported `DELETE_BATCH_SIZE = 100`, non-exported `listPreviewPathnames(slug)` (loops `list({ mode: 'expanded', prefix: \`${slug}/\`, cursor })` until `hasMore` is false, keeps every pathname including `<slug>/` and `.disabled`, one why-comment on the trailing slash), and exported `deletePreview(slug, formData)` after `enablePreview`. `redirect`, `requireAdmin`, `updateTag` and `dangerouslyDeleteByTag` stay outside the try block.
- `src/lib/admin/actions.test.ts`: `list` imported and reset in `beforeEach`, `blob()`/`page()`/`photos()` builders, `describe('deletePreview')` with 14 tests (7 of them from the `it.each` near-miss confirmations). Existing tests unchanged.
- `src/app/admin/[slug]/page.tsx`: `searchParams` prop, `deleteFailed` flag, destructive `Alert` "A exclusão não terminou" between the header and the `<dl>`, and at the end of `<main>` an "Excluir" section (only when `preview.source === 'blob' && isPreviewSlug(preview.slug)`) with a `<details open={deleteFailed}>`, the warning paragraph, the "Digite <slug> para confirmar" label, the `confirmation` input (`required`, `pattern={preview.slug}`, `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`, `autoComplete="off"`) and the "Confirmar exclusão" button. Repo rows unchanged, no client component, no `window.confirm`.
- `README.md`: exactly the two bullets replaced (EN "Taking a preview offline:", PT "Tirar uma prévia do ar:") with the plan's text.

## TDD (Task 1)

- RED: with the tests written and no `deletePreview` export, `pnpm exec vitest --run src/lib/admin/actions.test.ts` gave `14 failed | 20 passed (34)`, every failure `TypeError: deletePreview is not a function`.
- GREEN: after the implementation, `34 passed (34)`.
- RED and GREEN share one commit (e7bbb4a), as the plan specifies. A separate failing `test(...)` commit cannot pass the pre-commit hook, which runs `pnpm test:unit`.

## Mutation table (Task 1)

Each mutation applied alone to `src/lib/admin/actions.ts` by a scratchpad script, run with `pnpm exec vitest --run src/lib/admin/actions.test.ts --reporter=verbose`, then restored with `git checkout -- src/lib/admin/actions.ts`. The script asserted the file was byte-identical to HEAD at the end, and `git status --short` was empty afterwards. All 23 mutations were killed.

| # | Mutation | Failing tests (`deletePreview › …`) |
|---|----------|-------------------------------------|
| 1 | requireAdmin removed from deletePreview | deletes nothing without a session |
| 2 | isPreviewSlug check removed | ignores a slug outside [a-z0-9-] even when the confirmation matches |
| 3 | confirmation check removed | deletes nothing when the confirmation is "", "heri", "Heris", "heris ", " heris", "heris/", "heris-x"; deletes nothing without a confirmation field (8) |
| 4 | confirmation compared after `.trim()` | confirmation is "heris ", " heris" |
| 5 | confirmation compared case-insensitively | confirmation is "Heris" |
| 6 | `slug.startsWith(confirmation)` instead of equality | confirmation is "", "heri"; deletes nothing without a confirmation field |
| 7 | prefix without the trailing slash | deletes every blob under <slug>/ across pages in batches… |
| 8 | a single list call (no pagination loop) | deletes every blob…; deletes nothing when listing fails midway… |
| 9 | cursor not forwarded | deletes every blob… |
| 10 | pathnames ending in `/` or `.disabled` filtered out | deletes every blob… |
| 11 | one del() with every pathname (no batching) | deletes every blob…; stops at the first failed batch… |
| 12 | del() given blob URLs instead of pathnames | deletes every blob…; stops at the first failed batch… |
| 13 | updateTag dropped | deletes every blob…; sends no delete when nothing is left…; listing fails midway…; stops at the first failed batch… |
| 14 | invalidateByTag instead of dangerouslyDeleteByTag | the same 4 |
| 15 | CDN tag `PREVIEW_CACHE_TAG` instead of `previewCacheTag(slug)` | the same 4 |
| 16 | updateTag and dangerouslyDeleteByTag moved before the deletes | deletes every blob… |
| 17 | redirect dropped on success | deletes every blob…; sends no delete when nothing is left… |
| 18 | a do-while batch loop, so an empty listing still sends del([]) | sends no delete when nothing is left under the prefix |
| 19 | deleting each list page as soon as it arrives | deletes every blob…; listing fails midway… |
| 20 | try/catch removed | listing fails midway…; stops at the first failed batch… |
| 21 | updateTag and the CDN call skipped when `failed` | listing fails midway…; stops at the first failed batch… |
| 22 | the failure redirect going to '/admin' | listing fails midway…; stops at the first failed batch… |
| 23 | a try/catch around each batch, so the loop keeps going | stops at the first failed batch… |

Every one of the 14 tests in `describe('deletePreview')` fails under at least one mutation. No test survived, so the commit was not amended.

## Visual check (375 x 812, fixture stub, CI-like prefix)

- Stub: the `catch` branch of `buildPreviewIndex` temporarily returned `available: true` with `zz-check-delete` (active) and `zz-check-disabled` (disabled), each with `css/style.css` (1200 B) and `index.html` (3400 B). Before running it, I read `resolveBlobAuth` in `@vercel/blob` 2.8.0. With `BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN` blank it throws a `BlobError` before any request, even if `@vercel/oidc` refreshed a token, so no list/del could reach the store.
- Build: `<CI-like prefix> pnpm next build` passed (`● /preview/[slug]` › `/preview/zz-check-delete` came from the fixture). Server: `<CI-like prefix> ADMIN_USER=e2e-admin ADMIN_PASSWORD=e2e-password-not-a-secret pnpm next start -p 3100`, port 3100 was free beforehand. The server log showed only the Next banner.
- Playwright output, all checks in order:

```
PASS guard: /admin lists exactly the fixtures and no real slug (cards=["zz-check-delete","zz-check-disabled"] real=[])
PASS /admin: scroll delta is 0 (delta=0)
PASS /admin/zz-check-delete: no failure alert
PASS /admin/zz-check-delete: Excluir prévia details is closed
PASS /admin/zz-check-delete: label visible (label="Digite zz-check-delete para confirmar")
PASS /admin/zz-check-delete: input visible
PASS /admin/zz-check-delete (open): scroll delta is 0 (delta=0)
PASS mismatched slug: URL unchanged (url=http://localhost:3100/admin/zz-check-delete)
PASS mismatched slug: patternMismatch is true
PASS matching slug: landed on ?delete=failed (url=http://localhost:3100/admin/zz-check-delete?delete=failed)
PASS failure page: alert visible
PASS failure page: details is open
PASS failure page: css/style.css still listed
PASS failure page: index.html still listed
PASS /admin/zz-check-delete?delete=failed: scroll delta is 0 (delta=0)
PASS /admin/zz-check-disabled: Reativar prévia present
PASS /admin/zz-check-disabled: Excluir prévia summary present
PASS /admin/zz-check-disabled: scroll delta is 0 (delta=0)
18/18 checks passed
```

- The guard passed before any click. `heris-clinica-medica` and `odonto-castro` never appeared. The single "Confirmar exclusão" click with the matching slug ran the real action against blank credentials, and `list()` threw. That exercised the failure path end to end.
- Screenshots (viewed): scratchpad `admin-delete-open-375.png`, `admin-delete-failed-375.png`, `admin-delete-disabled-375.png` in `/private/tmp/claude-501/-Users-luiz-Documents-Projetos-Pessoal-pansarinitech/0842cfec-1f01-4f3c-a243-3642883e649f/scratchpad/`. On the open and failed pages, the "Prévia" iframe reads "Not found" because Blob has no credentials, which is expected for the stub.
- Cleanup: the 3100 server (PID 45917, cwd this repo) was killed, `git checkout -- src/lib/client-preview-source.ts`, `rm -rf .next`, then `git status --short` was empty. No UI fix was needed, so there was no follow-up commit.

## Final verification (tip 83e06b7, clean tree)

1. `rtk proxy pnpm lint`: `Checked 214 files … No fixes applied.`, exit 0.
2. `pnpm exec next typegen && pnpm exec tsc --noEmit`: `TypeScript: No errors found`, exit 0.
3. `pnpm test:unit`: `45 passed (45)`, `502 passed (502)`. `pnpm test:unit:coverage`: exit 0. The report lists only copy-button, contact, copy-email-button, hero and command-palette (pre-existing, under their component gates). None of client-preview-source.ts, admin/auth.ts, admin/actions.ts, admin/view.ts, admin/leads.ts, admin/lead-store.ts, admin/lead-actions.ts appears, so all are at 100%.
4. `pnpm verify:ci-safety`: `✓ No CI-safety violations found.`
5. `rm -rf .next`, then `<CI-like prefix> pnpm build` (with prebuild): exit 0 on the first run, with no fonts.gstatic.com error. Prebuild rewrote `src/data/skill-icons.json` only, which I restored with `git checkout --`. Then `<CI-like prefix> pnpm next build > build.log && pnpm verify:static build.log`: `✓ Static rendering verified: all /[locale] routes are SSG`. Route lines from the log:

```
├ ƒ /admin
├ ƒ /admin/[slug]
├ ƒ /admin/leads
├ ƒ /admin/leads/[id]
├ ƒ /admin/leads/new
├ ƒ /admin/login
├ ƒ /client-previews/[slug]/[...path]
├ ● /preview/[slug]
```

6. Port 3100 was free. `<CI-like prefix> PLAYWRIGHT_PORT=3100 pnpm test:e2e`: `15 passed (5.6s)` on the first run, including the admin login/Blob alert, leads board 375 px/Redis alert and Theme toggle tests. No rerun was needed.
7. `git status --short` is empty. `git log --oneline origin/main..HEAD` shows `83e06b7` and `e7bbb4a` on `feat/delete-preview`. Nothing was pushed. `.env.local`, `.vercel/`, `.gitignore`, `src/data/skill-icons.json` and `public/` have no diff against origin/main. Redis was never written to, and no command ran with real Blob credentials.

## Deviations from Plan

None. The plan was executed as written.

## Known Stubs

None. The fixture index used in the visual check was temporary and reverted, and it was never committed.

## Post-deploy check for Luiz (throwaway preview only, never a client one)

1. In the Vercel Blob dashboard, upload any small `index.html` as `zz-delete-check/index.html`, then click "Atualizar índice" on https://pansarini.dev/admin.
2. Open https://pansarini.dev/admin/zz-delete-check, open "Excluir prévia", type `zz-delete-check` and click "Confirmar exclusão". The dashboard no longer lists it.
3. `curl -sI https://pansarini.dev/preview/zz-delete-check` and `curl -sI https://pansarini.dev/client-previews/zz-delete-check/index.html` both return 404, and the store's file browser has no `zz-delete-check/` folder left.

## Self-Check: PASSED

- FOUND: src/lib/admin/actions.ts (`export async function deletePreview`)
- FOUND: src/lib/admin/actions.test.ts (`describe('deletePreview'`)
- FOUND: src/app/admin/[slug]/page.tsx (`Confirmar exclusão`)
- FOUND: README.md (`Excluir prévia`)
- FOUND: commit e7bbb4a
- FOUND: commit 83e06b7
