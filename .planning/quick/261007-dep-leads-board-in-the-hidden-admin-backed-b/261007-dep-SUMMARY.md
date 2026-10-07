---
phase: quick-261007-dep
plan: 01
subsystem: admin
tags: [admin, leads, upstash-redis, server-actions, zod, useActionState, mobile-375]
requires:
  - hidden admin with requireAdmin (261005-qnn)
  - cached Blob preview index getPreviewIndex (261005-qnn, 261006-fc8)
provides:
  - /admin/leads board, /admin/leads/new, /admin/leads/<id>
  - Upstash Redis lead store (leads:lead:<id> + leads:index)
  - createLead, updateLead, moveLead, deleteLead Server Actions
  - reserved-slug preview warning (leads, login)
affects:
  - src/app/admin/page.tsx (header link)
  - src/lib/client-preview-source.ts (PreviewWarningCode)
tech-stack:
  added: ["@upstash/redis ^1.39.0 (+ uncrypto 0.1.3)"]
  patterns:
    - one JSON record per lead plus a sorted-set index, writes in MULTI/EXEC
    - unavailable-not-500 read path when credentials are missing or Redis fails
    - useActionState form remounted with key={state.attempt} so typed values survive errors
    - shared in-memory FakeRedis in src/test/mocks for store and action tests
key-files:
  created:
    - src/lib/admin/leads.ts
    - src/lib/admin/leads.test.ts
    - src/lib/admin/lead-store.ts
    - src/lib/admin/lead-store.test.ts
    - src/lib/admin/lead-actions.ts
    - src/lib/admin/lead-actions.test.ts
    - src/test/mocks/upstash-redis.ts
    - src/components/ui/native-select.tsx
    - src/components/admin/lead-card.tsx
    - src/components/admin/lead-form.tsx
    - src/app/admin/leads/page.tsx
    - src/app/admin/leads/new/page.tsx
    - src/app/admin/leads/[id]/page.tsx
  modified:
    - src/lib/client-preview-source.ts
    - src/lib/client-preview-source.test.ts
    - src/lib/admin/view.ts
    - src/lib/admin/view.test.ts
    - src/app/admin/page.tsx
    - tests/e2e.spec.ts
    - README.md
    - vitest.config.mts
    - package.json
    - pnpm-lock.yaml
decisions:
  - "Leads: stage moves use a stage select plus a Mover submit button, not submit-on-change (WCAG 3.2.2), pending Luiz's confirmation"
  - "Leads: the edit form shows a stored WhatsApp as +<digits> so a foreign 10-11 digit number never gets a second 55 on save"
  - "Leads: the board scroll container is a named <section> (implicit region role), because Biome's useSemanticElements rejects div role=region"
  - "Leads: pnpm lockfile keeps third-party-web at 0.29.2; @paulirish/trace_engine pins it to 'latest', so any pnpm resolve bumps it and that bump is reverted as out of scope"
metrics:
  duration: "40 min"
  completed: "2026-10-07"
  tasks: 3
  commits: 3
---

# Quick 261007-dep: Leads board in the hidden admin, backed by Upstash Redis

Luiz now has an admin-only leads board at `/admin/leads`. Each lead is one Upstash Redis JSON record at `leads:lead:<id>`, indexed by the sorted set `leads:index`. Leads move through six stage columns that scroll inside the board, with Perdido collapsed below. Every page and action calls `requireAdmin` first, and the board works at 375 px with no page-level horizontal scroll.

## Commits

| Task | Commit | Message | Files |
| ---- | ------ | ------- | ----- |
| 1 | 0dea7fe | feat(admin): add the lead model and flag preview slugs taken by admin pages | 7 |
| 2 | ba87483 | feat(admin): store leads in Upstash Redis behind admin-only actions | 8 |
| 3 | c8a7851 | feat(admin): add the leads board at /admin/leads | 9 |

Branch `feat/leads-board`, on top of the existing skills commit a1f8afc. Nothing pushed (no `origin/feat/leads-board` exists). I amended commits 1 and 2 after their mutation runs (see Deviations), which kept the three-commit shape. Neither had been pushed.

## Flagged for Luiz to confirm

1. **Stage moves use a select plus "Mover", not submit-on-change.** If the board moved a card on change, the card would jump to another column while you are still choosing (WCAG 3.2.2 On Input), and every card would need client JS. If you prefer submit-on-change, say so.
2. **The visual check wrote to the provisioned Upstash database**, but only under the temporary `leads-check:` prefix. Every `leads-check:*` key was deleted afterwards. `leads:*` was 0 before and 0 after, and the prefix edit was reverted and never committed.

## Post-deploy check

Open https://pansarini.dev/admin/leads, create a lead, move it with the stage select and "Mover", then delete it through "Excluir lead" and "Confirmar exclusão". Confirm the board never shows "Redis indisponível" in production, which would mean `KV_REST_API_URL` / `KV_REST_API_TOKEN` are missing from the Production env.

## Mutation proofs

Each mutation was applied alone, the suite was run, and the file was restored with `git checkout -- <file>`. After every run `git status --short` was empty.

### Task 1 (`vitest --run src/lib/admin/leads.test.ts src/lib/client-preview-source.test.ts src/lib/admin/view.test.ts`)

| Mutation | Failing tests |
| -------- | ------------- |
| WhatsApp 55 prefix removed | parseLeadInput › trims and normalizes a full valid form; stores the WhatsApp (11) 91234-5678 / 011 91234-5678 / (11) 3333-4444 as 55… |
| 55 prefix also applied to '+' input | parseLeadInput › stores the WhatsApp +1 415 555 0100 as 14155550100; leadFormValues › round-trips a stored lead through the form unchanged |
| WhatsApp length check removed | parseLeadInput › rejects whatsapp "91234-5678"; rejects whatsapp "+55 11 91234-5678 1234"; reports every bad field at once |
| http/https protocol check removed | parseLeadInput › rejects website "ftp://x.com" |
| no https:// prefix for bare domains | parseLeadInput › trims and normalizes a full valid form; keeps the website padaria.com.br as https://padaria.com.br |
| '@' kept in the Instagram handle | parseLeadInput › trims and normalizes a full valid form; stores the Instagram @padaria as the bare handle; leadFormValues › round-trips… |
| instagram.com URL not reduced to the handle | parseLeadInput › stores the Instagram https://www.instagram.com/padaria/ …; stores the Instagram instagram.com/padaria?igsh=1 … |
| `z.iso.date()` swapped for a plain regex | parseLeadInput › rejects dueDate "2026-02-30"; reports every bad field at once |
| name not trimmed | parseLeadInput › trims and normalizes a full valid form; rejects name "   " |
| name max length dropped | parseLeadInput › rejects name "xxx…(121)" with its pt-BR message |
| isOverdue using `<=` | isOverdue › is late only before today |
| todayInSaoPaulo without the timeZone option | todayInSaoPaulo › uses the São Paulo calendar day whatever the server time zone (survived on the first run, see Deviation 1, killed after the fix) |
| formatDueDate through `new Date(date).toLocaleDateString('pt-BR')` | formatDueDate › formats the calendar date without shifting a day |
| groupLeadsByStage putting no-date leads first | groupLeadsByStage › sorts by due date, then undated leads newest first, and keeps Perdido apart |
| previewStatus returning 'active' for disabled previews | previewStatus › reads the status from the Blob index |
| previewStatus returning 'missing' when the index is unavailable | previewStatus › is unknown when the index is unavailable |
| leadPreviewOptions dropping an out-of-index current slug | leadPreviewOptions › keeps a linked slug that dropped out of the index, once |
| isLeadId accepting any non-empty string | isLeadId › accepts a lowercase UUID v4 only |
| reserved-slug check removed | buildPreviewIndex › warns about a folder named after an admin page |
| 'login' missing from the set | buildPreviewIndex › warns about a folder named after an admin page |
| reserved-slug check using `slug.includes(...)` | buildPreviewIndex › warns about a folder named after an admin page |
| reserved-slug message removed | WARNING_MESSAGES › has a Portuguese message for reserved-slug; tsc: `view.ts(26,14): error TS2741: Property '"reserved-slug"' is missing …` |

22 of 22 killed.

### Task 2 (`vitest --run src/lib/admin`)

| Mutation | Failing tests |
| -------- | ------------- |
| getLeadsRedis reads UPSTASH_REDIS_REST_URL/TOKEN | 15 tests, incl. getLeadsRedis › builds the client from the KV REST URL and token; ignores the UPSTASH_REDIS_REST_* names; listLeads, findLead, insertLead, saveLead, removeLead happy paths; createLead › stores the normalized lead…; moveLead › moves the lead…; deleteLead › removes the record… |
| `Redis.fromEnv()` used | 19 tests, incl. getLeadsRedis › builds the client from the KV REST URL and token, and every store and action test that needs a client |
| empty-index early return removed | listLeads › is available and empty with an empty index, without calling mget |
| dangling ids not filtered | listLeads › skips an index id whose record is gone |
| listLeads try/catch removed | listLeads › is unavailable when Redis fails |
| insertLead zadd dropped | insertLead › writes the record and indexes it by createdAt; createLead › stores the normalized lead…; createLead › starts at the chosen stage |
| zadd score set to `Date.now()` | insertLead › writes the record and indexes it by createdAt (after the fixture fix in Deviation 4) |
| removeLead without zrem | removeLead › removes the record and its index entry only; deleteLead › removes the record and its index entry, then goes back to the board |
| saveLead also calling zadd with score 0 | saveLead › overwrites the record and leaves the index alone |
| createLead without requireAdmin | createLead › writes nothing without a session |
| createLead writing despite errors | createLead › returns pt-BR field errors…; rejects an unknown stage and writes nothing |
| createLead with history [] | createLead › stores the normalized lead with its first history entry…; starts at the chosen stage |
| parseInitialStage result ignored (always prospectado) | createLead › starts at the chosen stage; rejects an unknown stage and writes nothing |
| attempt not incremented | createLead › returns pt-BR field errors…; rejects an unknown stage…; reports Redis as unavailable without credentials / when the write fails; updateLead › says the lead is gone for id ../x / for a random UUID |
| insertLead catch removed | createLead › reports Redis as unavailable without credentials; reports Redis as unavailable when the write fails |
| updateLead without requireAdmin | updateLead › changes nothing without a session |
| updateLead adding `history: []` | updateLead › saves the new fields and keeps id, stage, history and createdAt |
| updateLead without the null-lead check (upsert) | updateLead › says the lead is gone for id <random UUID> and creates no record |
| moveLead without requireAdmin | moveLead › changes nothing without a session |
| moveLead appending history when the stage is unchanged | moveLead › changes nothing for its current stage |
| moveLead without the history append | moveLead › moves the lead, appends the stage change and refreshes the board |
| moveLead without `refresh()` | moveLead › moves the lead, appends the stage change and refreshes the board |
| moveLead accepting any stage string | moveLead › changes nothing for an unknown stage |
| deleteLead without requireAdmin | deleteLead › removes nothing without a session |
| deleteLead without isLeadId | deleteLead › ignores an id outside the UUID format |

25 of 25 killed. For the upsert mutation, my first version also overwrote the existing fields. I reran it in a minimal form (defaults spread before `...lead`), and only the missing-lead test failed.

### e2e (not required by the plan; each case got a CI-like `pnpm next build`, then `playwright test -g "leads board"`)

| Mutation | Result |
| -------- | ------ |
| Leads link removed from the /admin header | killed: `locator.click: Test timeout of 30000ms exceeded` |
| `requireAdmin` removed from /admin/leads | killed: `Expected: 307, Received: 200` |
| "Redis indisponível" alert removed (empty board instead) | killed: `Expected substring: "Redis indisponível" … element(s) not found` |

After restoring the files I did a clean CI-like rebuild, and the leads e2e passed again (exit 0).

## Real-Redis visual check at 375 px

The script and its output are in the session scratchpad `/private/tmp/claude-501/-Users-luiz-Documents-Projetos-Pessoal-pansarinitech/0842cfec-1f01-4f3c-a243-3642883e649f/scratchpad/` (`count-keys.mjs`, `visual-check.mjs`, `visual-check-run{1..4}.log`).

- Baseline counts: `leads:* = 0`, `leads-check:* = 0`. Upstash was reachable.
- The `KEY_PREFIX` was temporarily set to `'leads-check'`. `pnpm next build` with the normal env passed, and `next start -p 3100` ran with the e2e admin credentials.
- A Blob preview was available. The Blob index listed `heris-clinica-medica` (disabled) and `odonto-castro`. Lead B linked the first option, `heris-clinica-medica`, and its badge read "Prévia desativada", which is correct for that preview.

Run 1 printed (runs 3 and 4 printed the same 36 PASS lines, 0 failures):

```
PASS a: no "Redis indisponível" alert
PASS a: six column headings in order -> Prospectado | Prévia pronta | Contatado | Em conversa | Proposta | Fechado
PASS a: "Perdido (0)" summary -> Perdido (0)
PASS a: page scroll delta 0 -> 0
PASS b: name error visible
PASS b: e-mail error visible
PASS b: name input aria-invalid -> true
PASS b: WhatsApp keeps (11) 91234-5678 -> (11) 91234-5678
PASS b: source select keeps instagram -> instagram
PASS b: e-mail keeps x -> x
PASS b: page scroll delta 0 -> 0
PASS c: redirected to /admin/leads -> http://localhost:3100/admin/leads
PASS c: A in Prospectado
PASS c: A has data-overdue
PASS c: A shows Atrasado
PASS c: A WhatsApp href -> https://wa.me/5511912345678
PASS c: A E-mail href -> mailto:contato@padariateste.com.br
PASS c: A Telefone href -> tel:1133334444
PASS c: A Instagram href -> https://www.instagram.com/padariateste/
PASS c: A Site href -> https://padariateste.com.br
PASS d: B in Contatado
PASS d: B not Atrasado
PASS d: B no data-overdue
PASS d: B preview link ends with /preview/heris-clinica-medica -> https://pansarini.dev/preview/heris-clinica-medica
PASS d: B preview status label -> Google Maps | Prévia desativada
PASS e: A now in Em conversa
PASS e: B not visible
PASS e: details closed
PASS e: summary "Perdido (1)" -> Perdido (1)
PASS e: B visible after opening Perdido
PASS e: page scroll delta 0 -> 0
info: board scrolls inside itself (scrollWidth 1816 > clientWidth 343)
PASS f: history is Prospectado then Em conversa with timestamps -> Prospectado · 07/10/2026, 10:32 | Em conversa · 07/10/2026, 10:32
PASS f: board shows Ligar na sexta on A
PASS f: still exactly 2 history entries after the edit -> Prospectado · 07/10/2026, 10:32 | Em conversa · 07/10/2026, 10:32
PASS f: page scroll delta 0 -> 0
PASS g: board ends with zero cards -> 0
failures: 0
```

Run 2 failed. It passed a through c, then `page.waitForURL` timed out (15 s) after submitting lead B. The `leads-check:` cleanup that followed deleted 3 keys (the index plus records A and B), so the create action itself had succeeded and stored B. Only the client-side wait for the redirect ran out. The server log showed no error. I reran with failure diagnostics added, and runs 3 and 4 passed in full. I could not reproduce it, so I am reporting it as a one-off timeout in the check script, with the evidence above.

Scroll deltas (page `scrollWidth - clientWidth`): 0 on the board (a), the form with errors (b), the board with Perdido open (e) and the lead page (f), in every completed run. The board itself scrolls horizontally inside its container (1816 > 343).

Screenshots (I viewed all of them):
- `…/scratchpad/leads-form-errors-375.png`: both pt-BR errors, the red name and e-mail fields, WhatsApp and Instagram kept, single column.
- `…/scratchpad/leads-board-375.png`: board scrolled to the start with Perdido (1) open, showing B with "Abrir prévia" and "Prévia desativada". Run 1 took this shot while the board was still scrolled to the Em conversa column. From run 2 on, the script resets `scrollLeft` first.
- `…/scratchpad/leads-board-em-conversa-375.png`: A in Em conversa with the red overdue ring, "Atrasado", the contact links, and the stage select plus Mover.
- `…/scratchpad/lead-detail-375.png`: the lead page with Atrasado, created/updated times, the stage form, contact links, a 2-entry history, the edit form with the WhatsApp shown as `+5511912345678`, and "Excluir lead" closed.

Cleanup: I stopped the 3100 server (only the PID whose cwd is this repo). `CLEAN=1` deleted 0 remaining keys, since run 4's own deletes had already emptied the prefix. Final counts were `leads:* = 0` (equal to the baseline) and `leads-check:* = 0`. `git checkout -- src/lib/admin/lead-store.ts` restored `KEY_PREFIX = 'leads'`, and `git status --short` was empty.

## Final verification (at the tip, clean tree)

1. `pnpm lint`: exit 0, "Checked 214 files … No fixes applied."
2. `pnpm exec next typegen && pnpm exec tsc --noEmit`: types generated, tsc exit 0.
3. `pnpm test:unit`: 45 files, 488 tests passed. `pnpm test:unit:coverage`: exit 0. The coverage report hides fully covered files, and none of the 100%-gated files appear in it (client-preview-source.ts, admin/auth.ts, admin/actions.ts, admin/view.ts, admin/leads.ts, admin/lead-store.ts, admin/lead-actions.ts). The only rows listed are existing component files under their 70% target, unchanged.
4. `pnpm verify:ci-safety`: "No CI-safety violations found."
5. `rm -rf .next`, then the CI-like `pnpm build` (with prebuild). The first attempt failed with `There was an issue requesting https://fonts.gstatic.com/…ibmplexmono…woff2` and `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`, a Google Fonts download failure in `src/app/[locale]/layout.tsx` and unrelated to this change. The URL then returned 200, and the retry exited 0. The prebuild rewrote `src/data/skill-icons.json`, and I restored it with `git checkout` after each build. The CI-like `pnpm next build > build.log && pnpm verify:static build.log` passed: "Static rendering verified: all /[locale] routes are SSG". Route lines:
   ```
   ├ ƒ /admin
   ├ ƒ /admin/[slug]
   ├ ƒ /admin/leads
   ├ ƒ /admin/leads/[id]
   ├ ƒ /admin/leads/new
   ├ ƒ /admin/login
   ├ ● /preview/[slug]
   ```
6. CI-like `PLAYWRIGHT_PORT=3100 pnpm test:e2e`: 15 passed (15.4 s). That includes the 4 admin tests and the new "leads board needs a session, opens from the dashboard and fits 375 px without Redis". The theme-toggle flake did not occur.
7. `git status --short` is empty. `git log --oneline origin/main..HEAD` shows c8a7851, ba87483, 0dea7fe and a1f8afc. Nothing pushed. `.env.local` and `.vercel/` were untouched and are not tracked, `.gitignore` is unchanged, and no secret values were printed.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] `todayInSaoPaulo` built its formatter at module load**
- Found during: Task 1 mutation run (the "no timeZone" mutation survived).
- Issue: a module-level `Intl.DateTimeFormat` takes the process time zone at import, before the test's `vi.stubEnv('TZ', 'UTC')`. This machine runs in America/Sao_Paulo, so the test could not catch a missing `timeZone`. It would only have failed on a UTC box.
- Fix: the formatter is now built inside the function. The mutation is killed.
- Files: src/lib/admin/leads.ts. Amended into 0dea7fe.

**2. [Rule 1 - Bug] Editing a lead with a foreign WhatsApp would prefix 55 again**
- Found during: Task 1 (writing the round-trip test).
- Issue: the stored value is digits only. Fed back into the form, a 10 or 11 digit non-BR number (e.g. `14155550100`) would look like a BR number with DDD and become `5514155550100` on the next save.
- Fix: `leadFormValues` renders the stored WhatsApp as `+<digits>`, so the parser keeps it as is. A round-trip test with a +1 number covers it.
- Files: src/lib/admin/leads.ts, src/lib/admin/leads.test.ts (0dea7fe).

**3. [Rule 3 - Blocking / scope] `pnpm add` also bumped `third-party-web` 0.29.2 to 0.30.0**
- Issue: `@paulirish/trace_engine` (under `@lhci/cli`) declares `third-party-web: "latest"`, so every resolve moves it. That bump is not part of this change.
- Fix: I reverted those three lockfile hunks, so the lockfile adds only `@upstash/redis@1.39.0` and `uncrypto@0.1.3`. `pnpm install --frozen-lockfile` accepts it, and `git diff package.json` added only `"@upstash/redis": "^1.39.0"`.
- Files: pnpm-lock.yaml (ba87483).

**4. [Rule 1 - Test that could not fail] The insertLead score test used createdAt equal to the faked clock**
- Issue: with `createdAt` set to the faked "now", a `Date.now()` score passes too.
- Fix: the fixture now uses `createdAt: '2026-10-03T08:15:00.000Z'`, and the mutation is killed. Amended into ba87483.

**5. [Rule 3 - Blocking] Biome rewrote the Redis mock implementation into an arrow function**
- Issue: `biome check --write` (useArrowFunction) turned `function () { return fake; }` into `() => fake`. Vitest 4 cannot construct an arrow function with `new Redis()`, so every store and action test failed.
- Fix: the function form is restored, with `// biome-ignore lint/complexity/useArrowFunction: the store calls new Redis(), and an arrow function cannot be constructed.` in both test files.

**6. [Rule 3 - Blocking] Biome rejects `div role="region"` (a11y/useSemanticElements)**
- Fix: the board container is `<section aria-label="Quadro de leads" tabIndex={0}>`, which has the implicit region role and follows the pattern in `career-timeline.tsx`. It keeps the planned `noNoninteractiveTabindex` biome-ignore with its reason. `getByRole('region', { name: 'Quadro de leads' })` finds it in the visual check.

### Small choices inside the plan's discretion

- `previewSlug` is capped at 100 characters, since the plan listed no limit for it and it only ever holds a slug from the select. The due date has no length cap, only `z.iso.date()`, so a bad date always reads "Informe uma data válida.".
- The board container has `px-1 pt-1` on top of `pb-2`, so the overdue `ring-2` is not clipped by the scroll container. "Mover" keeps `size="sm"` with `h-8` so it lines up with the h-8 select.
- `lead-card.tsx` also exports `LeadLinks` and `leadPreview`, so the card and the lead page share the same hrefs, labels and preview status. On the lead page the block sits under "Contato e prévia", and it reads "Nenhum contato ou prévia." when there is nothing to show.
- Form labels I picked: "Onde encontrei", "Link de onde encontrei", "Prévia do Blob", "O que fazer", "Até quando", "Anotações", "Etapa inicial". The fieldset legends follow the plan.

## Notes for Luiz

- The e2e 375 px check runs without Redis, so it only covers the header and the "Redis indisponível" alert. The board's in-container scroll with six columns was covered by the real-Redis visual check (scroll delta 0, board 1816 px wide inside a 343 px container).
- `createLead` and `updateLead` show "Não foi possível salvar: o Redis está indisponível." when the write fails. `moveLead` and `deleteLead` follow the plan and let a Redis error reach Next's error page, since they have no form state to return a message through.
- "Abrir prévia" points at `NEXT_PUBLIC_SITE_URL` or `https://pansarini.dev`, the same as the existing preview links, so locally it opens production.

## Known Stubs

None. The only "placeholder" matches are input hints (`exemplo.com.br`, `(11) 91234-5678`).

## Threat Flags

None beyond the plan's threat model. `KV_REST_API_URL` and `KV_REST_API_TOKEN` are read only in `src/lib/admin/lead-store.ts` on the server, and `lead-form.tsx` imports only types from lib modules.

## Self-Check: PASSED

- Files: all 13 created files listed above exist, and the plan's 23 `files_modified` paths are all in the three commits.
- Commits: 0dea7fe, ba87483 and c8a7851 exist on `feat/leads-board`.
