---
phase: quick-261005-qnn
plan: 01
status: complete
subsystem: client-previews
tags: [admin, auth, server-actions, vercel-blob, unstable_cache, cdn-cache, cache-tags, noindex, e2e]
requires: []
provides:
  - "Cached Blob index (unstable_cache, tag client-previews, 300 s) shared by /preview/<slug> and the admin"
  - "CDN-cacheable Blob assets (ETag, Vercel-CDN-Cache-Control, cache tags client-previews + client-preview:<slug>); 404s no-store"
  - "Env-gated admin session (HMAC cookie keyed with ADMIN_PASSWORD) and requireAdmin-guarded Server Actions"
  - "/admin dashboard, /admin/login, /admin/<slug> (PT-BR, 375 px, noindex, dynamic)"
affects: [src/lib/client-preview-source.ts, src/app/preview, src/app/admin, src/proxy.ts, next.config.ts, playwright.config.ts, README.md]
tech-stack:
  added: ["@vercel/functions@^3.9.11"]
  patterns:
    - "await connection() before reading admin env so admin routes are never prerendered"
    - "requireAdmin() as the first statement of every admin page and Server Action"
    - "One sandbox constant shared by PreviewViewer and the admin frame"
key-files:
  created:
    - src/lib/admin/auth.ts
    - src/lib/admin/auth.test.ts
    - src/lib/admin/actions.ts
    - src/lib/admin/actions.test.ts
    - src/lib/admin/view.ts
    - src/lib/admin/view.test.ts
    - src/components/preview/frame-sandbox.ts
    - src/components/admin/copy-button.tsx
    - src/components/admin/login-form.tsx
    - src/app/admin/layout.tsx
    - src/app/admin/login/page.tsx
    - src/app/admin/page.tsx
    - src/app/admin/[slug]/page.tsx
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/lib/client-preview-source.ts
    - src/lib/client-preview-source.test.ts
    - src/app/preview/[slug]/page.tsx
    - src/proxy.ts
    - next.config.ts
    - vitest.config.mts
    - src/components/preview/preview-viewer.tsx
    - playwright.config.ts
    - tests/e2e.spec.ts
    - scripts/check-ci-safety.mjs
    - README.md
decisions:
  - "Nested Blob folder markers (paths ending in '/') are not counted as files, same as the root marker"
  - "Admin layout also loads IBM Plex Mono so font-mono URLs, slugs and paths render monospace"
  - "formatDateTime builds its Intl formatter per call so the unit test can force TZ=UTC and prove the America/Sao_Paulo zone is applied"
  - "Login error e2e assertion is scoped to the form because Next's route announcer also carries role=alert"
metrics:
  started: 2026-10-05T22:37:35Z
  completed: 2026-10-05T23:11:42Z
  duration: 34min
  tasks_completed: 3
  tasks_total: 3
  files_changed: 26
---

# Quick 261005-qnn Plan 01: Hidden admin for client previews Summary

A single Blob index, cached with `unstable_cache` (tag `client-previews`, 300 s), now feeds both `/preview/<slug>` and a hidden `/admin`, so page rendering no longer calls Blob per request. Blob assets are CDN-cacheable with per-site cache tags. The admin is gated on `ADMIN_USER`/`ADMIN_PASSWORD` (404 without them), uses an HMAC-signed `Path=/admin` cookie, and lets Luiz list every preview, check files and warnings, copy URLs, refresh the index and purge one site's CDN cache.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1. Cached Blob index, index-backed previews, CDN-cacheable assets | `27d353b` feat(preview): resolve previews from a cached Blob index and CDN-cache Blob assets | package.json, pnpm-lock.yaml, src/lib/client-preview-source.ts, src/lib/client-preview-source.test.ts, src/app/preview/[slug]/page.tsx (5) |
| 2. Env-gated session, Server Actions, view helpers, proxy and headers | `5c53e13` feat(admin): env-gated admin session, server actions and routing | src/lib/admin/{auth,actions,view}.ts + tests, src/proxy.ts, next.config.ts, vitest.config.mts (9) |
| 3. Admin pages, e2e, README | `eee9a92` feat(admin): hidden admin UI for client previews | frame-sandbox.ts, preview-viewer.tsx, admin/{login-form,copy-button}.tsx, app/admin/{layout,login/page,page,[slug]/page}.tsx, playwright.config.ts, tests/e2e.spec.ts, scripts/check-ci-safety.mjs, README.md (12) |

Each commit went through the husky pre-commit hook (`pnpm lint`, `pnpm verify:ci-safety`, `pnpm test:unit`). No `--no-verify`. Nothing pushed. `.claude-flow/` was never staged.

## Final verification (clean tree at `eee9a92`, no mutations left)

| # | Command | Real output |
|---|---------|-------------|
| 1 | `pnpm lint` | `Checked 203 files in 62ms. No fixes applied.` |
| 2 | `pnpm exec next typegen && pnpm exec tsc --noEmit` | `✓ Types generated successfully`, tsc exit 0, no errors |
| 3 | `pnpm test:unit` | `Test Files 42 passed (42)`, `Tests 372 passed (372)` |
| 3 | `pnpm test:unit:coverage` | exit 0, 372/372. lcov: `client-preview-source.ts` LH 83/83, BRH 70/70, FNH 21/21; `admin/auth.ts` 22/22, 18/18, 8/8; `admin/actions.ts` 23/23, 10/10, 6/6; `admin/view.ts` 19/19, 10/10, 13/13 |
| 4 | `pnpm verify:ci-safety` | `✓ No CI-safety violations found.` |
| 4 | `pnpm verify:message-length` | `✓ all seo.descriptions.* within 160 chars` |
| 5 | `pnpm build` (with prebuild) | exit 0. Prebuild rewrote `src/data/skill-icons.json`, restored with `git checkout --`, not committed |
| 5 | `pnpm next build > log` + `pnpm verify:static log` | exit 0, `✓ Static rendering verified: all /[locale] routes are SSG` |
| 6 | `PLAYWRIGHT_PORT=3100 pnpm test:e2e` | `21 passed (4.8s)`: 18 existing + 3 new admin tests |
| 7 | `git status --short` | ` M .claude-flow/policy/state.json`, `?? public/client-previews/.claude-flow/` only |

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

| Run | Build | Result |
|-----|-------|--------|
| 1 | Task 3 code before the mono-font fix | 21 passed |
| 2 | after the mono-font fix | 20 passed, 1 failed: `Theme toggle persistence across reload › toggling to dark, reloading, still dark` |
| 3 | same build | 20 passed, 1 failed: same theme test |
| final | clean tree at `eee9a92` | 21 passed |

The theme failure is pre-existing and unrelated (see Deferred Issues): on a build of the base commit `e16f684` the same test failed 10/10 with one worker and 5/10 in parallel. The 3 admin tests passed in every run.

## Task 3 runtime checks

### Env-unset 404 (no ADMIN_* in the shell, no `.env*` in the repo, `pnpm next start -p 3100`)

```
== curl -sI /admin
HTTP/1.1 404 Not Found
X-Robots-Tag: noindex, nofollow, noarchive
Cache-Control: private, no-store
== curl -sI /admin/login
HTTP/1.1 404 Not Found
X-Robots-Tag: noindex, nofollow, noarchive
Cache-Control: private, no-store
== curl -sI /admin/exemplo
HTTP/1.1 404 Not Found
X-Robots-Tag: noindex, nofollow, noarchive
Cache-Control: private, no-store
== curl -sI /client-previews/nope/index.html
HTTP/1.1 404 Not Found
X-Robots-Tag: noindex, nofollow, noarchive
cache-control: no-store
```

None is a 500 or a redirect to `/en`. That build was made without the env, so the 404 comes from runtime, and with the env set (e2e) the same build serves the login.

### 375x812 screenshots (headless Chromium, logged in, scratchpad only, not committed)

Scratchpad: `/private/tmp/claude-501/-Users-luiz-Documents-Projetos-Pessoal-pansarinitech/4eb08ada-19c1-4961-bd66-ab204f6cfded/scratchpad/`

- `admin-login-375-light.png`, `admin-login-375-dark.png`
- `admin-dashboard-375-light.png`, `admin-dashboard-375-dark.png`
- `admin-detail-375-light.png`, `admin-detail-375-dark.png`

`document.documentElement.scrollWidth - clientWidth` was 0 on the dashboard and the detail page in both themes. Viewed with Read: the header buttons wrap (Atualizar índice / Copiar todas as URLs / Sair), the URL breaks inside the card, metadata sits in a 2-column grid, and the detail iframe renders the exemplo page at full width.

Limitation: without Blob credentials locally, only the repo row and the "Blob indisponível" alert could be rendered. The Blob-only parts (file list, warnings list and badge, "Limpar cache deste site") are covered by the view-helper unit tests and type checks, not by a screenshot or e2e. Step 2 of the checklist below covers them on Vercel.

## Mutation proofs

Each mutation was applied alone, the suite run, then the file restored with `git checkout -- <file>`. `git status` was clean after every batch.

### Task 1 (`pnpm exec vitest --run src/lib/client-preview-source.test.ts`, 54 tests)

| Mutation | Failing test(s) |
|----------|-----------------|
| findClientPreview ignores hasIndex | returns undefined for a folder without index.html |
| findClientPreview calls buildPreviewIndex directly | returns the preview from the cached index |
| unstable_cache revalidate 60 | caches the index for 5 minutes under the client-previews tag |
| single list call (no pagination) | follows the list cursor until hasMore is false |
| invalid-slug warning removed | warns about a folder name outside [a-z0-9-] |
| missing-index warning removed | ignores root-level blobs and lists an empty folder without files or a Blob read |
| missing-title warning removed | warns when index.html has no title...; reads an index.html that disappeared between list and get as empty |
| absolute-asset-refs warning removed | warns about root-absolute src and href values...; lists at most 3 unique absolute refs... |
| shadowed-by-repo warning removed | warns when a repo preview with the same slug wins |
| root-level blobs not skipped | ignores root-level blobs and lists an empty folder... |
| uploadedAt left as Date | groups blobs by folder...; ignores root-level blobs...; is plain JSON with an ISO generatedAt; sorts previews newest first |
| try/catch removed from buildPreviewIndex | returns an unavailable empty index when list throws; ...when get throws; findClientPreview returns undefined instead of throwing when Blob has no credentials |
| addCacheTag dropped | streams the blob with ... CDN cache headers and tags; forwards If-None-Match and answers a tagged 304 |
| Vercel-CDN-Cache-Control dropped on 304 | forwards If-None-Match and answers a tagged 304 |
| 404 without no-store | all 3 "returns an uncached 404" tests |
| nested folder marker counted as a file (extra) | does not count a nested folder marker as a file |

### Task 2 (`pnpm exec vitest --run src/lib/admin`, 55 tests)

| Mutation | Failing test(s) |
|----------|-----------------|
| verifySession skips the expiry check | rejects an expired token; defaults to the current time; requireAdmin redirects with an expired cookie |
| verifySession returns true without comparing signatures | flipped signature; changed expiry with old signature; other password or user; requireAdmin with a cookie signed by another password |
| signSession keys the HMAC with the user | token signed with another password or for another user; requireAdmin with another password's cookie |
| credentialsMatch compares raw Buffers without hashing | returns false for different lengths without throwing; all 3 login failure tests (RangeError) |
| getAdminCredentials accepts '' | returns null when either value is empty |
| requireAdmin skips the env check | 404s when the env is unset, even with a cookie |
| assertAdminEnabled drops `await connection()` | 404s when the env is unset, after opting out of prerendering; awaits connection() before reading the env |
| refreshIndex without requireAdmin | refreshIndex invalidates nothing without a session |
| purgePreview without requireAdmin | purgePreview invalidates nothing without a session |
| purgePreview without isPreviewSlug | ignores a slug outside [a-z0-9-] |
| logout deletes 'admin_session' without the path | deletes the Path=/admin cookie and redirects to the login |
| cookie sameSite 'lax' | sets an 8 h HttpOnly, SameSite=Strict, Path=/admin session... |
| login without the 400 ms delay | all 3 login failure tests (timing) |
| formatDateTime without timeZone | formats in pt-BR on São Paulo time whatever the server time zone |
| logout without requireAdmin (extra) | redirects without deleting anything when there is no session |
| findAdminPreview prefers the repo row (extra) | prefers the Blob row when the slug is also in the repo |
| publicUrls without de-duplication (extra) | keeps URLs that resolve, once each, in list order |
| previewAssetHref without encoding (extra) | encodes each path segment |

### Task 3 e2e (rebuilt per mutation, `PLAYWRIGHT_PORT=3100 pnpm exec playwright test tests/e2e.spec.ts --project=e2e -g "Hidden admin"`)

| Build | Mutation | Result |
|-------|----------|--------|
| (a) | `/admin/:path*` header rule removed AND logout `delete(ADMIN_SESSION_COOKIE)` | 2 failed, 1 passed. Redirect test: `Expected substring: "noarchive"`, `Received string: "noindex, nofollow"`. Login test after "Sair": `Expected pattern: /\/admin\/login$/`, `Received string: "http://localhost:3100/admin"` (line 368, the second goto). Wrong-password test passed |
| (b) | `admin` removed from the proxy matcher | 3 failed. Redirect test: `Expected pattern: /^(https?:\/\/[^/]+)?\/admin\/login$/`, `Received string: "/en/admin"`. The other two time out on fill because /admin/login is redirected to /en/admin/login (404) |
| (c, extra) | admin iframe sandbox gets `allow-same-origin` AND the login form drops the error `<p role="alert">` | 2 failed, 1 passed. Wrong-password: `element(s) not found` for the alert. Login test: sandbox `Received: "... allow-popups-to-escape-sandbox allow-same-origin"` |

After the three builds, the final clean `pnpm build` / `pnpm next build` above replaced the mutated `.next`.

## Contingencies

- `serverExternalPackages`: not needed. `pnpm next build` resolved `@vercel/functions` without errors and `ws` was not installed.
- `buildPreviewIndex()` in `generateStaticParams`: not needed. `unstable_cache` works there at build. Without Blob credentials the index is empty, so only `/preview/exemplo` is prerendered.
- Lockfile: `pnpm add` moved `third-party-web` 0.29.2 to 0.30.0 through `@paulirish/trace_engine` (lhci). I reverted those 3 hunks by hand. The committed diff only adds `@vercel/functions@3.9.11` and `@vercel/oidc@4.0.0`, with `ws@8.20.0` linked as an optional peer that was already in the tree. `pnpm install --frozen-lockfile` passed. Supply chain check: `npm view @vercel/functions@3.9.11 repository.url` printed `git+https://github.com/vercel/vercel.git`, license Apache-2.0, latest 3.9.11.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Nested folder markers counted as files**
- **Found during:** Task 1
- **Issue:** The plan only treats `<slug>/` (empty remainder) as a folder marker. The Blob dashboard's "create folder" inside a preview stores `<slug>/img/` as a zero-byte blob, which would have shown up as a 0 B file `img/` with a broken asset link.
- **Fix:** Any remainder ending in `/` is a marker, not a file. Added a test and an extra mutation.
- **Files modified:** src/lib/client-preview-source.ts, src/lib/client-preview-source.test.ts
- **Commit:** 27d353b

**2. [Rule 1 - Bug] `font-mono` rendered in the sans face in the admin**
- **Found during:** Task 3 (375 px screenshots)
- **Issue:** `--font-mono` maps to `--font-ibm-plex-mono`, which only the `[locale]` layout loads. In the admin shell URLs, slugs and file paths fell back to the sans font.
- **Fix:** The admin layout also loads `IBM_Plex_Mono` (weight 400 only) with the same variable name.
- **Files modified:** src/app/admin/layout.tsx
- **Commit:** eee9a92

### Implementation choices worth knowing

- `formatDateTime` creates its `Intl.DateTimeFormat` on each call. This machine runs on America/Sao_Paulo, so a module-level formatter would have let the "formatDateTime without timeZone" mutation pass. The test stubs `TZ=UTC`, which Node applies to ICU right away.
- The wrong-password e2e reads `page.locator('form').getByRole('alert')` rather than `page.getByRole('alert')`, because Next's app-router announcer also sets `role = 'alert'` (`node_modules/next/dist/client/components/app-router-announcer.js:25`). An unscoped locator could match two elements.
- The e2e Location check accepts an absolute or a relative `/admin/login` and rejects `/en/...`.
- The warnings badge is pluralized ("1 aviso" / "N avisos") instead of the literal "N aviso(s)".
- The login card uses the `Card` primitive. Buttons in the dashboard header are `size="sm"` so all three fit on one line at 375 px.
- `getAdminCredentials(env)` keeps the injectable `env` parameter, but the test uses `vi.stubEnv`, because Next's `ProcessEnv` typing requires `NODE_ENV` in a literal object.
- Comments added: one why-line on folder markers, one on the empty index for missing credentials, one on `connection()`, one on the e2e env, and the reworded `revalidate` and proxy comments. No IDs or narration.

## Deferred Issues

- **Pre-existing flaky e2e: `Theme toggle persistence across reload › toggling to dark, reloading, still dark`.** `ThemeToggle` calls `setTheme` inside `document.startViewTransition(() => ...)`, whose callback runs on a later frame, and the test reloads right after the click, so localStorage sometimes still says `light`. Reproduced on a build of the base commit `e16f684` (extracted with `git archive` into the scratchpad, no branch switch): 10/10 failed with `--workers=1` and 5/10 in parallel with `--repeat-each=10`. Out of scope, not touched. Likely fix in a separate task: have the test wait for `localStorage.theme === 'dark'` (or `html.dark`) before reloading.
- `pnpm verify:metadata` was not part of this plan's gates and was not run. In the previous task port 3001 was held by another project.

## Known Stubs

None. Every rendered value comes from the registry or the cached index.

## Threat Flags

None. The new surfaces (admin routes, cookie, Server Actions, CDN tags) are all in the plan's threat register, and each `mitigate` item is implemented and tested: T-qnn-01/02/03/07 by unit tests and mutations, T-qnn-05/08/12 by e2e and mutations, T-qnn-06 by design (no `NEXT_PUBLIC_`, read only in `node:crypto` server modules).

## First admin login on Vercel (for Luiz)

1. Add `ADMIN_USER` and `ADMIN_PASSWORD` (Production, marked Sensitive; for the password use e.g. `openssl rand -base64 24`) and redeploy.
2. Open https://pansarini.dev/admin, log in, and check that the Héris preview (`heris-clinica-medica`) is listed with its file count, no unexpected warnings, and a working "Abrir". Open its page and check the file list, the frame and "Limpar cache deste site". This is the first time the Blob-only UI renders with real data.
3. `curl -sI https://pansarini.dev/admin` shows `x-robots-tag: noindex, nofollow, noarchive` and a 307 to `/admin/login`.
4. Run `curl -sI https://pansarini.dev/client-previews/heris-clinica-medica/index.html` twice. The second response should show `x-vercel-cache: HIT` and an `etag`.
5. Click "Sair".

## Self-Check: PASSED

- Files: all 13 created files listed in key-files exist on disk.
- Commits: `27d353b`, `5c53e13`, `eee9a92` are in `git log`.
- Tree: only `.claude-flow/policy/state.json` (modified) and `public/client-previews/.claude-flow/` (untracked) outside the commits. No server I started is still running on 3100. The only other `next-server` is PID 62642 from another project, untouched.
