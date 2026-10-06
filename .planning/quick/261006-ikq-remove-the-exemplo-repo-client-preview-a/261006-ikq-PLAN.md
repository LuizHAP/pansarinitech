---
phase: quick-261006-ikq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/e2e.spec.ts
  - src/data/client-previews.ts
  - src/data/client-previews.test.ts
  - src/lib/client-preview-source.test.ts
  - src/lib/admin/view.test.ts
  - public/client-previews/exemplo/index.html
  - public/client-previews/exemplo/style.css
  - public/client-previews/exemplo/script.js
autonomous: true
requirements: [quick-261006-ikq]

must_haves:
  truths:
    - "On a fresh `next start`, /preview/exemplo, /client-previews/exemplo/index.html and /client-previews/exemplo/style.css all return 404, and `git ls-files public/client-previews` is empty"
    - "`clientPreviews` is `[]`; the ClientPreview type, getClientPreview, the repo branch in findClientPreview, the shadowed-by-repo warning, the 'Repositório' admin rows and the README repo instructions are all still there"
    - "tests/e2e.spec.ts has no test that needs exemplo: it keeps the two does-not-exist 404 tests, the admin redirect test, the wrong-password test, and a login test that checks the session cookie attributes, the 'Blob indisponível' alert and Sair. The e2e suite runs 14 tests, all green"
    - "The repo-preview unit tests (findClientPreview registry hit, shadowed-by-repo, admin repo rows, findAdminPreview blob preference and fallback, publicUrls dedupe, disabled twin) run against a vi.mock('@/data/client-previews') test entry, not the real data. The 100% coverage gate on client-preview-source.ts, admin/actions.ts and admin/view.ts passes, and each changed test fails under its recorded mutation"
    - "`pnpm next build` + `pnpm verify:static` pass with generateStaticParams for /preview/[slug] returning [] locally"
  artifacts:
    - path: "src/data/client-previews.ts"
      provides: "empty repo registry; ClientPreview type and getClientPreview kept"
      contains: "clientPreviews: readonly ClientPreview[] = []"
    - path: "src/lib/client-preview-source.test.ts"
      provides: "repo-branch coverage through a mocked registry"
      contains: "vi.mock('@/data/client-previews'"
    - path: "src/lib/admin/view.test.ts"
      provides: "repo-row coverage through a mocked registry"
      contains: "vi.mock('@/data/client-previews'"
    - path: "tests/e2e.spec.ts"
      provides: "admin login test asserting the Blob alert instead of the exemplo row"
      contains: "Blob indisponível"
  key_links:
    - from: "src/lib/client-preview-source.test.ts"
      to: "@/data/client-previews (imported by client-preview-source.ts)"
      via: "vi.mock factory returning a one-entry registry plus getClientPreview"
      pattern: "vi\\.mock\\('@/data/client-previews'"
    - from: "src/lib/admin/view.test.ts"
      to: "@/data/client-previews (imported by view.ts)"
      via: "vi.mock factory returning the same one-entry registry"
      pattern: "vi\\.mock\\('@/data/client-previews'"
    - from: "tests/e2e.spec.ts admin login test"
      to: "src/app/admin/page.tsx <Alert> 'Blob indisponível' (rendered when index.available is false)"
      via: "page.getByRole('main').getByRole('alert')"
      pattern: "Blob indisponível"
---

<objective>
Remove the `exemplo` client preview (the placeholder at pansarini.dev/preview/exemplo, listed in /admin as "Cliente Exemplo · Repositório") and the e2e tests that only work because it exists. CI has no Blob credentials, so exemplo was the only preview e2e could open. Luiz chose to delete it together with those tests.

The repo-preview mechanism stays: the `ClientPreview` type, `getClientPreview`, the registry branch in `findClientPreview`, the `shadowed-by-repo` warning, the "Repositório" admin rows and the README repo instructions. Unit tests that reached those code paths through the real `exemplo` entry switch to a mocked registry, so coverage does not depend on production data.

Output: two commits on `chore/remove-exemplo-preview` (e2e first, then the removal with its unit tests), all gates green, a mutation table in the SUMMARY.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@.planning/quick/261006-fc8-disable-blob-client-previews-from-the-ad/261006-fc8-SUMMARY.md
@src/data/client-previews.ts
@src/data/client-previews.test.ts
@src/lib/admin/view.ts
@src/lib/admin/view.test.ts
@tests/e2e.spec.ts

<repo_rules>
These come from the user and apply to every task:
- Branch `chore/remove-exemplo-preview` is already checked out, stacked on `feat/disable-preview` (PR #28). Do NOT switch branches. Do NOT push. Commit with explicit paths only (never `git add -A` / `git add .`). Do NOT commit this PLAN, the SUMMARY or STATE.md.
- Code comments: as few as possible, only a non-obvious why. No ticket/task/plan IDs, no "added for X", no narration, no docblocks restating names. Leave existing comments alone unless the line they describe is deleted.
- Husky pre-commit runs `pnpm lint`, `pnpm verify:ci-safety`, `pnpm test:unit`; all must pass at each commit. Never `--no-verify`. If Biome only complains about import order or formatting, run `pnpm exec biome check --write <touched files>`.
- Never stage `.claude-flow/`, `.swarm/`, or prebuild output. `public/client-previews/.claude-flow/` is gitignored local tool state: leave it on disk, do not delete it, do not stage it. Remove exemplo with `git rm -r public/client-previews/exemplo`, never by deleting `public/client-previews/` as a whole.
- Build with `pnpm next build` (skips the prebuild hook). If `pnpm build` is run anyway, restore every tracked file it rewrote (at least `src/data/skill-icons.json`, possibly `public/feed*.xml`) with `git checkout -- <path>`.
- `cacheComponents` stays OFF (it is not in next.config.ts). No `'use cache'`.
- Use port 3100 (`PLAYWRIGHT_PORT=3100`). Before each server start or Playwright run after a rebuild, kill only servers on 3100 whose cwd is this repo (`lsof -ti:3100`, check cwd with `lsof -p <pid> | awk '$4=="cwd"'`), because `reuseExistingServer` would reuse a stale build. Never kill a process whose cwd is another repo.
- There are no `.env*` files and no Blob credentials locally. Do not create any and do not run `vercel env pull`.
- Temp files (build logs, scripts) go in the session scratchpad or `mktemp`, never `/tmp` directly and never the repo.
</repo_rules>

<interfaces>
Current code the executor works against (extracted at plan time; line numbers are from HEAD `bebb835`).

src/data/client-previews.ts (whole file today):
```ts
export type ClientPreview = { slug: string; client: string; locale: 'pt' | 'en' };
export const clientPreviews: readonly ClientPreview[] = [
  { slug: 'exemplo', client: 'Cliente Exemplo', locale: 'pt' },
];
export function getClientPreview(slug: string): ClientPreview | undefined {
  return clientPreviews.find((preview) => preview.slug === slug);
}
```
Importers: `src/app/preview/[slug]/page.tsx` (`clientPreviews.map` in generateStaticParams), `src/lib/admin/view.ts` (`clientPreviews` + type), `src/lib/client-preview-source.ts` (`getClientPreview` + type). All use the specifier `'@/data/client-previews'`. `src/data/client-previews.ts` is NOT in the vitest coverage include list.

src/lib/client-preview-source.ts, the two repo code paths:
```ts
// in the per-preview warnings builder (line 108)
if (getClientPreview(slug)) warnings.push({ code: 'shadowed-by-repo' });
// findClientPreview (lines 190-193)
const registered = getClientPreview(slug);
if (registered) return registered;
if (!isSafePreviewPath(slug, ['index.html'])) return undefined;
```

src/lib/admin/view.ts, repo rows:
```ts
export function listAdminPreviews(index: PreviewIndex): AdminPreview[] {
  const repoRows = clientPreviews.map((preview): AdminPreview => ({ ...preview, source: 'repo',
    url: previewUrl(preview.slug), hasIndex: true, disabled: false, files: [], fileCount: null,
    totalSize: null, updatedAt: null, warnings: [] }));
  const blobRows = index.previews.map((preview): AdminPreview => ({ ...preview, source: 'blob', url: previewUrl(preview.slug) }));
  return [...repoRows, ...blobRows];
}
export function findAdminPreview(index: PreviewIndex, slug: string): AdminPreview | undefined {
  const rows = listAdminPreviews(index).filter((row) => row.slug === slug);
  return rows.find((row) => row.source === 'blob') ?? rows[0];
}
export function publicUrls(previews: readonly AdminPreview[]): string[] {
  const resolving = previews.filter((p) => p.hasIndex && !p.disabled && isPreviewSlug(p.slug));
  return [...new Set(resolving.map((p) => p.url))];
}
```

src/app/admin/page.tsx (not modified; the e2e target), lines 108-117:
```tsx
{!index.available && (
  <Alert>  {/* shadcn Alert renders role="alert" */}
    <TriangleAlert aria-hidden="true" />
    <AlertTitle>Blob indisponível</AlertTitle>
    ...
```
The page renders its own `<main>`; the admin layout has none. Next's route announcer also has role="alert" (inside a shadow root Playwright pierces), which is why the existing login-error test scopes to `form` and the new assertion must scope to `main`.

Existing unit-test exemplo usages to replace:
- src/lib/client-preview-source.test.ts: vi.mock calls at lines 17-19 (`@vercel/blob`, `next/cache`, `@vercel/functions`); 'warns when a repo preview with the same slug wins' at 392-399 (`listed('exemplo/index.html', 10)`, `serving({ 'exemplo/index.html': '<title>Outro</title>' })`, expects `[{ code: 'shadowed-by-repo' }]`); 'returns a registry preview without reading Blob' at 445-453 (expects `{ slug: 'exemplo', client: 'Cliente Exemplo', locale: 'pt' }` and `list`/`get` not called).
- src/lib/admin/view.test.ts lines 75-159: listAdminPreviews, findAdminPreview (prefers Blob, falls back to repo), publicUrls (dedupes the repo + blob twin), 'disabled previews' (disabled blob twin, public repo row). `vi` is already imported.
- src/data/client-previews.test.ts: 'is non-empty and every slug is unique' (line 9 asserts length > 0), slug-format and index.html-on-disk loops, 'returns the entry for a known slug' (exemplo), 'returns undefined for an unknown slug'.
- src/components/preview/preview-viewer.test.tsx uses "Cliente Exemplo" and "/client-previews/exemplo/index.html" only as prop strings. Leave it alone.

tests/e2e.spec.ts (370 lines): `import { AxeBuilder } from '@axe-core/playwright';` at line 33 is used only by the preview axe loop (line 279); a11y-matrix.spec.ts and sith-contrast.spec.ts import it themselves, so the dependency stays. Today the suite has 21 tests. This plan removes 7, leaving 14.

README.md: the EN (lines 124-186) and PT (lines 320-382) client-preview and admin sections were read at plan time. They contain no "exemplo" and no mention of a sample/example preview (`acme-7f3k2q` is an example slug, not a preview). "Run `pnpm test:unit`, which checks the slug format, uniqueness and that `index.html` exists" stays true because those registry guards are kept. README is therefore NOT modified.
</interfaces>

<decision_coverage>
Orchestrator scope item, then the task that covers it:
- Delete public/client-previews/exemplo/ and set `clientPreviews` to `[]`, keeping the type and getClientPreview: Task 2
- e2e: delete the 200+noindex test, the index.html header test, the cross-origin asset test, the brand-bar render test, the sandbox/storage test and the two axe theme tests; keep the does-not-exist 404 tests: Task 1
- e2e admin: keep login, cookie attributes and Sair; drop listing the exemplo URL, opening its page and the iframe sandbox assertion; assert the "Blob indisponível" alert instead; remove the now-unused `PREVIEW_FRAME_SANDBOX` and `AxeBuilder`: Task 1
- Unit tests that went through the real exemplo entry switch to a `vi.mock('@/data/client-previews')` test entry; 100% coverage kept on client-preview-source.ts, admin/actions.ts, admin/view.ts; short mutation table: Task 2 (unit), final verification (e2e alert)
- README EN + PT: checked at plan time, nothing refers to exemplo or a sample preview; the executor re-runs the grep and edits only if it finds one: Task 2
- generateStaticParams returns [] without Blob credentials; `pnpm next build` + `pnpm verify:static` still pass: final verification
- Final gates and the no-exemplo grep: final verification

Planner decisions (not scope additions):
- Commit order is e2e first, removal second. The new admin assertion (Blob alert) already holds while exemplo exists, so both commits keep every suite green. The reverse order would leave a commit whose e2e suite fails.
- The test registry entry is `{ slug: 'repo-site', client: 'Repo Site', locale: 'pt' }` in both mocked files. No other test in those files uses that slug (the executor confirms with grep), so no blob fixture is accidentally shadowed. The real registry is empty, so these tests only pass if the mock intercepts the import. A passing run proves the mock is wired.
- The mock factory returns both `clientPreviews` and `getClientPreview` (a find by slug over the same array) in both files. view.ts only needs `clientPreviews`, but it loads client-preview-source.ts, which imports `getClientPreview`, and a missing export on a vitest mock throws on access.
- src/data/client-previews.test.ts cannot mock its own module. The non-empty assertion goes away. The slug-format and index.html-on-disk loops stay unchanged as guards for the next repo entry, and they are what the README's step 3 promises. They pass vacuously on an empty registry, and the SUMMARY says so. The known-slug test registers two entries on the runtime array for the duration of the test (the `readonly` is type-only), looks up the second, and restores the original length in a `finally`. Looking up the second entry also kills a `return clientPreviews[0]` mutation.
- The e2e alert assertion is scoped to `page.getByRole('main')` because Next's route announcer also has role="alert".
- No replacement e2e coverage for the viewer page, the asset CORS header or the admin detail iframe. Luiz chose deletion. The PreviewViewer unit tests still cover the sandbox attribute.
</decision_coverage>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Drop the exemplo-dependent e2e tests and repoint the admin login test at the Blob alert</name>
  <files>tests/e2e.spec.ts</files>
  <read_first>tests/e2e.spec.ts lines 1-35 and 170-370 (already summarized in the interfaces block; read only those ranges)</read_first>
  <action>
In the "Client preview viewer (proxy-excluded, always noindex)" describe, delete these tests completely: '/preview/exemplo returns 200 without a redirect, with noindex header and meta'; '/client-previews/exemplo/index.html is served with the preview noindex header'; '/client-previews assets allow cross-origin loads from the sandboxed frame' (it fetches exemplo/style.css); '/preview/exemplo renders the client site under the PT brand bar'; '/preview/exemplo runs client scripts in a sandbox without portfolio storage access'; and the `for (const colorScheme of ['light', 'dark'] as const)` loop that generates the two '/preview/exemplo brand bar follows the … theme with zero axe violations' tests. Keep '/preview/does-not-exist returns 404 without a locale redirect' and '/client-previews/does-not-exist/index.html returns a noindexed 404, not a 500' unchanged, and keep the describe and its title.

Remove the `AxeBuilder` import at line 33. No other test in this file uses it. Keep the `@playwright/test` import.

In the "Hidden admin for client previews (env-gated, noindex)" describe, delete the `PREVIEW_FRAME_SANDBOX` constant. Keep `ADMIN_USER`, `ADMIN_PASSWORD` and their "Mirrors webServer.env" comment. Leave the redirect test and the wrong-password test unchanged. Rename 'login lists exemplo, opens its page, and Sair ends the session' to 'login shows the dashboard with the Blob alert, and Sair ends the session' and change its body as follows:
- Keep the login steps and the `Prévias de clientes` h1 assertion.
- Replace the `/\/preview\/exemplo/` text assertion with an assertion that `page.getByRole('main').getByRole('alert')` contains the text 'Blob indisponível'. There are no repo previews and no Blob credentials, so `getPreviewIndex` returns `available: false` and src/app/admin/page.tsx renders that Alert. Scope it to main because Next's route announcer is also role="alert".
- Keep the whole admin_session cookie block (httpOnly, sameSite Strict, path /admin, secure, the 7.9–8.1 hour window) and its existing comment.
- Delete the click on the 'Cliente Exemplo' link, the 'Cliente Exemplo' h1 assertion and the iframe sandbox assertion. Also delete the `page.goto('/admin')` line that only came back from the detail page. The test is still on /admin, so it clicks 'Sair' directly, then keeps the two existing `/admin/login` URL checks (after Sair, and after a fresh `page.goto('/admin')`).

Do not touch any other describe and do not edit the header comment block (it still lists 8 describes, which stays true). Add no comments.

Commit only this file: `git add tests/e2e.spec.ts` then `git commit -m "test(e2e): drop the tests that need the exemplo preview"`. The pre-commit hook must pass.
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && ! git grep -n -i -E "exemplo|AxeBuilder|PREVIEW_FRAME_SANDBOX" -- tests/e2e.spec.ts && git grep -n "Blob indisponível" -- tests/e2e.spec.ts && pnpm exec playwright test tests/e2e.spec.ts --project=e2e --list | tail -1 && pnpm lint && pnpm verify:ci-safety</automated>
  </verify>
  <done>tests/e2e.spec.ts has no exemplo, AxeBuilder or PREVIEW_FRAME_SANDBOX reference. `--list` reports 14 tests (was 21). The admin login test asserts the 'Blob indisponível' alert inside main, the cookie attributes and Sair. The commit holds only tests/e2e.spec.ts. The full e2e run happens in the final verification, after the Task 2 build.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Remove exemplo, empty the registry, and move repo-path unit tests onto a mocked registry</name>
  <files>public/client-previews/exemplo/index.html, public/client-previews/exemplo/style.css, public/client-previews/exemplo/script.js, src/data/client-previews.ts, src/data/client-previews.test.ts, src/lib/client-preview-source.test.ts, src/lib/admin/view.test.ts</files>
  <read_first>src/lib/client-preview-source.test.ts lines 1-20, 392-399 and 444-453 only; src/lib/admin/view.test.ts and src/data/client-previews.test.ts in full (both are short)</read_first>
  <behavior>
    - findClientPreview('repo-site') resolves to `{ slug: 'repo-site', client: 'Repo Site', locale: 'pt' }` and never calls Blob `list` or `get` (mocked registry hit)
    - A Blob folder `repo-site/index.html` with `<title>Outro</title>` is indexed with exactly `[{ code: 'shadowed-by-repo' }]`
    - listAdminPreviews puts the repo row `repo-site` first (full row shape, source 'repo', url https://pansarini.dev/preview/repo-site, null stats, disabled false), then the Blob rows in index order
    - findAdminPreview prefers the Blob twin of `repo-site` and falls back to the repo row when the index is empty
    - publicUrls lists `https://pansarini.dev/preview/repo-site` once even with a Blob twin, then acme; a disabled Blob twin leaves the repo row public
    - getClientPreview returns the second of two temporarily registered entries by slug, and undefined for an unknown slug
  </behavior>
  <action>
Removal: run `git rm -r public/client-previews/exemplo`. Leave the ignored `public/client-previews/.claude-flow/` on disk. In src/data/client-previews.ts, change only the registry so that `clientPreviews: readonly ClientPreview[]` is initialized to an empty array literal. Keep the `ClientPreview` type and `getClientPreview` exactly as they are. Do not touch src/app/preview/[slug]/page.tsx, view.ts or client-preview-source.ts. generateStaticParams still spreads `clientPreviews` and now gets nothing from it.

src/lib/client-preview-source.test.ts: next to the existing three vi.mock calls, add `vi.mock('@/data/client-previews', factory)`. The factory defines a local array holding the one entry `{ slug: 'repo-site', client: 'Repo Site', locale: 'pt' }` and returns `{ clientPreviews: thatArray, getClientPreview: (slug: string) => thatArray.find((preview) => preview.slug === slug) }`. Define the data inside the factory because vi.mock is hoisted. In 'warns when a repo preview with the same slug wins', use `repo-site/index.html` for both the listing and the served page (keep `<title>Outro</title>` and the expected `[{ code: 'shadowed-by-repo' }]`). In 'returns a registry preview without reading Blob', call `findClientPreview('repo-site')` and expect `{ slug: 'repo-site', client: 'Repo Site', locale: 'pt' }`. Keep the `list`/`get` not-called assertions. Before editing, run `git grep -n "repo-site" -- src/lib/client-preview-source.test.ts src/lib/admin/view.test.ts` to confirm the slug is unused (it must return nothing).

src/lib/admin/view.test.ts: add the same `vi.mock('@/data/client-previews', factory)` after the imports, with the same entry and both exports. In the listAdminPreviews, findAdminPreview, publicUrls and 'disabled previews' tests, replace slug 'exemplo' with 'repo-site', 'Cliente Exemplo' with 'Repo Site', and 'https://pansarini.dev/preview/exemplo' with 'https://pansarini.dev/preview/repo-site'. Keep the Blob twin's client 'Outro', and keep every assertion's shape and row order otherwise identical. Test names stay. They still read correctly ('prefers the Blob row when the slug is also in the repo', 'falls back to the repo row', 'keeps a disabled Blob row disabled and its repo twin public').

src/data/client-previews.test.ts: rename 'is non-empty and every slug is unique' to 'has unique slugs' and delete its `toBeGreaterThan(0)` line. Leave the slug-format and index.html-on-disk tests unchanged. They guard the next repo entry and back the README's step 3. Replace 'returns the entry for a known slug' with a test that imports the `ClientPreview` type, casts `clientPreviews` to a mutable `ClientPreview[]`, records its length, pushes two entries (e.g. slugs 'repo-a' and 'repo-b'), asserts `getClientPreview('repo-b')` is the second entry object (`toBe`), and in a `finally` sets the array length back to the recorded value. Keep 'returns undefined for an unknown slug' unchanged. Add no comments, except that one short why-comment on the cast is allowed if Biome or a reader would otherwise trip on it (the registry is empty, and this exercises the real lookup).

README: run `grep -n -i -E "exemplo|sample preview|example preview|prévia de exemplo" README.md`. It is expected to print nothing (verified at plan time), and then README stays untouched. Only if it prints a line, fix that line in EN and PT and add README.md to the commit.

Run `pnpm test:unit` and `pnpm test:unit:coverage`. The 100% gate must pass on client-preview-source.ts, admin/actions.ts and admin/view.ts, and the unit test count must match the count before this task (no test added or removed, one renamed). Never lower a threshold.

Mutation proofs (apply one at a time, run the named file with `pnpm exec vitest --run <test file>`, record the failing test names, revert). view.ts and client-preview-source.ts are not changed by this plan, so revert them with `git checkout -- <file>`. src/data/client-previews.ts IS changed by this plan, so revert M6 by hand with Edit (git checkout would bring exemplo back):
- M1 client-preview-source.ts: delete the `if (getClientPreview(slug)) warnings.push({ code: 'shadowed-by-repo' });` line. Expect 'warns when a repo preview with the same slug wins' to fail.
- M2 client-preview-source.ts: delete `if (registered) return registered;`. Expect 'returns a registry preview without reading Blob' to fail.
- M3 view.ts: make listAdminPreviews return only `blobRows`. Expect listAdminPreviews, 'falls back to the repo row', publicUrls and 'disabled previews' to fail.
- M4 view.ts: make findAdminPreview return `rows[0]`. Expect 'prefers the Blob row when the slug is also in the repo' to fail.
- M5 view.ts: drop the `new Set` dedupe in publicUrls. Expect 'keeps URLs that resolve, once each, in list order' to fail.
- M6 src/data/client-previews.ts: change `preview.slug === slug` to `preview.slug !== slug`. Expect the known-slug test to fail.
If any mutation leaves its test green, strengthen that test before committing.

Commit with explicit paths: `git add src/data/client-previews.ts src/data/client-previews.test.ts src/lib/client-preview-source.test.ts src/lib/admin/view.test.ts` (the exemplo deletions are already staged by `git rm`), then `git commit -m "chore(preview): remove the exemplo repo preview"`. Check `git show --stat HEAD` lists exactly the 3 deleted exemplo files and those 4 files.
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && test -z "$(git ls-files public/client-previews)" && git grep -n "clientPreviews: readonly ClientPreview\[\] = \[\];" -- src/data/client-previews.ts && test "$(git grep -c "vi.mock('@/data/client-previews'" -- src/lib/client-preview-source.test.ts src/lib/admin/view.test.ts | wc -l | tr -d ' ')" = 2 && pnpm test:unit && pnpm test:unit:coverage</automated>
  </verify>
  <done>No tracked file under public/client-previews/. The registry is empty while the type and getClientPreview remain. Both repo-path test files mock '@/data/client-previews' with the 'repo-site' entry. Unit tests and the 100% coverage gate pass with an unchanged test count. M1-M6 each made their named tests fail and were reverted (`git diff` is empty after the commit). The commit holds exactly the 3 deletions and the 4 edited files.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| internet → /preview/[slug], /client-previews/* | Anonymous visitors request preview pages and raw preview files |
| browser → /admin (session cookie) | Admin login and session; unchanged code, reduced e2e coverage |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ikq-01 | Information disclosure | public/client-previews/exemplo/* and /preview/exemplo | mitigate | Files removed with `git rm`, registry emptied. Final verification curls /preview/exemplo, /client-previews/exemplo/index.html and /client-previews/exemplo/style.css on a fresh `next start` and expects 404 for each |
| T-ikq-02 | Spoofing / Elevation of privilege | admin login + admin_session cookie | mitigate | The e2e tests for redirect-without-session, wrong password, cookie attributes (httpOnly, SameSite=Strict, Path=/admin, Secure, 8 h) and Sair all stay. Only the exemplo-specific steps are removed |
| T-ikq-03 | Tampering | test-only registry mock | accept | `vi.mock('@/data/client-previews')` lives only in two `*.test.ts` files. Production reads the real (empty) registry, and the build and e2e run against it |
| T-ikq-04 | Information disclosure | loss of e2e coverage for the viewer sandbox, preview noindex/noarchive on 200 and asset CORS | accept | Luiz chose deletion. next.config.ts headers and PreviewViewer are unchanged, the PreviewViewer unit tests still assert the sandbox attribute, and the /client-previews 404 test still asserts noarchive |
</threat_model>

<verification>
From the repo root, after both commits, with no mutation left:
1. `pnpm lint`
2. `pnpm exec next typegen && pnpm exec tsc --noEmit`
3. `pnpm test:unit` and `pnpm test:unit:coverage` (100% on client-preview-source.ts, admin/actions.ts, admin/view.ts)
4. `pnpm verify:ci-safety`
5. E2E mutation M7 (proves the changed admin assertion can fail): clear 3100 per the repo rules. In src/app/admin/page.tsx change `{!index.available && (` to `{index.available && (`, run `pnpm next build`, then `PLAYWRIGHT_PORT=3100 pnpm exec playwright test tests/e2e.spec.ts --project=e2e -g "Sair ends the session"`, which must FAIL on the 'Blob indisponível' assertion. Record the failure line, then `git checkout -- src/app/admin/page.tsx` and confirm `git diff --quiet`.
6. Clear 3100 again. `LOG=$(mktemp) && pnpm next build > "$LOG" 2>&1 && pnpm verify:static "$LOG"`. Record the route-table lines for `/preview/[slug]`, `/client-previews/[slug]/[...path]`, `/admin`, `/admin/login`, `/admin/[slug]`. `/preview/[slug]` now has no prerendered params locally. Either ● or ƒ is acceptable for it, because verify:static only gates `/[locale]` routes and Blob slugs render on demand as before. The build must not error.
7. Removal check on the fresh build: start `ADMIN_USER=e2e-admin ADMIN_PASSWORD=e2e-password-not-a-secret pnpm next start -p 3100` in the background. Then `curl -s -o /dev/null -w '%{http_code}\n'` must print 404 for `/preview/exemplo`, `/client-previews/exemplo/index.html` and `/client-previews/exemplo/style.css`. Kill that server (only its PID, cwd this repo).
8. `PLAYWRIGHT_PORT=3100 pnpm test:e2e` must report `14 passed`. 'Theme toggle persistence across reload › toggling to dark, reloading, still dark' is a known flake. If it alone fails, record the machine load (`uptime`), rerun it once with `-g "Theme toggle"` and record both runs. Any other failure blocks completion.
9. Grep gate: `! git grep -n -i "exemplo" -- . ':!.planning' ':!content' ':!src/components/preview/preview-viewer.test.tsx'` prints nothing. `content/` is excluded only because its PT blog prose uses the phrase "por exemplo". Also run `git grep -n -i "exemplo" -- src/components/preview/preview-viewer.test.tsx` and confirm it still shows only the untouched prop strings.
10. `git status --short` shows only the untracked `.planning/quick/261006-ikq-*/` files (plus STATE.md if the orchestrator touched it). Nothing else is modified, and `src/data/skill-icons.json` is unchanged. `git log --oneline -3` shows the two new commits on `chore/remove-exemplo-preview`. Nothing pushed.
</verification>

<success_criteria>
- /preview/exemplo and every /client-previews/exemplo/* URL return 404. No repo preview files are tracked, and the registry is `[]`.
- The repo-preview mechanism (type, getClientPreview, registry branch, shadowed-by-repo warning, Repositório rows, README instructions) is intact and still covered at 100% through a mocked registry entry.
- The e2e suite has 14 tests, none depending on exemplo, and the admin login test asserts the Blob alert, cookie attributes and Sair.
- lint, typegen + tsc, unit + coverage, ci-safety, next build + verify:static and e2e are green. M1-M7 each made their named tests fail and were reverted.
- Two commits with explicit paths (e2e first, then removal), no tooling or planning files staged, nothing pushed.
</success_criteria>

<output>
Create `.planning/quick/261006-ikq-remove-the-exemplo-repo-client-preview-a/261006-ikq-SUMMARY.md` when done (do not commit it). Include:
- the two commit SHAs and `git show --stat` for each
- the mutation table M1-M7 (mutation, then failing test names or failure line)
- unit test counts before and after (must match) and the coverage lines for the three gated files
- a note that the registry slug-format and index.html-on-disk tests now pass vacuously and will apply to the next repo entry
- the build-log route lines from step 6, the three curl status codes from step 7, the e2e result line(s) from step 8, and the grep gate output from step 9
- the list of deleted e2e tests by name, and the e2e count 21 → 14
</output>
