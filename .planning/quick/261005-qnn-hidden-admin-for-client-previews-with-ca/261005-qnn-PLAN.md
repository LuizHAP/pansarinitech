---
phase: quick-261005-qnn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - pnpm-lock.yaml
  - src/lib/client-preview-source.ts
  - src/lib/client-preview-source.test.ts
  - src/app/preview/[slug]/page.tsx
  - src/lib/admin/auth.ts
  - src/lib/admin/auth.test.ts
  - src/lib/admin/actions.ts
  - src/lib/admin/actions.test.ts
  - src/lib/admin/view.ts
  - src/lib/admin/view.test.ts
  - src/proxy.ts
  - next.config.ts
  - vitest.config.mts
  - src/components/preview/frame-sandbox.ts
  - src/components/preview/preview-viewer.tsx
  - src/components/admin/login-form.tsx
  - src/components/admin/copy-button.tsx
  - src/app/admin/layout.tsx
  - src/app/admin/login/page.tsx
  - src/app/admin/page.tsx
  - src/app/admin/[slug]/page.tsx
  - playwright.config.ts
  - tests/e2e.spec.ts
  - scripts/check-ci-safety.mjs
  - README.md
autonomous: true
requirements: [quick-261005-qnn]
user_setup:
  - service: vercel-env
    why: "Admin credentials. With either one missing, every /admin route is a 404."
    env_vars:
      - name: ADMIN_USER
        source: "Chosen by Luiz. Vercel Dashboard -> pansarinitech -> Settings -> Environment Variables (Production, mark Sensitive), or `vercel env add ADMIN_USER production`. Redeploy afterwards."
      - name: ADMIN_PASSWORD
        source: "A long random value (e.g. `openssl rand -base64 24`). Same place, also marked Sensitive. Changing it later logs out every session."

must_haves:
  truths:
    - "With ADMIN_USER or ADMIN_PASSWORD unset or empty, /admin, /admin/login and /admin/<slug> return 404, even on a build made without them that is then started with them (admin routes are dynamic, never prerendered)"
    - "/admin without a valid admin_session cookie redirects (307) to /admin/login with no locale redirect; wrong credentials show 'Usuário ou senha inválidos.' after ~400 ms; correct ones set an 8 h HttpOnly, SameSite=Strict, Path=/admin cookie (Secure in production) and land on the dashboard; 'Sair' deletes it"
    - "Every admin Server Action (logout, refreshIndex, purgePreview) runs requireAdmin before any side effect; without a valid session no tag is invalidated"
    - "The dashboard lists repo and Blob previews with cliente, slug, idioma, arquivos, tamanho, atualizado em (pt-BR, America/Sao_Paulo), a copyable public URL, 'Abrir', a warnings badge and the source; 'Copiar todas as URLs' copies every URL that resolves; an Alert explains when Blob is unavailable"
    - "/admin/<slug> shows metadata, the copyable URL, every Blob file linking to /client-previews/<slug>/<path>, the warnings, an iframe with the exact PreviewViewer sandbox, and 'Limpar cache deste site' for Blob previews"
    - "/preview/<slug> resolves the repo registry first, then the cached Blob index (unstable_cache key client-preview-index, tag client-previews, 300 s); page rendering makes no per-request Blob get(); generateStaticParams = registry slugs + index slugs"
    - "Blob asset 200/304 responses carry ETag, Cache-Control 'public, max-age=0, must-revalidate', Vercel-CDN-Cache-Control 'max-age=300, stale-while-revalidate=86400' and cache tags client-previews + client-preview:<slug>; 404s carry Cache-Control no-store and no tags"
    - "/admin responses carry X-Robots-Tag 'noindex, nofollow, noarchive' and no-store; /admin is not in robots.txt, the sitemap or any site link"
  artifacts:
    - path: "src/lib/client-preview-source.ts"
      provides: "Blob index builder, cached index, index-backed findClientPreview, CDN-cacheable servePreviewAsset"
      exports: ["buildPreviewIndex", "getPreviewIndex", "findClientPreview", "servePreviewAsset", "isPreviewSlug", "parsePreviewMeta", "isSafePreviewPath", "PREVIEW_CACHE_TAG", "previewCacheTag"]
    - path: "src/lib/admin/auth.ts"
      provides: "Env credentials, constant-time compare, HMAC session sign/verify, assertAdminEnabled, requireAdmin"
      exports: ["ADMIN_SESSION_COOKIE", "SESSION_TTL_MS", "getAdminCredentials", "credentialsMatch", "signSession", "verifySession", "assertAdminEnabled", "requireAdmin"]
    - path: "src/lib/admin/actions.ts"
      provides: "'use server' login, logout, refreshIndex, purgePreview"
      contains: "'use server'"
    - path: "src/lib/admin/view.ts"
      provides: "Admin row assembly and pt-BR formatting"
      exports: ["listAdminPreviews", "findAdminPreview", "publicUrls", "previewUrl", "previewAssetHref", "formatBytes", "formatDateTime", "WARNING_MESSAGES"]
    - path: "src/app/admin/page.tsx"
      provides: "Dashboard"
      contains: "Prévias de clientes"
    - path: "src/app/admin/[slug]/page.tsx"
      provides: "Per-preview analysis page"
      contains: "Limpar cache deste site"
    - path: "src/components/preview/frame-sandbox.ts"
      provides: "Single sandbox value shared by PreviewViewer and the admin frame"
      contains: "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
  key_links:
    - from: "src/lib/client-preview-source.ts findClientPreview"
      to: "getPreviewIndex (unstable_cache)"
      via: "await getPreviewIndex() lookup by slug with hasIndex"
      pattern: "getPreviewIndex\\(\\)"
    - from: "src/lib/client-preview-source.ts servePreviewAsset"
      to: "@vercel/functions addCacheTag"
      via: "await addCacheTag([PREVIEW_CACHE_TAG, previewCacheTag(slug)])"
      pattern: "addCacheTag\\("
    - from: "src/app/admin/page.tsx, src/app/admin/[slug]/page.tsx, src/lib/admin/actions.ts"
      to: "src/lib/admin/auth.ts requireAdmin"
      via: "await requireAdmin() first"
      pattern: "await requireAdmin\\(\\)"
    - from: "src/lib/admin/actions.ts"
      to: "next/cache updateTag + @vercel/functions invalidateByTag"
      via: "refreshIndex / purgePreview"
      pattern: "invalidateByTag\\("
    - from: "src/proxy.ts matcher"
      to: "/admin"
      via: "admin excluded from next-intl"
      pattern: "client-previews\\|admin"
---

<objective>
Give Luiz a hidden, env-gated admin at `/admin` to analyse every client preview and copy their public URLs. A single Blob index (cached with `unstable_cache`, tag `client-previews`) feeds both the admin and the public `/preview/<slug>` route, so page rendering no longer calls Blob per request. Blob assets become CDN-cacheable with cache tags, and the admin can refresh the index or purge one site's CDN cache.

Purpose: one place to see what is uploaded, what is broken (warnings), and which URLs to send to clients. The public site stays fast and cached.
Output: `@vercel/functions` dependency; index + CDN changes in `src/lib/client-preview-source.ts`; `src/lib/admin/{auth,actions,view}.ts` with unit tests; `/admin`, `/admin/login`, `/admin/[slug]`; proxy/headers changes; e2e coverage; README EN/PT admin section.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@.planning/quick/261005-jih-client-previews-from-vercel-blob-without/261005-jih-SUMMARY.md
@src/lib/client-preview-source.ts
@src/lib/client-preview-source.test.ts
@src/data/client-previews.ts
@src/app/preview/[slug]/page.tsx
@src/app/preview/[slug]/layout.tsx
@src/components/preview/preview-viewer.tsx
@src/proxy.ts
@next.config.ts
@playwright.config.ts
@vitest.config.mts

<repo_rules>
These come from the user and apply to every task:
- Code comments: as few as possible, only a non-obvious why. No ticket/task/plan IDs, no "added for X", no docblocks restating names. Leave existing comments alone unless the line they describe changes.
- Branch `feat/preview-admin` (already checked out). Do NOT push. One commit per task, explicit paths only (never `git add -A` / `git add .`). Never stage `.claude-flow/` (the modified `.claude-flow/policy/state.json`) or the untracked `public/client-previews/.claude-flow/`.
- Husky pre-commit runs `pnpm lint`, `pnpm verify:ci-safety`, `pnpm test:unit`; all must pass at each commit. Never `--no-verify`. If Biome only complains about import order or formatting, run `pnpm exec biome check --write <touched files>`.
- During tasks build with `pnpm next build` (what CI runs). `pnpm build` runs a `prebuild` hook that rewrites tracked `public/feed*.xml` and skill icons; it is run once in final verification and those regenerated files are restored, never committed.
- `cacheComponents` stays OFF. Do not add `'use cache'`.
- `next/link` is banned by Biome (`noRestrictedImports`) and the locale-aware Link would prefix `/en`. Admin links are plain `<a>`; `target="_blank"` always with `rel="noopener noreferrer"`.
- Port 3000 was held at planning time by another project's server (`next-server v16.3.0`, PID 62642, cwd `.../Pessoal/sales-crm`). Never kill a process whose cwd is not this repo. Playwright runs on 3100 via the `PLAYWRIGHT_PORT` override added in Task 3. Before each Playwright run after a rebuild, kill only servers on 3100 whose cwd is this repo (`lsof -ti:3100`, check cwd with `lsof -p <pid> | awk '$4=="cwd"'`), because `reuseExistingServer` would reuse a stale build.
- Temp files (build logs, screenshots) go in the session scratchpad or `mktemp`, never `/tmp` and never the repo.
</repo_rules>

<interfaces>
Verified against installed packages and the npm registry on 2026-10-05. Use these directly.

@vercel/blob 2.8 (`node_modules/@vercel/blob/dist/index.d.ts`):
```ts
declare function list(options?: { limit?: number; prefix?: string; cursor?: string; mode?: 'expanded' | 'folded'; token?: string }): Promise<ListBlobResult>;
interface ListBlobResult { blobs: ListBlobResultBlob[]; cursor?: string; hasMore: boolean }
interface ListBlobResultBlob { url: string; downloadUrl: string; pathname: string; size: number; uploadedAt: Date; etag: string }
// list() takes NO `access` option (the token scopes it to the store). get() keeps { access: 'private' }.
// Without credentials list()/get() throw BlobError("Vercel Blob: No blob credentials found...").
// The dashboard's "create folder" stores a zero-byte blob whose pathname ends in "/".
```

@vercel/functions 3.9.11 (package root exports, both resolve immediately outside Vercel):
```ts
export declare const addCacheTag: (tag: string | string[]) => Promise<void>;
export declare const invalidateByTag: (tag: string | string[]) => Promise<void>; // marks stale: next hit serves stale once, revalidates in background
// Optional peers (ws, @aws-sdk/credential-provider-web-identity) are NOT needed; do not install them.
```

next 16.2.4 (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/`):
```ts
import { unstable_cache, updateTag } from 'next/cache';
unstable_cache(fn, keyParts, { tags?: string[]; revalidate?: number | false }) // returns a cached fn; tags propagate to the ISR entry of the page that called it
updateTag(tag: string): void // ONLY inside Server Actions; expires immediately
import { cookies } from 'next/headers';   // (await cookies()).get(name)?.value / .set(name, value, opts) / .delete({ name, path })
import { connection } from 'next/server'; // await connection() marks the render dynamic (not allowed inside unstable_cache)
import { notFound, redirect } from 'next/navigation'; // both throw; never call them inside try/catch
```
- Outside a Next request, `unstable_cache` throws `Invariant: incrementalCache missing`, so every Vitest file that imports `client-preview-source.ts` must `vi.mock('next/cache', ...)`.
- `cookies().delete('admin_session')` targets Path=/ and would NOT remove a Path=/admin cookie. Use `.delete({ name: ADMIN_SESSION_COOKIE, path: '/admin' })`.
- A `redirect()` in a dynamic server component with no `loading.tsx` above it is a real 307 with `Location`. Do not add `loading.tsx` under `src/app/admin`.

Vercel CDN (docs.vercel.com/docs/caching/cdn-cache, fetched 2026-10-05): cacheable statuses are 200, 404, 410, 301, 302, 307, 308 (304 is never cached); `no-store`/`no-cache`/`private` in Cache-Control make a response uncacheable; `Vercel-CDN-Cache-Control` is not forwarded to the browser.

Existing code (unchanged contracts):
```ts
// src/data/client-previews.ts
export type ClientPreview = { slug: string; client: string; locale: 'pt' | 'en' };
export const clientPreviews: readonly ClientPreview[]; // [{ slug: 'exemplo', client: 'Cliente Exemplo', locale: 'pt' }]
export function getClientPreview(slug: string): ClientPreview | undefined;
// src/lib/client-preview-source.ts (today)
export function isSafePreviewPath(slug: string, segments: readonly string[]): boolean;
export function parsePreviewMeta(html: string, slug: string): Pick<ClientPreview, 'client' | 'locale'>;
export const findClientPreview: (slug: string) => Promise<ClientPreview | undefined>; // react cache()
export async function servePreviewAsset(slug: string, segments: readonly string[], ifNoneMatch: string | null): Promise<Response>;
```

New contracts this plan creates (Task 1 and 2 implement them, Task 3 consumes them):
```ts
// src/lib/client-preview-source.ts (added)
export const PREVIEW_CACHE_TAG = 'client-previews';
export function previewCacheTag(slug: string): string; // `client-preview:${slug}`
export function isPreviewSlug(slug: string): boolean;  // the existing /^[a-z0-9-]+$/ SLUG regex
export type PreviewWarningCode = 'invalid-slug' | 'missing-index' | 'missing-title' | 'absolute-asset-refs' | 'shadowed-by-repo';
export type PreviewWarning = { code: PreviewWarningCode; detail?: string };
export type PreviewFile = { path: string; size: number; uploadedAt: string }; // path relative to the slug, ISO date
export type IndexedPreview = ClientPreview & {
  hasIndex: boolean; files: PreviewFile[]; fileCount: number; totalSize: number; updatedAt: string; warnings: PreviewWarning[];
};
export type PreviewIndex = { generatedAt: string; available: boolean; previews: IndexedPreview[] };
export async function buildPreviewIndex(): Promise<PreviewIndex>;
export const getPreviewIndex: () => Promise<PreviewIndex>;

// src/lib/admin/auth.ts
export const ADMIN_SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export type AdminCredentials = { user: string; password: string };
export function getAdminCredentials(env?: NodeJS.ProcessEnv): AdminCredentials | null;
export function credentialsMatch(input: string, expected: string): boolean;
export function signSession(credentials: AdminCredentials, expiresAtMs: number): string;
export function verifySession(token: string | undefined, credentials: AdminCredentials, nowMs?: number): boolean;
export async function assertAdminEnabled(): Promise<AdminCredentials>;
export async function requireAdmin(): Promise<void>;

// src/lib/admin/actions.ts ('use server'; only async functions and types exported)
export type LoginState = { error: string | null };
export async function login(previous: LoginState, formData: FormData): Promise<LoginState>;
export async function logout(): Promise<void>;
export async function refreshIndex(): Promise<void>;
export async function purgePreview(slug: string): Promise<void>;

// src/lib/admin/view.ts
export type AdminPreview = ClientPreview & {
  source: 'repo' | 'blob'; url: string; hasIndex: boolean; files: PreviewFile[];
  fileCount: number | null; totalSize: number | null; updatedAt: string | null; warnings: PreviewWarning[];
};
export function previewUrl(slug: string): string;
export function previewAssetHref(slug: string, path: string): string;
export function formatBytes(bytes: number): string;
export function formatDateTime(iso: string): string;
export const WARNING_MESSAGES: Record<PreviewWarningCode, string>;
export function listAdminPreviews(index: PreviewIndex): AdminPreview[];
export function findAdminPreview(index: PreviewIndex, slug: string): AdminPreview | undefined;
export function publicUrls(previews: readonly AdminPreview[]): string[];

// src/components/preview/frame-sandbox.ts
export const PREVIEW_FRAME_SANDBOX = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';
```
</interfaces>

<decision_coverage>
Locked spec item, then the task that covers it:
- 1 Auth: env ADMIN_USER/ADMIN_PASSWORD, notFound when either is missing/empty: Task 2 (auth.ts, unit tests), Task 3 (pages call it; env-less curl check)
- 1 Login form + Server Action, SHA-256 + timingSafeEqual on both values, generic error + ~400 ms delay: Task 2 (actions.ts), Task 3 (login page + form, e2e)
- 1 Cookie format `<expiresAtMs>.<base64url HMAC-SHA256(key=password, msg=user:expiresAtMs)>`, HttpOnly, Secure in production, SameSite=Strict, Path=/admin, 8 h, redirect /admin; password change invalidates: Task 2 (unit), Task 3 (e2e cookie attributes)
- 1 requireAdmin on every admin page AND inside every admin Server Action, invalid/expired to /admin/login, logout deletes the cookie: Task 2 (actions unit tests), Task 3 (pages, e2e logout)
- 1 Hidden: no links, metadata robots, X-Robots-Tag + Cache-Control for /admin/:path*, not in robots.txt or sitemap, proxy exclusion, own document shell, PT-BR only: Task 2 (proxy, next.config), Task 3 (layout, e2e headers, grep gates)
- 2 buildPreviewIndex (paginated expanded list, grouping, per-slug fields, meta via get + parsePreviewMeta, 5 warnings, JSON-serializable, empty on error): Task 1
- 2 getPreviewIndex = unstable_cache(..., ['client-preview-index'], { tags: ['client-previews'], revalidate: 300 }): Task 1
- 2 findClientPreview registry first then index (must have index.html), no per-request get, generateStaticParams = registry + index: Task 1
- 3 `@vercel/functions` ^3.9; 200/304 ETag + Cache-Control + Vercel-CDN-Cache-Control + addCacheTag; 404 not cached long; keep X-Robots-Tag/CORS rules: Task 1
- 4 Dashboard (title, generatedAt, Atualizar índice, Sair, rows with all fields, copy, Abrir, warnings badge, source, Copiar todas as URLs, empty state, 375 px): Task 3 (UI), Task 2 (view helpers, refreshIndex)
- 4 Detail page (metadata, URL, files linking to /client-previews, warnings, sandboxed iframe with the same sandbox, Limpar cache deste site): Task 3 (UI), Task 2 (purgePreview)
- 5 Unit tests (session, credentials, index + every warning, findClientPreview via index, CDN headers + tags): Tasks 1 and 2
- 5 e2e (login shown without session, wrong password, correct login lists exemplo, X-Robots-Tag) + env-unset 404 check: Task 3 (e2e) and Task 2 (unit notFound tests) plus Task 3 curl check
- 5 Gates lint, tsc, test:unit, build, test:e2e: final verification
- 6 README admin section: Task 3

Planner discretion (documented, not scope additions):
- The index lives in `client-preview-source.ts` (not a new module) because it needs `parsePreviewMeta`, and `findClientPreview` needs the index; two modules would import each other.
- `PreviewIndex.available` (false when Blob threw or had no credentials) lets the dashboard tell "Blob indisponível" apart from "no uploads yet". The spec's `{ generatedAt, previews }` is otherwise unchanged.
- Root-level blobs (no `/`) are ignored; folder markers (`<slug>/`, empty relative path) create the slug group but are not files, so an empty folder shows up with `missing-index`.
- Any Blob error during the build returns the empty index (spec). It is cached up to 300 s; "Atualizar índice" clears it.
- The `missing-title` warning fires when `parsePreviewMeta` returned the slug as client (the spec's "client fell back to slug" wording), only for slugs that have index.html.
- The admin lists repo registry entries (source `repo`, no file stats since `public/` is not on the function filesystem) plus every Blob entry. A slug present in both appears twice; the Blob row carries `shadowed-by-repo`. `/admin/<slug>` prefers the Blob entry.
- `purgePreview` validates the slug with `isPreviewSlug` before building a tag (Server Action arguments are caller-controlled).
- 404s from `servePreviewAsset` send `Cache-Control: no-store`, so a 404 cached before an upload can never hide it.
- `/preview/[slug]` keeps `revalidate = 60` (the cached index already bounds freshness at 300 s and its tag propagates to the page); only its why-comment is reworded because it describes per-request Blob reads that no longer happen.
- The sandbox value moves to a tiny shared module so the admin frame cannot drift from PreviewViewer. It cannot be exported from `preview-viewer.tsx` itself: a server component importing from a `'use client'` module gets a client reference, not the string.
- `playwright.config.ts` gains a `PLAYWRIGHT_PORT` override (default 3000, so CI is unchanged). Without it the mandated `pnpm test:e2e` cannot run on this machine without killing another project's server on 3000; that is what blocked e2e in the previous quick task.
- `scripts/check-ci-safety.mjs` must allow `goto('/admin...')` exactly as it already allows `/preview`, because both are proxy-excluded; otherwise the pre-commit hook rejects the new e2e tests.
</decision_coverage>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Cached Blob index, index-backed public previews and CDN-cacheable Blob assets</name>
  <files>package.json, pnpm-lock.yaml, src/lib/client-preview-source.ts, src/lib/client-preview-source.test.ts, src/app/preview/[slug]/page.tsx</files>
  <behavior>
    Mocks at the top of the test file: `@vercel/blob` gives `{ get: vi.fn(), list: vi.fn() }`; `next/cache` gives `{ unstable_cache: vi.fn((fn) => vi.fn(fn)) }` (each call returns a spy wrapping fn); `@vercel/functions` gives `{ addCacheTag: vi.fn() }`. `beforeEach` resets get, list and addCacheTag and sets `list` to resolve `{ blobs: [], hasMore: false }` by default. It must NOT reset or clear `unstable_cache`: its single call happens at import. Each test uses its own slugs. A helper builds `ListBlobResultBlob`s from (pathname, size, ISO date); `get` is driven per pathname with the existing `found()` helper.
    getPreviewIndex:
    - `unstable_cache` was called once with (buildPreviewIndex, ['client-preview-index'], { tags: ['client-previews'], revalidate: 300 })
    buildPreviewIndex:
    - groups by first path segment: `acme/index.html` (100 B, 2026-10-01) + `acme/css/style.css` (50 B, 2026-10-03) give one preview: files sorted by path [{ path: 'css/style.css', size: 50, uploadedAt: '2026-10-03T00:00:00.000Z' }, { path: 'index.html', ... }], fileCount 2, totalSize 150, updatedAt '2026-10-03T00:00:00.000Z', hasIndex true, client/locale from the HTML (`<html lang="en"><title>Acme | Home</title>` gives 'Acme', 'en'), warnings []; `get` was called with ('acme/index.html', { access: 'private' })
    - follows pagination: first list resolves hasMore true with cursor 'c1', second resolves hasMore false; list was called twice, first with { mode: 'expanded', cursor: undefined } (or without cursor), second with cursor 'c1'; files from both pages are in the result
    - ignores root-level blobs (`readme.txt`) and turns a folder marker (`empty/`, 0 B) into a preview with no files, fileCount 0, hasIndex false, client 'empty', locale 'pt', warning missing-index; `get` is not called for it
    - warning invalid-slug for `Bad_Slug/index.html`
    - warning missing-title when the HTML has no title (client falls back to the slug)
    - warning absolute-asset-refs with detail listing the refs for HTML containing `src="/app.js"` and `href='/style.css'`; `src="//cdn.example.com/x.js"`, `href="https://..."` and `src="img/a.png"` do not trigger it
    - warning shadowed-by-repo for a Blob folder named `exemplo`
    - previews are sorted by updatedAt, newest first
    - `generatedAt` is an ISO string, `available` is true, and `JSON.parse(JSON.stringify(index))` deep-equals the index (no Date objects)
    - list rejecting (no credentials) returns { generatedAt: <ISO>, available: false, previews: [] } without throwing; get rejecting does the same
    findClientPreview:
    - 'exemplo' returns the registry entry and calls neither list nor get
    - 'Bad_Slug' returns undefined and never calls list
    - a slug whose Blob folder has index.html returns { slug, client, locale } from the index, and the spy returned by the `unstable_cache` mock was invoked (proves it reads getPreviewIndex, not buildPreviewIndex)
    - a slug whose folder has no index.html returns undefined
    - an unknown slug returns undefined; list rejecting returns undefined without throwing
    servePreviewAsset (existing tests adapted, plus):
    - 200: status, body, Content-Type, nosniff and ETag as today, plus Cache-Control 'public, max-age=0, must-revalidate', Vercel-CDN-Cache-Control 'max-age=300, stale-while-revalidate=86400', and addCacheTag called once with ['client-previews', 'client-preview:asset-css']
    - 304: same ETag, Cache-Control, Vercel-CDN-Cache-Control and addCacheTag call, empty body
    - every 404 (unsafe path, null, Blob throws) has Cache-Control 'no-store', no Vercel-CDN-Cache-Control header, and addCacheTag not called
    isPreviewSlug: true for 'acme-1', false for 'Acme' and 'a_b'
  </behavior>
  <action>
Supply chain first: run `npm view @vercel/functions@3.9.11 repository.url`. It must print `git+https://github.com/vercel/vercel.git`; anything else, stop and report. The planner verified on 2026-10-05: Apache-2.0, trusted publisher (GitHub Actions OIDC), 3.9.11 is `latest`, its two peers are optional. Run `pnpm add @vercel/functions@^3.9.11`. If pnpm re-resolves unrelated packages in the lockfile (the previous task saw `third-party-web` drift through an lhci dependency pinned to "latest"), revert those hunks so the lockfile diff only adds the @vercel/functions tree, and confirm `pnpm install --frozen-lockfile` passes.

Write the tests above in `src/lib/client-preview-source.test.ts` (keep every existing parsePreviewMeta and isSafePreviewPath test unchanged; replace the get-based findClientPreview tests; adapt the servePreviewAsset ones). Watch them fail, then implement in `src/lib/client-preview-source.ts`:
- Imports gain `list` from `@vercel/blob`, `unstable_cache` from `next/cache` and `addCacheTag` from `@vercel/functions`; `getClientPreview` stays the registry check.
- Export `PREVIEW_CACHE_TAG`, `previewCacheTag(slug)`, `isPreviewSlug(slug)` (reuse the module's SLUG regex) and the index types exactly as in the interfaces block.
- `buildPreviewIndex()`: inside one try, loop `list({ mode: 'expanded', cursor })` until `hasMore` is false, collecting blobs. Group by the text before the first `/`; skip pathnames with no `/`. A blob whose remainder is empty is a folder marker: it creates the group and counts toward updatedAt but is not a file. For each group: files sorted by path with `uploadedAt.toISOString()`, fileCount, totalSize, updatedAt (max ISO across the group's blobs), hasIndex (a file with path `index.html`). When hasIndex, read `${slug}/index.html` with `get(..., { access: 'private' })` and `await new Response(result.stream).text()` (treat a non-200 result as empty HTML), then `parsePreviewMeta`. Without index.html, client is the slug and locale 'pt'. Read the HTML for all groups with `Promise.all`. Warnings, in this order: invalid-slug (`!isPreviewSlug`), missing-index, missing-title (hasIndex and client === slug), absolute-asset-refs (src/href attribute values, quoted or not, that start with exactly one `/`; detail = the first 3 unique values joined by ', '), shadowed-by-repo (`getClientPreview(slug)` defined). Sort previews by updatedAt descending. Return `{ generatedAt: new Date().toISOString(), available: true, previews }`. The catch returns the same shape with `available: false` and `previews: []`; reuse the existing why-comment idea in one short line (no credentials in CI or local dev must read as "no Blob previews", not a 500).
- `getPreviewIndex = unstable_cache(buildPreviewIndex, ['client-preview-index'], { tags: [PREVIEW_CACHE_TAG], revalidate: 300 })`.
- `findClientPreview` keeps `cache()`, the registry check and the `isSafePreviewPath(slug, ['index.html'])` guard, then finds the slug in `(await getPreviewIndex()).previews` with `hasIndex`, returning `{ slug, client, locale }` or undefined. Remove its `get` call and the old try/catch (the index already swallows Blob errors).
- `servePreviewAsset`: the not-found helper adds `Cache-Control: no-store`. For 304 and 200, `await addCacheTag([PREVIEW_CACHE_TAG, previewCacheTag(slug)])` and send `ETag`, `Cache-Control: public, max-age=0, must-revalidate`, `Vercel-CDN-Cache-Control: max-age=300, stale-while-revalidate=86400` (200 keeps Content-Type and nosniff). Do not add X-Robots-Tag or CORS here; next.config already covers `/client-previews/:path*`. `route.ts` is unchanged.

`src/app/preview/[slug]/page.tsx`: make `generateStaticParams` async and return the union of registry slugs and index slugs that have index.html and pass `isPreviewSlug`, deduplicated. Keep `revalidate = 60`; replace its comment with one line saying the page re-reads the cached Blob index (5 min, tag client-previews) at most once a minute. Nothing else changes; `layout.tsx` already uses `findClientPreview`.

The file is already in the vitest 100% coverage list; add tests until v8 reports 100%, never lower the threshold. If `pnpm next build` fails resolving `ws` from `@vercel/functions` (it is a dynamic `import("ws")` used only by an unused WebSocket helper), add `serverExternalPackages: ['@vercel/functions']` to next.config.ts in this commit and record it; do not install ws. If `unstable_cache` errors inside `generateStaticParams` at build, call `buildPreviewIndex()` there instead and record it.

Commit the 5 files: `feat(preview): resolve previews from a cached Blob index and CDN-cache Blob assets`.

After the commit, prove each test can fail. Apply one mutation at a time, run `pnpm exec vitest --run src/lib/client-preview-source.test.ts`, note the failing test, restore with `git checkout -- src/lib/client-preview-source.ts`. Record in the SUMMARY:
- findClientPreview ignores hasIndex; findClientPreview calls buildPreviewIndex directly; unstable_cache revalidate 60; single list call (no pagination); each of the 5 warnings removed individually; root-level blobs not skipped; uploadedAt left as Date; try/catch removed from buildPreviewIndex; addCacheTag dropped; Vercel-CDN-Cache-Control dropped on 304; 404 without no-store.
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && node -e "const p=require('./package.json');if(!/^\^3\.(9|[1-9]\d)/.test(p.dependencies['@vercel/functions']??''))throw new Error('functions dep');console.log('dep ok')" && pnpm exec vitest --run src/lib/client-preview-source.test.ts && pnpm test:unit:coverage && pnpm exec biome check . && pnpm exec next typegen && pnpm exec tsc --noEmit && LOG=$(mktemp) && pnpm next build > "$LOG" 2>&1 && pnpm verify:static "$LOG" && grep -E '●\s+/preview/\[slug\]' "$LOG" && grep -E 'ƒ\s+/client-previews/\[slug\]/\[\.\.\.path\]' "$LOG"</automated>
  </verify>
  <done>`@vercel/functions@^3.9.11` is a dependency with a clean lockfile diff. All index, warning, lookup and CDN-header tests pass and each was shown failing under its mutation. Coverage for `client-preview-source.ts` is 100%. Build shows `● /preview/[slug]` and `ƒ /client-previews/[slug]/[...path]`; verify:static passes. The commit holds exactly the 5 files.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Env-gated admin session, Server Actions, view helpers, proxy and headers (unit-tested)</name>
  <files>src/lib/admin/auth.ts, src/lib/admin/auth.test.ts, src/lib/admin/actions.ts, src/lib/admin/actions.test.ts, src/lib/admin/view.ts, src/lib/admin/view.test.ts, src/proxy.ts, next.config.ts, vitest.config.mts</files>
  <behavior>
    Env is set per test with `vi.stubEnv` and cleared with `vi.unstubAllEnvs()` in afterEach. `next/navigation` is mocked so `redirect(url)` throws `new Error(`NEXT_REDIRECT ${url}`)` and `notFound()` throws `new Error('NEXT_NOT_FOUND')`. `next/headers` is mocked so `cookies()` resolves a store `{ get, set, delete }` of vi.fn backed by a per-test Map. `next/server` is mocked with `connection: vi.fn(async () => {})`.
    auth.test.ts:
    - getAdminCredentials returns { user, password } when both are set; null when either is missing or ''
    - credentialsMatch: equal strings true; different strings false; different lengths ('a' vs 'abcdef') false without throwing; '' vs 'x' false
    - signSession produces `<expiresAtMs>.<base64url>` (regex /^\d+\.[A-Za-z0-9_-]+$/); verifySession accepts it before expiry
    - verifySession rejects: a flipped signature character; a changed expiry with the old signature; an expired token (nowMs past expiry); a token signed with another password; a token signed for another user; undefined; '' ; 'abc'; 'x.y'; a token with 3 parts
    - assertAdminEnabled and requireAdmin throw NEXT_NOT_FOUND when env is unset (and `connection` was awaited first in assertAdminEnabled)
    - requireAdmin throws NEXT_REDIRECT /admin/login with no cookie, with an expired cookie, and with a cookie signed by another password; resolves with a valid cookie
    actions.test.ts (also mocks `@vercel/blob`, `next/cache` as { unstable_cache: (fn) => fn, updateTag: vi.fn() } and `@vercel/functions` as { addCacheTag: vi.fn(), invalidateByTag: vi.fn() }):
    - login with wrong password returns { error: 'Usuário ou senha inválidos.' }, never calls cookies().set, and takes at least 350 ms
    - login with a wrong user and right password fails the same way
    - login with correct credentials calls set('admin_session', value, { httpOnly: true, secure: false, sameSite: 'strict', path: '/admin', maxAge: 28800 }) where verifySession(value) is true and the expiry is ~8 h ahead, then throws NEXT_REDIRECT /admin
    - login with env unset throws NEXT_NOT_FOUND
    - logout without a session throws NEXT_REDIRECT /admin/login and never deletes; with a session calls delete({ name: 'admin_session', path: '/admin' }) then throws NEXT_REDIRECT /admin/login
    - refreshIndex without a session throws NEXT_REDIRECT /admin/login and calls neither updateTag nor invalidateByTag; with a session calls updateTag('client-previews') and invalidateByTag('client-previews')
    - purgePreview('acme') without a session invalidates nothing; with a session calls invalidateByTag('client-preview:acme') and updateTag('client-previews'); purgePreview('../x') with a session invalidates nothing
    view.test.ts:
    - previewUrl('acme') is 'https://pansarini.dev/preview/acme' without NEXT_PUBLIC_SITE_URL and uses the env value when stubbed
    - previewAssetHref('acme', 'img/logo final.png') is '/client-previews/acme/img/logo%20final.png'
    - formatBytes: 512 gives '512 B', 1536 gives '1,5 KB', 5 * 1024 * 1024 gives '5 MB'
    - formatDateTime('2026-10-05T17:30:00.000Z') contains '05/10/2026' and '14:30' (America/Sao_Paulo, UTC-3)
    - listAdminPreviews on an index with Blob entries 'acme' and 'exemplo' returns the registry 'exemplo' row first (source 'repo', fileCount null, hasIndex true) then both Blob rows (source 'blob'), each with url = previewUrl(slug)
    - findAdminPreview prefers the Blob row for 'exemplo' when both exist, falls back to the repo row, and is undefined for an unknown slug
    - publicUrls drops Blob rows without index.html or with an invalid slug and de-duplicates the shadowed 'exemplo' URL
    - WARNING_MESSAGES has a non-empty PT message for each of the 5 codes
  </behavior>
  <action>
Write the three test files first and watch them fail, then implement.

`src/lib/admin/auth.ts` (imports node:crypto, next/headers, next/navigation, next/server; no `server-only` package, it is not installed and node:crypto already keeps this module off the client):
- `getAdminCredentials(env = process.env)`: null if ADMIN_USER or ADMIN_PASSWORD is undefined or ''. No trimming (spaces in a password are legitimate).
- `credentialsMatch`: SHA-256 both strings and compare the digests with `timingSafeEqual` (equal length by construction, so it never throws).
- `signSession({ user, password }, expiresAtMs)`: `${expiresAtMs}.${createHmac('sha256', password).update(`${user}:${expiresAtMs}`).digest('base64url')}`.
- `verifySession(token, credentials, nowMs = Date.now())`: false unless the token splits on '.' into exactly 2 parts and the first is all digits; false if expiresAt <= nowMs; recompute the signature and compare with `credentialsMatch` (constant time). Changing the password or user therefore invalidates every session.
- `assertAdminEnabled()`: `await connection()` FIRST, then `getAdminCredentials()`, `notFound()` if null, return the credentials. One why-comment: connection() keeps the route out of build-time prerendering, where the env is absent and the 404 would be frozen into the build.
- `requireAdmin()`: `const credentials = await assertAdminEnabled()`, read the `admin_session` cookie, `redirect('/admin/login')` unless `verifySession` passes.

`src/lib/admin/actions.ts` starts with `'use server'` and exports only the four async functions plus the `LoginState` type:
- `login(_previous, formData)`: credentials via `getAdminCredentials()` (notFound if null). Read `user` and `password` form fields (non-string becomes ''). Compute BOTH `credentialsMatch` results before branching. On failure wait 400 ms and return `{ error: 'Usuário ou senha inválidos.' }`. On success set the cookie per the spec: name ADMIN_SESSION_COOKIE, value `signSession(credentials, Date.now() + SESSION_TTL_MS)`, options `{ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/admin', maxAge: SESSION_TTL_MS / 1000 }`, then `redirect('/admin')` outside any try/catch.
- `logout()`: `await requireAdmin()`, `cookies().delete({ name: ADMIN_SESSION_COOKIE, path: '/admin' })`, `redirect('/admin/login')`.
- `refreshIndex()`: `await requireAdmin()`, `updateTag(PREVIEW_CACHE_TAG)`, `await invalidateByTag(PREVIEW_CACHE_TAG)`.
- `purgePreview(slug)`: `await requireAdmin()`; return without side effects unless `isPreviewSlug(slug)`; `await invalidateByTag(previewCacheTag(slug))`; `updateTag(PREVIEW_CACHE_TAG)`.

`src/lib/admin/view.ts` (pure, no Next imports): implement the interfaces-block contracts. `previewUrl` reads `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pansarini.dev'` at call time. `previewAssetHref` encodes each path segment with encodeURIComponent. `formatBytes` uses `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })` with B/KB/MB at 1024 steps. `formatDateTime` uses `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })`. `WARNING_MESSAGES` in PT-BR:
  - invalid-slug: the folder name is outside [a-z0-9-], so the public URL does not open
  - missing-index: no index.html at the folder root, so the public URL is a 404
  - missing-title: no `<title>`, so the client name fell back to the slug
  - absolute-asset-refs: paths starting with `/` in index.html do not load inside the preview
  - shadowed-by-repo: a repo slug with the same name wins, so the public URL shows the repo version
  `listAdminPreviews`: registry rows (from `clientPreviews`, source 'repo', hasIndex true, files [], null stats, no warnings) followed by every index preview as a 'blob' row. `findAdminPreview`: Blob row first, then repo row. `publicUrls`: urls of repo rows and of Blob rows with hasIndex and a valid slug, de-duplicated, in list order.

`src/proxy.ts`: add `admin` after `client-previews` in the matcher's negative lookahead and extend the existing sentence in the comment so it reads "preview, client-previews and admin live outside [locale]...". Nothing else.

`next.config.ts` `headers()`: append, after the `/client-previews/:path*` rule (last rule wins per key, so it must stay after the global non-production rule), `{ source: '/admin/:path*', headers: [X-Robots-Tag 'noindex, nofollow, noarchive', Cache-Control 'private, no-store'] }`. `/admin/:path*` also matches `/admin`. Do not touch `robots.ts` or `sitemap.ts`: listing /admin in robots.txt would advertise it.

`vitest.config.mts`: append `'src/lib/admin/auth.ts'`, `'src/lib/admin/actions.ts'`, `'src/lib/admin/view.ts'` to `LIB_DATA_FILES` (100% gate). The node project already includes `src/lib/**/*.test.ts`.

Commit the 9 files: `feat(admin): env-gated admin session, server actions and routing`.

After the commit, prove each test can fail (one mutation at a time, `pnpm exec vitest --run src/lib/admin`, restore with `git checkout -- <file>`), recording the failing test in the SUMMARY:
- verifySession skips the expiry check; verifySession returns true without comparing signatures; signSession keys the HMAC with the user; credentialsMatch compares raw Buffers without hashing (different-length test throws); getAdminCredentials accepts ''; requireAdmin skips the env check; assertAdminEnabled drops `await connection()`; refreshIndex without requireAdmin; purgePreview without requireAdmin; purgePreview without isPreviewSlug; logout deletes 'admin_session' without the path; cookie sameSite 'lax'; login without the 400 ms delay; formatDateTime without timeZone.
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && pnpm exec vitest --run src/lib/admin && pnpm test:unit:coverage && pnpm exec biome check . && pnpm exec next typegen && pnpm exec tsc --noEmit && grep -q "client-previews|admin" src/proxy.ts && grep -q "'/admin/:path\*'" next.config.ts && test "$(grep -v '^[[:space:]]*//' src/app/robots.ts src/app/sitemap.ts | grep -c admin)" = "0" && echo task2-ok</automated>
  </verify>
  <done>Session, credential, env-gate, action and view tests pass, each shown failing under its mutation. The 100% gate passes for the three new lib files. Proxy excludes admin, next.config sends noindex/noarchive and no-store for /admin/:path*, robots.ts and sitemap.ts do not mention admin. The commit holds exactly the 9 files.</done>
</task>

<task type="auto">
  <name>Task 3: Admin pages (PT-BR, 375 px), e2e coverage and README</name>
  <files>src/components/preview/frame-sandbox.ts, src/components/preview/preview-viewer.tsx, src/components/admin/login-form.tsx, src/components/admin/copy-button.tsx, src/app/admin/layout.tsx, src/app/admin/login/page.tsx, src/app/admin/page.tsx, src/app/admin/[slug]/page.tsx, playwright.config.ts, tests/e2e.spec.ts, scripts/check-ci-safety.mjs, README.md</files>
  <action>
Shared sandbox: create `src/components/preview/frame-sandbox.ts` exporting `PREVIEW_FRAME_SANDBOX` (value in the interfaces block). In `preview-viewer.tsx` replace only the literal with `sandbox={PREVIEW_FRAME_SANDBOX}` plus the import; leave its comments alone. The existing viewer unit test (exact sandbox string) must still pass.

`src/components/admin/copy-button.tsx` ('use client'): props `value`, `label`, optional `className`. Uses `navigator.clipboard.writeText`; on success the visible label becomes "Copiado" for 2 s, on failure "Não foi possível copiar", announced via an `aria-live="polite"` span. Lucide Copy/Check icons, `Button` variant outline size sm. No sonner (no Toaster in the admin shell).

`src/components/admin/login-form.tsx` ('use client'): `useActionState(login, { error: null })`. Visible `<label>`s "Usuário" (input name user, autoComplete username, required) and "Senha" (name password, type password, autoComplete current-password, required) using `Input`; submit `Button` "Entrar", disabled while pending; when `state.error` is set render it in `<p role="alert">`.

`src/app/admin/layout.tsx`: own document shell like `src/app/preview/[slug]/layout.tsx` (IBM_Plex_Sans with the same options and variable, `<html lang="pt-BR" suppressHydrationWarning>`, `ThemeProvider` with the same props) but WITHOUT `<Analytics />`. `export const metadata`: `title: { absolute: 'Admin' }`, robots `{ index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }`. No `loading.tsx` anywhere under `src/app/admin` (it would turn the 307 redirect into a streamed 200).

`src/app/admin/login/page.tsx`: `await assertAdminEnabled()`, then a centered card (max-w-sm, px-4) with h1 "Admin" and `<LoginForm />`.

`src/app/admin/page.tsx`: `await requireAdmin()` first, then `getPreviewIndex()`, `listAdminPreviews`, `publicUrls`. Layout `mx-auto max-w-5xl px-4 py-6`, everything wraps at 375 px (`flex flex-wrap gap-2`, URLs in `font-mono text-xs break-all`). Header: h1 "Prévias de clientes", "Índice gerado em {formatDateTime(generatedAt)}", `<form action={refreshIndex}>` with Button "Atualizar índice", `<form action={logout}>` with Button variant outline "Sair", and `CopyButton` "Copiar todas as URLs" with the URLs joined by newlines. When `!index.available`, an `Alert` saying Blob is unavailable (no credentials or the listing failed) and only repo previews are shown; when available with no Blob rows, a short "Nenhuma prévia no Blob ainda." line. One `Card` per row: the client name as a plain `<a href="/admin/<slug>">` (h2), Badge with the source ("Blob" / "Repositório"), and a definition list of slug, idioma (PT/EN), arquivos, tamanho (`formatBytes`), atualizado em (`formatDateTime`), with "—" when the value is null; the URL text, `CopyButton` "Copiar URL", and an outline Button asChild `<a href={url} target="_blank" rel="noopener noreferrer">Abrir</a>`; a destructive Badge "N aviso(s)" when warnings exist.

`src/app/admin/[slug]/page.tsx`: `await requireAdmin()` first, `params: Promise<{ slug: string }>`, `findAdminPreview(await getPreviewIndex(), slug)` or `notFound()`. Back link `<a href="/admin">Voltar</a>`; h1 = client; metadata list (slug, idioma, origem, arquivos, tamanho, atualizado em); URL + "Copiar URL" + "Abrir"; warnings as a list of `WARNING_MESSAGES[code]` plus the detail when present (or "Nenhum aviso."); for Blob rows a files `<ul>` where each path is `<a href={previewAssetHref(slug, path)} target="_blank" rel="noopener noreferrer">` with size and date beneath (no wide table, it must fit 375 px); for repo rows one line saying the files are versioned under `public/client-previews/<slug>/`. When hasIndex: `<iframe src={`/client-previews/${slug}/index.html`} title={`Prévia de ${client}`} sandbox={PREVIEW_FRAME_SANDBOX}>` at roughly 70dvh, full width, bg-white, bordered. For Blob rows a `<form action={purgePreview.bind(null, slug)}>` with Button "Limpar cache deste site".

`playwright.config.ts`: add `const PORT = process.env.PLAYWRIGHT_PORT ?? '3000';` used in `webServer.command` (`pnpm next start -p ${PORT}`), `webServer.url` and `use.baseURL`. Add `webServer.env: { ADMIN_USER: 'e2e-admin', ADMIN_PASSWORD: 'e2e-password-not-a-secret' }` (Playwright spreads process.env first). One why-comment for the env: test-only values so the admin exists under `next start`; the build itself runs without them, which is what proves admin routes are not prerendered.

`scripts/check-ci-safety.mjs`: in `LOCALE_PREFIX_REQUIRED_IN_TEST_GOTO`, change the lookahead `preview\b` to `preview\b|admin\b` and extend the existing comment sentence about `/preview` to cover `/admin` (also proxy-excluded).

`tests/e2e.spec.ts`: update the header comment from 7 to 8 describe blocks, adding "8. Hidden admin for client previews (env-gated, noindex)". Append a describe `Hidden admin for client previews (env-gated, noindex)` with the credentials as local constants mirroring playwright.config.ts:
- `/admin without a session redirects to the login, noindexed and uncached`: `request.get('/admin', { maxRedirects: 0 })` gives 307, `location` ending in `/admin/login` (not `/en/...`), x-robots-tag containing 'noarchive'; `request.get('/admin/login', { maxRedirects: 0 })` gives 200, x-robots-tag containing 'noindex' and 'noarchive', cache-control containing 'no-store', and the body matches `/<meta name="robots" content="[^"]*noindex/`; `page.goto('/admin')` ends on `/admin/login` with `getByLabel('Usuário')` and `getByLabel('Senha')` visible.
- `wrong password shows the generic error`: goto `/admin/login`, fill user and a wrong password, click "Entrar", expect `getByRole('alert')` to have text 'Usuário ou senha inválidos.' and the URL to stay on `/admin/login`.
- `login lists exemplo, opens its page, and Sair ends the session`: log in; expect heading level 1 "Prévias de clientes" and text matching `/\/preview\/exemplo/`; the `admin_session` cookie from `page.context().cookies()` has httpOnly true, sameSite 'Strict', path '/admin', secure true (next start runs with NODE_ENV=production; Chromium accepts Secure cookies on localhost) and expires 7.9 to 8.1 h from now; click the "Cliente Exemplo" link, expect h1 "Cliente Exemplo" and the iframe titled "Prévia de Cliente Exemplo" with sandbox exactly the PreviewViewer value; go back to `/admin`, click "Sair", expect `/admin/login`; `page.goto('/admin')` lands on `/admin/login` again.

`README.md`: add "### Admin" right after "### Client previews" (EN) and "### Admin" right after "### Prévias de clientes" (PT), same content in each language, existing voice ("você" in PT):
- What it is: a hidden page to list every preview, analyse its files and warnings, and copy the public URLs. Not linked anywhere, noindex, and a 404 unless both env vars exist.
- Setup: `ADMIN_USER` and `ADMIN_PASSWORD` (long random value, e.g. `openssl rand -base64 24`) in Vercel, Project Settings, Environment Variables, Production, marked Sensitive, or with `vercel env add`; redeploy for them to take effect. Locally, put them in `.env.local`. Changing the password logs out every session; sessions last 8 hours.
- URLs: `https://pansarini.dev/admin` (login at `/admin/login`), one page per preview at `/admin/<slug>`.
- Cache behaviour: the Blob listing is cached for 5 minutes and shared by the admin and the public pages, so a new upload appears within about 5 minutes, or right away with "Atualizar índice". Blob files are cached on Vercel's CDN for 5 minutes; "Limpar cache deste site" marks them stale, so the next load may still serve the old version once while it refreshes. To take a preview down: delete its folder in the store, then open its admin page (still listed until the index refreshes) and click "Limpar cache deste site".
- Warnings: one line naming the five checks.
In the existing Blob subsection of both languages, change "New uploads and changes can take up to about 60 seconds to show" (and the PT equivalent) to say about 5 minutes, or immediately via "Atualizar índice" in the admin. Touch nothing else in the README.

Commit the 12 files: `feat(admin): hidden admin UI for client previews`.

Checks after the commit, recorded in the SUMMARY:
1. Build with `pnpm next build` into a log; `grep -E 'ƒ\s+/admin(\s|$)'`, `grep -E 'ƒ\s+/admin/login'` and `grep -E 'ƒ\s+/admin/\[slug\]'` must all match (dynamic, never prerendered).
2. Env-unset 404 at runtime: with no ADMIN_* in the shell and no `.env.local`, run `pnpm next start -p 3100` in the background, then `curl -sI` `/admin`, `/admin/login` and `/admin/exemplo`: all 404, none 500, none a redirect to `/en`. Also `curl -sI /client-previews/nope/index.html`: 404 with `cache-control: no-store`. Stop the server.
3. e2e: after clearing 3100 per the repo rules, `PLAYWRIGHT_PORT=3100 pnpm test:e2e`, all tests green (every existing test plus the 3 new ones).
4. e2e mutation proofs, two rebuilds, each then restored with `git checkout -- <file>` and rebuilt clean: (a) remove the `/admin/:path*` rule from next.config.ts AND change the logout delete to `delete(ADMIN_SESSION_COOKIE)` in one build: the redirect/headers test fails on noarchive and the login test fails after "Sair"; (b) remove `admin` from the proxy matcher: the redirect test fails with a locale redirect. Run with `PLAYWRIGHT_PORT=3100 pnpm exec playwright test tests/e2e.spec.ts --project=e2e -g "Hidden admin"`.
5. Screenshot the dashboard and a detail page at 375x812 after logging in (headless, scratchpad paths, not committed) and view them with the Read tool: no horizontal scroll, buttons wrap, URLs break.
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && pnpm exec biome check . && pnpm verify:ci-safety && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm test:unit && LOG=$(mktemp) && pnpm next build > "$LOG" 2>&1 && grep -E 'ƒ\s+/admin/login' "$LOG" && grep -E 'ƒ\s+/admin/\[slug\]' "$LOG" && grep -c "### Admin" README.md && PLAYWRIGHT_PORT=3100 pnpm test:e2e</automated>
  </verify>
  <done>Admin pages render in PT-BR and fit 375 px (screenshots viewed). All admin routes are ƒ in the build; with no env they 404 at runtime. The full e2e suite passes on 3100 with the 3 new admin tests, which were shown failing under both mutated builds. README EN and PT document setup, URLs, sessions and cache behaviour, and the 60-second line now reads about 5 minutes. The PreviewViewer test still passes with the shared sandbox constant. The commit holds exactly the 12 files.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser to /admin/login Server Action | Untrusted username/password guesses |
| Browser cookie to every admin page and action | Session token may be forged, replayed or stale |
| Direct POST to Server Action IDs | Actions are callable without rendering the page |
| Public URL to /preview and /client-previews | Anyone can request any slug or path; responses are now CDN-cached |
| Server to Vercel Blob / Vercel CDN purge API | Credentials come from the project (OIDC) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-qnn-01 | Spoofing | login action | mitigate | Both values compared via SHA-256 + timingSafeEqual, both computed before branching; 400 ms delay and one generic message on failure (unit-tested). Residual: no rate limit, so README asks for a long random password |
| T-qnn-02 | Tampering | admin_session cookie | mitigate | HMAC-SHA256 keyed with ADMIN_PASSWORD over `user:expiresAtMs`, constant-time verify, expiry enforced; tampered, expired, other-password and other-user tokens rejected in unit tests |
| T-qnn-03 | Elevation of privilege | logout / refreshIndex / purgePreview | mitigate | `await requireAdmin()` is the first statement of every action; unit tests prove no updateTag/invalidateByTag/cookie delete without a valid session |
| T-qnn-04 | Tampering (CSRF) | Server Actions | mitigate | SameSite=Strict cookie scoped to Path=/admin, plus Next's built-in Origin/Host check on Server Actions |
| T-qnn-05 | Information disclosure | Admin discovery | mitigate | No links, no robots.txt or sitemap entry, X-Robots-Tag noindex/nofollow/noarchive and meta robots (e2e), 404 when env is unset (unit + curl). Obscurity is not the control; auth is |
| T-qnn-06 | Information disclosure | ADMIN_* env | mitigate | No NEXT_PUBLIC_ prefix; read only in node:crypto server modules; never rendered or sent to the client; `.env*.local` already gitignored; README says mark them Sensitive in Vercel |
| T-qnn-07 | Tampering | purgePreview slug argument | mitigate | `isPreviewSlug` check before building `client-preview:<slug>` (unit-tested with '../x') |
| T-qnn-08 | Information disclosure | Admin pages cached by a CDN or browser | mitigate | Dynamic routes (cookies/connection) plus `Cache-Control: private, no-store` header rule; e2e asserts no-store |
| T-qnn-09 | Denial of service | Index build and asset 404s | mitigate | Index built at most once per 300 s (unstable_cache), refresh only for admins; slug/segment validation before any Blob call; 404s are no-store so random paths cost one function call and no Blob read when the path is invalid |
| T-qnn-10 | Information disclosure | Stale CDN copies after a preview is deleted | accept | invalidateByTag (locked) serves stale once before revalidating. README gives the take-down order (delete folder, then "Limpar cache deste site"). A hard purge is available from the Vercel dashboard if ever needed |
| T-qnn-11 | Information disclosure | Cached empty index after a transient Blob error | accept | Spec-locked behaviour; previews 404 for at most 300 s, and "Atualizar índice" clears it immediately |
| T-qnn-12 | Elevation of privilege | Admin detail iframe | mitigate | Same PREVIEW_FRAME_SANDBOX constant as PreviewViewer (no allow-same-origin), asserted by e2e, so uploaded JS cannot read the admin cookie (HttpOnly anyway) or call actions as same-origin |
| T-qnn-SC | Tampering | `pnpm add @vercel/functions` | mitigate | [VERIFIED] by the planner on the npm registry: repo github.com/vercel/vercel, Apache-2.0, trusted publisher (GitHub Actions OIDC), 3.9.11 = latest (2026-10-02), optional peers only. Executor re-checks `repository.url` before install; lockfile diff limited to its tree |
</threat_model>

<verification>
From the repo root, after all three commits, on a clean tree with no mutations left:
1. `pnpm lint`
2. `pnpm exec next typegen && pnpm exec tsc --noEmit`
3. `pnpm test:unit` and `pnpm test:unit:coverage` (100% gate on client-preview-source.ts and the three admin lib files)
4. `pnpm verify:ci-safety` and `pnpm verify:message-length`
5. `pnpm build` (the spec gate, runs prebuild), then `git status --short`: restore every tracked file the prebuild rewrote with `git checkout -- <path>`; never commit them. Also `pnpm next build > <log> 2>&1 && pnpm verify:static <log>`, and the log shows `● /preview/[slug]`, `ƒ /client-previews/[slug]/[...path]`, `ƒ /admin`, `ƒ /admin/login`, `ƒ /admin/[slug]`.
6. Clear 3100 per the repo rules, then `PLAYWRIGHT_PORT=3100 pnpm test:e2e` (full e2e suite: every existing test plus the 3 new admin tests).
7. `git status --short` shows only ` M .claude-flow/policy/state.json` and `?? public/client-previews/.claude-flow/`. `git log --oneline -3` shows the three commits. Nothing pushed.
</verification>

<success_criteria>
- With both env vars set, Luiz logs in at /admin/login, sees every repo and Blob preview with its stats, warnings and URL, copies one or all URLs, opens a preview's page with its files and a sandboxed frame, refreshes the index, purges one site's CDN cache, and logs out. With either var missing, /admin does not exist (404).
- The public /preview/<slug> resolves through the cached index with no per-request Blob read; new uploads show within ~5 minutes or immediately after "Atualizar índice".
- Blob assets are CDN-cached for 5 minutes with SWR, tagged per site and globally; 404s are never cached.
- /admin is noindexed, uncached, unlinked and absent from robots.txt and the sitemap.
- lint, tsc, unit (with coverage), build and the full e2e suite are green. Every new unit and e2e test has a recorded mutation that makes it fail. Three commits with explicit paths, no tooling files staged, nothing pushed.
</success_criteria>

<output>
Create `.planning/quick/261005-qnn-hidden-admin-for-client-previews-with-ca/261005-qnn-SUMMARY.md` when done. Include:
- the mutation tables for Tasks 1, 2 and 3 (unit and e2e)
- the build-log route lines and the env-unset curl output from Task 3
- the 375 px screenshot paths
- any contingency used (serverExternalPackages, buildPreviewIndex in generateStaticParams, lockfile hunks reverted)
- a "First admin login on Vercel" checklist for Luiz:
  1. Add ADMIN_USER and ADMIN_PASSWORD (Production, Sensitive) and redeploy.
  2. Open https://pansarini.dev/admin, log in, and check the Héris preview (heris-clinica-medica) is listed with its file count, no unexpected warnings, and a working "Abrir".
  3. `curl -sI https://pansarini.dev/admin` shows `x-robots-tag: noindex, nofollow, noarchive` and a 307 to /admin/login.
  4. `curl -sI https://pansarini.dev/client-previews/heris-clinica-medica/index.html` twice: the second response shows `x-vercel-cache: HIT` and an `etag`.
  5. Click "Sair".
</output>
