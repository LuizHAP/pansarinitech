---
phase: quick-261007-dep
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/admin/leads.ts
  - src/lib/admin/leads.test.ts
  - src/lib/client-preview-source.ts
  - src/lib/client-preview-source.test.ts
  - src/lib/admin/view.ts
  - src/lib/admin/view.test.ts
  - vitest.config.mts
  - package.json
  - pnpm-lock.yaml
  - src/test/mocks/upstash-redis.ts
  - src/lib/admin/lead-store.ts
  - src/lib/admin/lead-store.test.ts
  - src/lib/admin/lead-actions.ts
  - src/lib/admin/lead-actions.test.ts
  - src/components/ui/native-select.tsx
  - src/components/admin/lead-card.tsx
  - src/components/admin/lead-form.tsx
  - src/app/admin/leads/page.tsx
  - src/app/admin/leads/new/page.tsx
  - src/app/admin/leads/[id]/page.tsx
  - src/app/admin/page.tsx
  - tests/e2e.spec.ts
  - README.md
autonomous: true
requirements: [quick-261007-dep]

must_haves:
  truths:
    - "/admin/leads, /admin/leads/new and /admin/leads/<id> call requireAdmin first and redirect to /admin/login without a session; createLead, updateLead, moveLead and deleteLead call requireAdmin first and write nothing to Redis without a session"
    - "Each lead is one JSON record at leads:lead:<id> in Upstash Redis, listed through the sorted set leads:index (score = createdAt ms). The client is built with new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN }). Create writes the record and the index entry, delete removes both, update and move rewrite only the record"
    - "The board shows the columns Prospectado, Prévia pronta, Contatado, Em conversa, Proposta, Fechado in that order. They scroll horizontally inside the board container, and at 375 px the page has no horizontal scroll. Perdido is a <details> section after the columns, closed by default"
    - "Each card has a stage <select> and a Mover button that submits moveLead. Create writes the first {stage, at} history entry. Every real stage change appends one, and editing fields adds none. The lead page lists the history with São Paulo timestamps"
    - "Cards link WhatsApp as https://wa.me/<digits>, e-mail as mailto:, phone as tel:, Instagram as https://www.instagram.com/<handle>/, plus the website and the source link. They show the source label, the next step and due date, and the linked Blob preview's public link with Prévia ativa / Prévia desativada. A due date before today in America/Sao_Paulo highlights the card and shows Atrasado"
    - "The create and edit forms are validated on the server with zod. useActionState shows pt-BR field errors, and the values typed in text fields and selects survive a failed submit. Delete goes through a <details> confirmation, with no window.confirm"
    - "Without Redis credentials (CI) /admin/leads shows the 'Redis indisponível' alert and returns 200, not a 500"
    - "A Blob preview whose slug is leads or login gets the reserved-slug warning in the admin; /admin's header links to /admin/leads"
  artifacts:
    - path: "src/lib/admin/leads.ts"
      provides: "Lead model, stages, sources, zod form parsing, link/date/grouping/preview-status helpers"
      exports: ["LEAD_STAGES", "BOARD_STAGES", "STAGE_LABELS", "LEAD_SOURCES", "SOURCE_LABELS", "parseLeadInput", "readLeadForm", "leadFormValues", "parseInitialStage", "isLeadId", "isLeadStage", "whatsappHref", "telHref", "mailtoHref", "instagramHref", "todayInSaoPaulo", "isOverdue", "formatDueDate", "groupLeadsByStage", "previewStatus", "leadPreviewOptions"]
    - path: "src/lib/admin/lead-store.ts"
      provides: "Upstash Redis client from KV_* env and lead persistence"
      exports: ["LEADS_INDEX_KEY", "leadKey", "getLeadsRedis", "listLeads", "findLead", "insertLead", "saveLead", "removeLead"]
    - path: "src/lib/admin/lead-actions.ts"
      provides: "requireAdmin-guarded Server Actions for leads"
      exports: ["createLead", "updateLead", "moveLead", "deleteLead"]
    - path: "src/app/admin/leads/page.tsx"
      provides: "Leads board"
      contains: "Redis indisponível"
    - path: "src/components/admin/lead-card.tsx"
      provides: "Lead card and stage form"
      contains: "moveLead.bind"
    - path: "src/components/admin/lead-form.tsx"
      provides: "Create/edit form with useActionState"
      contains: "useActionState"
  key_links:
    - from: "src/lib/admin/lead-store.ts getLeadsRedis"
      to: "@upstash/redis Redis"
      via: "new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN })"
      pattern: "KV_REST_API_URL"
    - from: "src/lib/admin/lead-actions.ts"
      to: "requireAdmin"
      via: "first statement of every exported action"
      pattern: "await requireAdmin\\(\\)"
    - from: "src/components/admin/lead-card.tsx StageForm"
      to: "moveLead"
      via: "<form action={moveLead.bind(null, lead.id)}> with <select name=\"stage\">"
      pattern: "moveLead\\.bind"
    - from: "src/app/admin/leads/page.tsx"
      to: "listLeads + getPreviewIndex"
      via: "Promise.all, then groupLeadsByStage and previewStatus"
      pattern: "listLeads\\(\\)"
    - from: "src/app/admin/page.tsx"
      to: "/admin/leads"
      via: "header link"
      pattern: "href=\"/admin/leads\""
---

<objective>
Give Luiz a leads board in the hidden admin at `/admin/leads`. He uses it to track the businesses he prospects for client previews, from "Prospectado" to "Fechado" or "Perdido". Leads live in the Upstash Redis that is already provisioned through the Vercel Marketplace, as one JSON record per lead plus a sorted-set index. Every page and action is admin-only. The board works on a 375 px phone.

Purpose: the client-preview pipeline (Blob previews) now has a place to track who each preview is for, how to reach them, the next step and when it is due.
Output: a pure lead module (model, validation, helpers), a Redis store, four Server Actions, the board, the create and lead pages, a header link, a reserved-slug preview warning, unit tests with mutation proofs, one e2e test, and README EN/PT.

Out of scope for the executor: pushing, opening a PR, deploying, switching branches, writing any `leads:*` key in Redis (the visual check uses a throwaway prefix and cleans it up).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@.planning/quick/261006-fc8-disable-blob-client-previews-from-the-ad/261006-fc8-SUMMARY.md
@.agents/skills/upstash-redis-js/SKILL.md
@.agents/skills/upstash-redis-js/advanced-features/pipeline-and-transactions.md
@.agents/skills/upstash-redis-js/data-structures/sorted-sets.md
@src/lib/admin/auth.ts
@src/lib/admin/actions.ts
@src/lib/admin/actions.test.ts
@src/lib/admin/view.ts
@src/lib/admin/view.test.ts
@src/lib/client-preview-source.ts
@src/app/admin/page.tsx
@src/app/admin/[slug]/page.tsx
@src/components/admin/login-form.tsx
@src/components/ui/input.tsx
@tests/e2e.spec.ts
@vitest.config.mts

<repo_rules>
These come from the user and apply to every task:
- Branch `feat/leads-board` is already checked out off origin/main. Do NOT switch or create branches. Do NOT push. Make one commit per task and stage explicit paths only, never `git add -A` or `git add .`.
- Code comments: as few as possible, and only for a non-obvious why. No ticket, task or plan IDs, no "added for X", no narration, no docblocks that restate names. Leave existing comments alone.
- The husky pre-commit hook runs `pnpm lint`, `pnpm verify:ci-safety` and `pnpm test:unit`, and all three must pass at each commit. Never use `--no-verify`. If Biome only complains about import order or formatting, run `pnpm exec biome check --write <touched files>`. The `rtk` hook can break Biome ("Linter process terminated abnormally"). If that happens, run it raw as `rtk proxy pnpm exec biome check .`.
- `next/link` is banned by Biome. Admin links stay plain `<a>`, and any `target="_blank"` link keeps `rel="noopener noreferrer"`.
- `cacheComponents` stays OFF. Do not use `'use cache'`.
- `.env.local` exists and is gitignored. It holds ADMIN_USER, ADMIN_PASSWORD, BLOB_STORE_ID, VERCEL_OIDC_TOKEN and the Upstash KV_* / REDIS_URL values. Never print, edit or commit it, and never run `vercel env pull`. A script that needs Redis loads it with `node --env-file=.env.local` and prints counts only, never values or env.
- Next loads `.env.local` for `next build` and `next start`, but it never overrides a variable that is already set, even to an empty string. Commands that must behave like CI (the final build and e2e) are prefixed with exactly this, which is called the **CI-like prefix** below: `env BLOB_STORE_ID= VERCEL_OIDC_TOKEN= BLOB_READ_WRITE_TOKEN= KV_REST_API_URL= KV_REST_API_TOKEN= KV_REST_API_READ_ONLY_TOKEN= KV_URL= REDIS_URL= ADMIN_USER= ADMIN_PASSWORD=`. Without it, the existing "Blob indisponível" e2e assertion and the new "Redis indisponível" one can fail locally. Playwright's webServer still sets the e2e admin credentials.
- `pnpm build` runs a `prebuild` hook that rewrites tracked files (at least `src/data/skill-icons.json`, possibly `public/feed*.xml`). Restore each one with `git checkout -- <path>` and never commit them. During tasks, build with `pnpm next build`, which skips prebuild.
- Use port 3100 (`PLAYWRIGHT_PORT=3100`). Before each server start or Playwright run after a rebuild, kill only servers on 3100 whose cwd is this repo (`lsof -ti:3100`, then check the cwd with `lsof -p <pid> | awk '$4=="cwd"'`), because `reuseExistingServer` would reuse a stale build. Never kill a process whose cwd is not this repo.
- Temp files (build logs, screenshots, scripts) go in the session scratchpad, never `/tmp` directly and never the repo.
- `src/lib/admin/actions.ts` and every `'use server'` file export only async functions and types.
</repo_rules>

<interfaces>
Verified on 2026-10-07. Use these directly.

@upstash/redis 1.39.0 (npm `latest`, published 2026-09-21, repo github.com/upstash/redis-js, maintainers @upstash.com, single dependency `uncrypto`):
```ts
import { Redis } from '@upstash/redis';
new Redis({ url: string, token: string }); // Redis.fromEnv() would read UPSTASH_REDIS_REST_*; do not use it
redis.get<T>(key): Promise<T | null>;            // auto-deserializes JSON
redis.set(key, value: object): Promise<'OK'>;    // auto-serializes; never JSON.stringify yourself
redis.mget<T extends unknown[]>(...keys: string[]): Promise<T>; // real server errors on zero keys
redis.del(...keys: string[]): Promise<number>;
redis.zadd(key, { score: number, member: string }): Promise<number | null>;
redis.zrem(key, ...members: string[]): Promise<number>;
redis.zrange<string[]>(key, 0, -1): Promise<string[]>; // ascending by score
const tx = redis.multi(); tx.set(...); tx.zadd(...); await tx.exec(); // MULTI/EXEC: one round trip, no interleaving, no rollback
redis.scan(cursor, { match: 'prefix:*', count: 100 }): Promise<[cursor, string[]]>; // verification scripts only
```

zod 4.4.2 (checked in node): `z.iso.date()` rejects 2026-02-30, 2026-02-29 and 2026-13-01 and accepts 2028-02-29. `z.email()` rejects 'x' and 'a@b'. `z.url()` ACCEPTS 'javascript:alert(1)', so URL fields need an explicit http/https check. Messages use the `{ error: '...' }` param.

Intl: `new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date('2026-10-08T02:30:00Z'))` returns '2026-10-07'.

next 16.2.4: `refresh()` from 'next/cache' refreshes the client router and works only inside Server Actions (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/refresh.md`). `redirect()` throws, so call it outside any try/catch. A static segment (`/admin/leads`) wins over `/admin/[slug]`. That is why a Blob preview slugged `leads` or `login` can never open its admin detail page.

React 19: after a form action settles, React resets the form's uncontrolled fields. A `<select>` can fall back to its first option even when `defaultValue` changed. The form below remounts with `key={state.attempt}` so every field takes the returned values.

Existing contracts (unchanged unless listed):
```ts
// src/lib/admin/auth.ts
export async function requireAdmin(): Promise<void>; // connection(); notFound() without env; redirect('/admin/login') without a valid session
// src/lib/client-preview-source.ts
export type PreviewWarningCode = 'invalid-slug' | 'missing-index' | 'missing-title' | 'absolute-asset-refs' | 'shadowed-by-repo';
export type IndexedPreview = ClientPreview & { hasIndex: boolean; disabled: boolean; files; fileCount; totalSize; updatedAt: string; warnings: PreviewWarning[] };
export type PreviewIndex = { generatedAt: string; available: boolean; previews: IndexedPreview[] };
export function isPreviewSlug(slug: string): boolean; // /^[a-z0-9-]+$/
export const getPreviewIndex: () => Promise<PreviewIndex>; // unstable_cache, tag 'client-previews', 300 s
// collectWarnings(slug, hasIndex, client, html) is module-private and builds each IndexedPreview.warnings
// src/lib/admin/view.ts
export const WARNING_MESSAGES: Record<PreviewWarningCode, string>;
export function previewUrl(slug: string): string; // `${NEXT_PUBLIC_SITE_URL ?? 'https://pansarini.dev'}/preview/${slug}`
export function formatDateTime(iso: string): string; // pt-BR short date+time in America/Sao_Paulo
// src/lib/admin/actions.ts
export async function logout(): Promise<void>;
```

Test patterns to copy from `src/lib/admin/actions.test.ts`: the hoisted cookie jar, the `next/headers`, `next/navigation` (redirect and notFound throw `NEXT_REDIRECT <url>` / `NEXT_NOT_FOUND`) and `next/server` mocks, `signIn()`, and `vi.stubEnv('ADMIN_USER'|'ADMIN_PASSWORD')`. `client-preview-source.ts` calls `unstable_cache` when the module loads, so any test that mocks `next/cache` must include `unstable_cache: (fn) => fn`.

New contracts this plan creates:
```ts
// src/lib/admin/leads.ts — server-side only (imports zod and isPreviewSlug). Client components import TYPES from it, never values.
export const LEAD_STAGES = ['prospectado', 'previa-pronta', 'contatado', 'em-conversa', 'proposta', 'fechado', 'perdido'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export const BOARD_STAGES: readonly LeadStage[]; // the first six, in order
export const STAGE_LABELS: Record<LeadStage, string>; // Prospectado, Prévia pronta, Contatado, Em conversa, Proposta, Fechado, Perdido
export const LEAD_SOURCES = ['google-maps', 'instagram', 'facebook', 'indicacao', 'outro'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
export const SOURCE_LABELS: Record<LeadSource, string>; // Google Maps, Instagram, Facebook, Indicação, Outro
export type SelectOption = { value: string; label: string };
export const STAGE_OPTIONS: SelectOption[]; export const SOURCE_OPTIONS: SelectOption[];
export type StageChange = { stage: LeadStage; at: string };
export type LeadInput = {
  name: string; website: string | null; source: LeadSource; sourceUrl: string | null;
  whatsapp: string | null; email: string | null; phone: string | null; instagram: string | null;
  previewSlug: string | null; nextStep: string | null; dueDate: string | null; notes: string | null;
};
export type Lead = LeadInput & { id: string; stage: LeadStage; history: StageChange[]; createdAt: string; updatedAt: string };
export const LEAD_FORM_FIELDS = ['name', 'website', 'source', 'sourceUrl', 'whatsapp', 'email', 'phone', 'instagram', 'previewSlug', 'nextStep', 'dueDate', 'notes', 'stage'] as const;
export type LeadFormField = (typeof LEAD_FORM_FIELDS)[number];
export type LeadFormValues = Record<LeadFormField, string>;
export type LeadFormErrors = Partial<Record<LeadFormField, string>>;
export type LeadPreviewStatus = 'active' | 'disabled' | 'missing' | 'unknown';
export const PREVIEW_STATUS_LABELS: Record<LeadPreviewStatus, string>;
export function isLeadId(value: string): boolean;               // lowercase UUID v4
export function isLeadStage(value: unknown): value is LeadStage;
export function readLeadForm(formData: FormData): LeadFormValues; // every field; non-string -> ''
export function leadFormValues(lead?: Lead): LeadFormValues;
export function parseLeadInput(values: LeadFormValues): { ok: true; input: LeadInput } | { ok: false; errors: LeadFormErrors };
export function parseInitialStage(value: string): LeadStage | null; // '' -> 'prospectado'
export function whatsappHref(digits: string): string; export function telHref(phone: string): string;
export function mailtoHref(email: string): string; export function instagramHref(handle: string): string;
export function todayInSaoPaulo(now?: Date): string; // 'YYYY-MM-DD'
export function isOverdue(dueDate: string | null, today: string): boolean;
export function formatDueDate(date: string): string; // 'DD/MM/YYYY'
export function groupLeadsByStage(leads: readonly Lead[]): Record<LeadStage, Lead[]>;
export function previewStatus(index: PreviewIndex, slug: string): LeadPreviewStatus;
export function leadPreviewOptions(index: PreviewIndex, current: string | null): SelectOption[];
// src/lib/client-preview-source.ts: PreviewWarningCode gains 'reserved-slug'
// src/lib/admin/lead-store.ts
export const LEADS_INDEX_KEY: string; // 'leads:index'
export function leadKey(id: string): string; // 'leads:lead:<id>'
export function getLeadsRedis(env?: NodeJS.ProcessEnv): Redis | null;
export async function listLeads(): Promise<{ available: boolean; leads: Lead[] }>;
export async function findLead(id: string): Promise<{ available: boolean; lead: Lead | null }>;
export async function insertLead(lead: Lead): Promise<void>; // throws without a client
export async function saveLead(lead: Lead): Promise<void>;   // throws without a client
export async function removeLead(id: string): Promise<void>; // throws without a client
// src/lib/admin/lead-actions.ts ('use server')
export type LeadFormState = { errors: LeadFormErrors; message: string | null; values: LeadFormValues | null; attempt: number };
export async function createLead(previous: LeadFormState, formData: FormData): Promise<LeadFormState>;
export async function updateLead(id: string, previous: LeadFormState, formData: FormData): Promise<LeadFormState>;
export async function moveLead(id: string, formData: FormData): Promise<void>;
export async function deleteLead(id: string): Promise<void>;
// src/components/ui/native-select.tsx (no directive, presentational, same tokens as Input)
export function NativeSelect(props: React.ComponentProps<'select'>);
// src/components/admin/lead-card.tsx (server component, no directive)
export function StageForm({ lead }: { lead: Lead });
export function LeadCard({ lead, today, preview }: { lead: Lead; today: string; preview: { url: string; status: LeadPreviewStatus } | null });
// src/components/admin/lead-form.tsx ('use client')
export function LeadForm(props: {
  action: (state: LeadFormState, formData: FormData) => Promise<LeadFormState>;
  defaults: LeadFormValues; sourceOptions: SelectOption[]; previewOptions: SelectOption[];
  stageOptions?: SelectOption[]; submitLabel: string;
});
```
</interfaces>

<decision_coverage>
Locked decisions from the orchestrator, and the task that implements each:
- Upstash Redis client built explicitly from KV_REST_API_URL / KV_REST_API_TOKEN (not `Redis.fromEnv()`), `@upstash/redis` installed with pnpm: Task 2
- One JSON record per lead plus a sorted-set index of ids: Task 2
- Route /admin/leads, linked from the /admin header; create, edit and delete leads: Task 3 (actions in Task 2)
- Stages in order, with Perdido as a collapsed section at the end: Task 1 (model, grouping), Task 3 (board)
- A stage <select> on each card that submits a server action, with no drag-and-drop library: Task 2 (moveLead), Task 3 (StageForm)
- Lead fields: business name (required), website, source of five values plus an optional link, WhatsApp (wa.me), e-mail (mailto), phone (tel), Instagram handle or link, linked Blob preview with active/disabled status, next step plus due date with an overdue highlight in America/Sao_Paulo, notes, automatic stage history: Task 1 (parsing, hrefs, dates, preview status), Task 2 (history writes), Task 3 (rendering)
- Board works at 375 px, columns scroll inside the board, and the page never scrolls horizontally: Task 3 (layout, e2e, visual check)
- All copy in pt-BR, in the existing admin's tone: Tasks 1-3
- Admin-only, with requireAdmin first in every action and page: Task 2 (actions), Task 3 (pages)
- Reserve "leads" (and "login", which already collides) as a preview warning: Task 1
- Unavailable state when Redis credentials are missing, not a 500: Task 2 (`available: false`), Task 3 (alert and e2e)
- Server-side zod validation with pt-BR field errors via useActionState: Task 1 (schema), Task 2 (state), Task 3 (form)
- Delete without window.confirm: Task 3 (`<details>` confirmation)
- Vitest with @upstash/redis mocked, asserting what is written to Redis: Task 2
- Full verification commands: final verification

Planner decisions (discretion areas, documented here, not scope additions):
- Moving a lead uses a `<select name="stage">` plus a "Mover" submit button in a plain server `<form>`. The board does not submit on change. An on-change submit moves the card out from under the user's focus while they are still choosing (WCAG 3.2.2 On Input), and it needs client JS for every card. **Flag this in the SUMMARY so Luiz can ask for submit-on-change if he prefers it.**
- The stage changes only through moveLead. The edit form has no stage field, so history entries come from one place. The create form has a stage select (default Prospectado) for leads that were already contacted elsewhere, and its single history entry records that stage.
- "Onde encontrei" is required and always carries one of the five values (the select has no empty option, default Google Maps). Its link is optional. Business name is the only free-text required field.
- Normalization: a website or source link without a scheme gets `https://`. Only http/https with a dotted hostname is accepted, which blocks `javascript:` hrefs. WhatsApp keeps digits only, with leading zeros dropped. If the input did not start with `+` and has 10 or 11 digits (a BR number with DDD), it gets the `55` country code. The result must be 10-15 digits. Instagram accepts `@handle`, `handle` or an instagram.com profile URL and stores the bare handle (`[A-Za-z0-9._]{1,30}`). The phone is stored as typed (trimmed) and must hold 8-15 digits. `tel:` keeps a leading `+` when typed.
- Limits: name 120, website and source link 500, e-mail 254, phone and WhatsApp 30, Instagram 100, next step 200, notes 5000 characters.
- Ordering inside a column: due date ascending, leads without a date after those with one, then updatedAt descending. The most urgent lead sits on top.
- "Atrasado" means the due date is strictly before today in São Paulo. A date of today is not late. The highlight applies in every stage, as decided.
- Preview status comes from the cached Blob index (`getPreviewIndex`), with no extra Blob call. A preview that is in the index and disabled is "Prévia desativada". One that is in the index with index.html is "Prévia ativa". One that is missing, or lacks index.html, is "Prévia não encontrada". If the index is unavailable, the status is "Status da prévia indisponível". The preview select lists the index's valid slugs and keeps a linked slug that dropped out of the index as "(fora do índice)". The server checks only the slug format, because the index can be unavailable or stale.
- After a successful create or edit the action redirects to the board. Move calls `refresh()`, since the board and lead pages read uncached Redis and only the client router needs a refresh. Delete redirects to the board.
- The form posts with `noValidate`, so the pt-BR server messages are the only validation the user sees (native bubbles follow the browser language).
- `leads.ts` imports zod and `isPreviewSlug` at runtime, which pulls the Blob module in. `lead-form.tsx` therefore imports only types from it and gets every option list as props. The select styling lives in a new `NativeSelect` primitive with no directive, so both server and client components can use it.
- The shared in-memory fake Redis lives in `src/test/mocks/` (the repo's existing home for test stand-ins). It mirrors the real client where it matters: JSON round trip, zrange ascending by score, mget rejecting zero keys.
- The visual check needs a real Redis round trip, because mocks cannot prove that auto-serialization and the KV env wiring work. It runs against the provisioned database with the key prefix temporarily changed to `leads-check`, which is never committed. Before and after, it counts `leads:*` keys to prove they were untouched, and it deletes every `leads-check:*` key. **Flag this in the SUMMARY.**
- Task 3 is the heaviest task (8 product files plus README). If context gets tight during execution, split it at the board/card versus form/lead-page boundary into two commits, and record the split.
</decision_coverage>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Lead model, zod form parsing and view helpers; reserved-slug preview warning</name>
  <files>src/lib/admin/leads.ts, src/lib/admin/leads.test.ts, src/lib/client-preview-source.ts, src/lib/client-preview-source.test.ts, src/lib/admin/view.ts, src/lib/admin/view.test.ts, vitest.config.mts</files>
  <behavior>
    leads.test.ts (node project, no mocks needed):
    - constants: LEAD_STAGES order is exactly prospectado, previa-pronta, contatado, em-conversa, proposta, fechado, perdido. BOARD_STAGES is the first six. STAGE_LABELS and SOURCE_LABELS hold the pt-BR labels from the interfaces. STAGE_OPTIONS and SOURCE_OPTIONS map value to label in order.
    - isLeadId: true for `randomUUID()` from node:crypto; false for 'abc', '../x', '' and an uppercase UUID. isLeadStage: true for every stage, false for 'ganho' and for a number.
    - readLeadForm: returns all 13 keys. Missing fields read as '', a File value reads as '', and strings are returned untrimmed.
    - parseLeadInput, valid full input: name ' Padaria ' gives 'Padaria'. Website 'padaria.com.br' gives 'https://padaria.com.br', and 'http://x.com/a' is kept. Source 'instagram'. sourceUrl '' gives null. WhatsApp '(11) 91234-5678' gives '5511912345678', '+55 11 91234-5678' gives '5511912345678', '011 91234-5678' gives '5511912345678' and '+1 415 555 0100' gives '14155550100'. E-mail ' a@b.co ' gives 'a@b.co'. Phone '(11) 3333-4444' is kept as typed. Instagram '@padaria', 'padaria', 'https://www.instagram.com/padaria/' and 'instagram.com/padaria?igsh=1' all give 'padaria'. previewSlug 'acme' gives 'acme', and '' gives null. nextStep, dueDate '2026-10-07' and notes are trimmed, and '' gives null.
    - parseLeadInput errors (ok false, exact messages, first error per field): name '   ' gives 'Informe o nome do negócio.'. A 121-char name gives 'Use no máximo 120 caracteres.', and 5001-char notes give 'Use no máximo 5000 caracteres.'. Website 'javascript:alert(1)', 'ftp://x.com' and 'localhost' give 'Informe um endereço válido, como exemplo.com.br.', and sourceUrl uses the same message. Source 'tiktok' gives 'Escolha de onde veio o lead.'. WhatsApp '91234-5678' gives 'Informe o WhatsApp com DDD, como (11) 91234-5678.'. E-mail 'x' gives 'Informe um e-mail válido.'. Phone '123' gives 'Informe o telefone com DDD.'. Instagram 'pada ria' and 'instagram.com/p/abc' give 'Informe o @ ou o link do perfil.'. previewSlug 'Bad_Slug' gives 'Escolha uma prévia da lista.'. dueDate '2026-02-30' gives 'Informe uma data válida.'. With several bad fields at once, every one of them gets its error.
    - parseInitialStage: '' gives 'prospectado', 'contatado' gives 'contatado', 'ganho' gives null.
    - leadFormValues(): every field is '' except source 'google-maps' and stage 'prospectado'. leadFormValues(lead) maps nulls to '' and the instagram handle to '@handle', and it round-trips: parseLeadInput(leadFormValues(lead)) returns that lead's LeadInput unchanged.
    - hrefs: whatsappHref('5511912345678') gives 'https://wa.me/5511912345678'. telHref('(11) 3333-4444') gives 'tel:1133334444', and telHref('+55 11 3333-4444') gives 'tel:+551133334444'. mailtoHref('a@b.co') gives 'mailto:a@b.co'. instagramHref('padaria') gives 'https://www.instagram.com/padaria/'.
    - todayInSaoPaulo(new Date('2026-10-08T02:30:00Z')) is '2026-10-07' and (new Date('2026-10-08T03:30:00Z')) is '2026-10-08', with `vi.stubEnv('TZ', 'UTC')`.
    - isOverdue: ('2026-10-06', '2026-10-07') true, ('2026-10-07', '2026-10-07') false, (null, '2026-10-07') false.
    - formatDueDate('2026-10-07') is '07/10/2026' with `vi.stubEnv('TZ', 'America/Los_Angeles')`, so an implementation that goes through Date and shifts a day fails.
    - groupLeadsByStage: returns all 7 keys, empty stages as []. Inside a stage the order is due date ascending, then no-date leads, newest updatedAt first. Check with 4 fixture leads: due 2026-10-10, no date updated 2026-10-02, due 2026-10-01, no date updated 2026-10-05, which sort to 10-01, 10-10, the 10-05 no-date lead, the 10-02 no-date lead. A perdido lead lands only under perdido.
    - previewStatus: build a PreviewIndex fixture like view.test.ts's `indexed()`. 'on' (hasIndex, not disabled) is 'active', 'off' (disabled) is 'disabled', 'no-index' (hasIndex false) is 'missing', and 'gone' is 'missing' with available true and 'unknown' with available false. PREVIEW_STATUS_LABELS are 'Prévia ativa', 'Prévia desativada', 'Prévia não encontrada', 'Status da prévia indisponível'.
    - leadPreviewOptions: the first option is { value: '', label: 'Nenhuma' }. Then come the index previews whose slug passes isPreviewSlug, sorted by client in pt-BR, labelled `<client> (<slug>)`, with ' · desativada' appended when disabled. A 'Bad_Slug' preview is left out. A current slug missing from the index is appended as { value: slug, label: '<slug> (fora do índice)' }, and a current slug that is present is not duplicated.
    client-preview-source.test.ts (add to the buildPreviewIndex describe, reusing `listing`, `listed`, `serving`):
    - New 'warns about a folder named after an admin page': listing `leads/index.html`, `login/index.html` and `acme-leads/index.html`, each served with a `<title>`. leads and login each have warnings exactly [{ code: 'reserved-slug' }], and acme-leads has [].
    view.test.ts: the WARNING_MESSAGES it.each list gains 'reserved-slug'.
  </behavior>
  <action>
Write the tests above and watch them fail. Then implement.

`src/lib/admin/leads.ts` (new): export everything listed for it in the interfaces. Import `z` from 'zod', `isPreviewSlug` from '@/lib/client-preview-source', and `type PreviewIndex` from there as a type-only import. Build parseLeadInput on one zod 4 `z.object` keyed by the 12 input fields (not stage). Each field is a string schema with `.trim()` and `.max(n, { error: 'Use no máximo N caracteres.' })` using the limits in the planner decisions. Normalization and format checks go in `.transform` / `.superRefine` steps that emit the exact pt-BR messages from the behavior block. Empty optional fields become null. Use `z.email()` for the e-mail and `z.iso.date()` for the due date. For URLs, prepend `https://` when the value has no `scheme:` prefix, parse with `new URL`, and require protocol http: or https: and a hostname containing a dot. Store the trimmed (prefixed) string, not `url.href`. For the source, check the value is one of LEAD_SOURCES. Map `safeParse` issues to `errors[path[0]]` and keep the first message per field. readLeadForm reads each LEAD_FORM_FIELDS name with `typeof value === 'string' ? value : ''`, like `field()` in actions.ts. todayInSaoPaulo uses the en-CA Intl formatter from the interfaces. formatDueDate splits the string and never constructs a Date. groupLeadsByStage seeds every LEAD_STAGES key with [] and sorts with the documented comparator. previewStatus and leadPreviewOptions read only `index.previews` (the repo registry is empty, and the decision is "chosen from the existing previews in the Blob index"). This file has no React and no next/* imports.

`src/lib/client-preview-source.ts`: add 'reserved-slug' to PreviewWarningCode. Add a module constant set of admin route slugs, 'leads' and 'login'. Write one short why-comment on it: these static /admin routes win over /admin/[slug]. In collectWarnings, push { code: 'reserved-slug' } right after the invalid-slug check when the set has the exact slug.

`src/lib/admin/view.ts`: add WARNING_MESSAGES['reserved-slug'] = 'O slug é o mesmo de uma página do admin, então o link desta prévia abre essa página e não o detalhe. A URL pública funciona normalmente.'

`vitest.config.mts`: append 'src/lib/admin/leads.ts' to LIB_DATA_FILES, which puts it under the 100% gate. Never lower a threshold.

Commit the 7 files: `feat(admin): add the lead model and flag preview slugs taken by admin pages`.

After the commit, prove the tests can fail. Apply one mutation at a time, run `pnpm exec vitest --run src/lib/admin/leads.test.ts src/lib/client-preview-source.test.ts src/lib/admin/view.test.ts`, note the failing test names, and restore with `git checkout -- <file>`. Record the table in the SUMMARY:
- the WhatsApp 55 prefix removed
- the 55 prefix also applied to '+' input
- the WhatsApp length check removed
- the http/https protocol check removed
- no https:// prefix for bare domains
- '@' kept in the Instagram handle
- the instagram.com URL not reduced to the handle
- `z.iso.date()` swapped for a plain regex
- name not trimmed
- the name max length dropped
- isOverdue using `<=`
- todayInSaoPaulo without the timeZone option
- formatDueDate through `new Date(date).toLocaleDateString('pt-BR')`
- groupLeadsByStage putting no-date leads first
- previewStatus returning 'active' for disabled previews
- previewStatus returning 'missing' when the index is unavailable
- leadPreviewOptions dropping an out-of-index current slug
- isLeadId accepting any non-empty string
- the reserved-slug check removed
- 'login' missing from the set
- the reserved-slug check using `slug.includes(...)`
- the reserved-slug message removed (tsc and the it.each fail)
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && pnpm exec vitest --run src/lib/admin src/lib/client-preview-source.test.ts && pnpm test:unit:coverage && pnpm exec biome check . && pnpm exec next typegen && pnpm exec tsc --noEmit && grep -v '^[[:space:]]*//' src/lib/client-preview-source.ts | grep -q "reserved-slug" && grep -q "'src/lib/admin/leads.ts'" vitest.config.mts && echo task1-ok</automated>
  </verify>
  <done>leads.ts exports the full contract from the interfaces, and every behavior above passes. A Blob preview slugged leads or login carries the reserved-slug warning, and WARNING_MESSAGES has its pt-BR text. leads.ts sits at 100% under the coverage gate, and client-preview-source.ts and view.ts stay at 100%. Every listed mutation makes at least one test fail. The commit holds exactly the 7 files.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Upstash Redis lead store and admin-only lead Server Actions</name>
  <files>package.json, pnpm-lock.yaml, src/test/mocks/upstash-redis.ts, src/lib/admin/lead-store.ts, src/lib/admin/lead-store.test.ts, src/lib/admin/lead-actions.ts, src/lib/admin/lead-actions.test.ts, vitest.config.mts</files>
  <behavior>
    Shared setup in both test files: `vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }))`. A `FakeRedis` from '@/test/mocks/upstash-redis' is created once. In beforeEach, call `fake.reset()` and `vi.mocked(Redis).mockImplementation(function () { return fake; } as never)`. Stub KV_REST_API_URL 'https://example-test.upstash.io' and KV_REST_API_TOKEN 'test-token' (each test that needs "no credentials" stubs them undefined). Use `vi.useFakeTimers({ toFake: ['Date'] })` plus `vi.setSystemTime('2026-10-07T12:00:00.000Z')`, and restore real timers and env in afterEach. Seed leads by writing straight into the fake (record plus index entry) with a `lead()` fixture builder.
    lead-store.test.ts:
    - getLeadsRedis: returns null without the URL and null without the token, and Redis is not constructed. With both set, it returns the fake, and Redis was constructed once with exactly { url: 'https://example-test.upstash.io', token: 'test-token' }. With only UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set (KV undefined), it returns null.
    - listLeads: without credentials it is { available: false, leads: [] }. An empty index gives { available: true, leads: [] }, and this test fails if mget is called, because the fake rejects zero keys like the real server. Two seeded leads come back in index-score order. An index id whose record is gone is skipped. zrange rejecting gives { available: false, leads: [] }.
    - findLead: returns { available: true, lead } for a seeded id and { available: true, lead: null } for an unknown one. Without credentials, or with get rejecting, it returns { available: false, lead: null }.
    - insertLead: afterwards the fake holds the record at 'leads:lead:<id>' (deep-equal after the JSON round trip) and 'leads:index' has the member id with score Date.parse(createdAt). Without credentials it rejects and the fake stays empty.
    - saveLead: overwrites the record and leaves the index untouched.
    - removeLead: removes both the record and the index member. Another lead stays.
    lead-actions.test.ts (copy the next/headers, next/navigation and next/server mocks and `signIn()` from actions.test.ts; mock next/cache as { unstable_cache: (fn) => fn, updateTag: vi.fn(), refresh: vi.fn() }, @vercel/blob as { get, list, put, del } vi.fn()s, @vercel/functions as { addCacheTag, invalidateByTag, dangerouslyDeleteByTag } vi.fn()s):
    - createLead without a session: rejects with NEXT_REDIRECT /admin/login, the fake is empty, and Redis is not constructed.
    - createLead with errors (name '', email 'x'): resolves { errors: { name: 'Informe o nome do negócio.', email: 'Informe um e-mail válido.' }, message: null, values: the submitted strings, attempt: previous.attempt + 1 }, and the fake is empty.
    - createLead valid: with a full form (the Task 1 normalization inputs, stage '') it rejects with NEXT_REDIRECT /admin/leads. The index has exactly one member, an id that passes isLeadId. The record at leads:lead:<id> deep-equals { id, the normalized input, stage: 'prospectado', history: [{ stage: 'prospectado', at: '2026-10-07T12:00:00.000Z' }], createdAt and updatedAt both '2026-10-07T12:00:00.000Z' }, and the index score is Date.parse of that.
    - createLead with stage 'contatado': stores stage 'contatado' and history [{ stage: 'contatado', at }]. Stage 'ganho' returns errors.stage 'Escolha uma etapa da lista.' and writes nothing.
    - createLead without credentials, or with `fake.execError` set: resolves { errors: {}, message: 'Não foi possível salvar: o Redis está indisponível.', values, attempt + 1 }, and nothing is stored.
    - updateLead without a session: the seeded record is unchanged. With an invalid id ('../x') or an unknown valid id, it resolves with message 'Este lead não existe mais.', and no new key appears in the fake (no ghost record outside the index). With validation errors, the record is unchanged.
    - updateLead valid: rejects with NEXT_REDIRECT /admin/leads. The record has the new fields and updatedAt '2026-10-07T12:00:00.000Z'. id, stage, history and createdAt are unchanged, and the history length is the same.
    - moveLead without a session: unchanged. With a session, moving a seeded prospectado lead to 'em-conversa' sets stage 'em-conversa', history becomes the old entries plus { stage: 'em-conversa', at: now }, updatedAt is now, and refresh was called once. Moving to its current stage, to 'ganho', or with id '../x' changes nothing (record deep-equal, updatedAt unchanged), and refresh is not called.
    - deleteLead without a session: the record and index member remain. With a session, it rejects with NEXT_REDIRECT /admin/leads, and both the record and the index member are gone while another seeded lead remains. With id '../x' it resolves undefined, Redis is not constructed, and nothing is removed.
  </behavior>
  <action>
Install the package: `pnpm add @upstash/redis@^1.39.0`. It is official Upstash (see interfaces), so no legitimacy checkpoint is needed. Confirm `git diff package.json` adds only that dependency.

`src/test/mocks/upstash-redis.ts` (new, test-only, no vitest import): export class `FakeRedis` with in-memory string and sorted-set maps. It stores values as `JSON.stringify` and returns `JSON.parse` copies to mirror auto-serialization. It implements get, set, del, mget (rejects with an Error 'ERR wrong number of arguments for mget' when called with zero keys), zadd({ score, member }), zrem, zrange(key, 0, -1) ascending by score, and multi(). multi() returns a transaction object whose set, zadd, zrem and del queue the op and return the transaction, and whose exec() runs them in order. exec() rejects with `execError` and clears it when that public field is set. Also implement `reset()` and read helpers `record(key)` (parsed value or undefined), `members(key)` ([member, score] pairs) and `keys()`. Tests make single reads fail with `vi.spyOn(fake, 'zrange').mockRejectedValueOnce(...)`.

`src/lib/admin/lead-store.ts` (new): a private KEY_PREFIX constant 'leads', from which LEADS_INDEX_KEY ('leads:index') and leadKey(id) ('leads:lead:<id>') are derived. Keep that single constant, because the Task 3 visual check swaps it temporarily. getLeadsRedis(env = process.env) returns `new Redis({ url, token })` from KV_REST_API_URL and KV_REST_API_TOKEN, or null when either is missing. It is called per use, not memoized, so env stubs work. listLeads uses zrange, returns early when the list is empty, then calls mget over leadKey(id) and filters out nulls. A missing client or any thrown error gives `{ available: false, leads: [] }`, mirroring buildPreviewIndex's catch. Add a one-line why-comment there: missing credentials (CI, local) must read as unavailable, not a 500. findLead works the same way with get. insertLead runs one multi() with set(record) then zadd(index, { score: Date.parse(createdAt), member: id }). saveLead does a single set. removeLead runs one multi() with zrem then del. The three writes throw `new Error('Redis indisponível')` without a client and let Redis errors propagate.

`src/lib/admin/lead-actions.ts` (new, `'use server'`): export only LeadFormState and the four async functions. Every function's first statement is `await requireAdmin()`. Then:
- createLead: readLeadForm, then parseLeadInput and parseInitialStage(values.stage), merging the errors. If there is any error, return { errors, message: null, values, attempt: previous.attempt + 1 }. Otherwise build the Lead with `randomUUID()` from node:crypto and one ISO `now` for history[0].at, createdAt and updatedAt. Call insertLead inside a try whose catch returns the unavailable message state. After the try, call `redirect('/admin/leads')`.
- updateLead(id, previous, formData): if `!isLeadId(id)`, return the missing-lead message state. Parse, and return field errors. findLead: if not available, return the unavailable message; if the lead is null, return the missing message. Then call saveLead with { ...lead, ...input, updatedAt: now } in a try with the unavailable-message catch, and `redirect('/admin/leads')` after it.
- moveLead(id, formData): return unless isLeadId(id) and isLeadStage(formData.get('stage')). findLead, and return when the lead is null or already in that stage. Otherwise saveLead with the new stage, the history plus { stage, at: now }, and updatedAt now, then call `refresh()`.
- deleteLead(id): return unless isLeadId(id). Call removeLead(id), then `redirect('/admin/leads')`.
Message strings are module constants: 'Não foi possível salvar: o Redis está indisponível.' and 'Este lead não existe mais.'

`vitest.config.mts`: append 'src/lib/admin/lead-store.ts' and 'src/lib/admin/lead-actions.ts' to LIB_DATA_FILES (100% gate).

Commit the 8 files: `feat(admin): store leads in Upstash Redis behind admin-only actions`.

After the commit, prove the tests can fail. Apply one mutation at a time, run `pnpm exec vitest --run src/lib/admin`, and restore with `git checkout -- <file>`. Record the table in the SUMMARY:
- getLeadsRedis reads UPSTASH_REDIS_REST_URL/TOKEN
- Redis.fromEnv() used
- the empty-index early return removed
- dangling ids not filtered
- the listLeads try/catch removed
- the insertLead zadd dropped
- the zadd score set to Date.now()
- removeLead without zrem
- saveLead also calling zadd with score 0
- createLead without requireAdmin
- createLead writing despite errors
- createLead with history []
- parseInitialStage result ignored (always prospectado)
- attempt not incremented
- the insertLead catch removed
- updateLead without requireAdmin
- updateLead spreading the input over stage/history (adding history: [])
- updateLead without the null-lead check (it upserts)
- moveLead without requireAdmin
- moveLead appending history when the stage is unchanged
- moveLead without the history append
- moveLead without refresh()
- moveLead accepting any stage string
- deleteLead without requireAdmin
- deleteLead without isLeadId
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && pnpm exec vitest --run src/lib/admin src/lib/client-preview-source.test.ts && pnpm test:unit:coverage && pnpm exec biome check . && pnpm exec next typegen && pnpm exec tsc --noEmit && grep -q '"@upstash/redis"' package.json && grep -v '^[[:space:]]*//' src/lib/admin/lead-store.ts | grep -q 'KV_REST_API_TOKEN' && ! grep -v '^[[:space:]]*//' src/lib/admin/lead-store.ts | grep -q 'fromEnv' && test "$(grep -c 'await requireAdmin()' src/lib/admin/lead-actions.ts)" -eq 4 && echo task2-ok</automated>
  </verify>
  <done>@upstash/redis ^1.39.0 is in package.json and the lockfile. Leads persist as `leads:lead:<id>` JSON records indexed by `leads:index`, the client is built from the KV_* env, and a missing client reads as unavailable. All four actions start with requireAdmin, validate ids and stages, record the stage history server-side, and redirect or refresh as specified. lead-store.ts and lead-actions.ts are at 100% coverage. Every listed mutation makes at least one test fail. The commit holds exactly the 8 files.</done>
</task>

<task type="auto">
  <name>Task 3: Board, lead form and lead page at /admin/leads, header link, e2e, README EN/PT, 375 px check against real Redis</name>
  <files>src/components/ui/native-select.tsx, src/components/admin/lead-card.tsx, src/components/admin/lead-form.tsx, src/app/admin/leads/page.tsx, src/app/admin/leads/new/page.tsx, src/app/admin/leads/[id]/page.tsx, src/app/admin/page.tsx, tests/e2e.spec.ts, README.md</files>
  <action>
All copy is pt-BR in the existing admin's tone. Reuse Card, Badge, Button, Input, Textarea and Alert. Match the existing pages' structure: `Field`-style dl rows, `flex flex-wrap gap-2` action rows, and `break-words` on user text.

`src/components/ui/native-select.tsx`: a `<select data-slot="native-select">` that takes Input's token classes (border-input, rounded-lg, h-8, text-base md:text-sm, focus-visible ring, aria-invalid, dark:bg-input/30) and merges `className` with `cn`. No directive.

`src/components/admin/lead-card.tsx` (server component):
- StageForm({ lead }): `<form action={moveLead.bind(null, lead.id)} className="flex items-end gap-2">`. It holds a visible small label "Etapa" tied to `<NativeSelect id={`stage-${lead.id}`} name="stage" defaultValue={lead.stage}>`, with an option for each of the 7 STAGE_OPTIONS, and `<Button type="submit" size="sm" variant="outline">Mover</Button>`.
- LeadCard({ lead, today, preview }):
  - Set overdue = isOverdue(lead.dueDate, today). Render a `<Card size="sm">` with `data-overdue` when overdue and `ring-2 ring-destructive` added through className.
  - Header: an h3 with the name, linked to `/admin/leads/${lead.id}`, and a secondary Badge with SOURCE_LABELS[lead.source].
  - Body: when nextStep or dueDate is set, a line "Próximo passo: …", then "Até DD/MM/AAAA" via formatDueDate, plus a destructive Badge "Atrasado" when overdue (text as well as color).
  - A flex-wrap row of text links, rendered only for fields that are set: WhatsApp (whatsappHref, new tab), E-mail (mailtoHref), Telefone (telHref), Instagram (instagramHref, new tab), Site (website, new tab), Origem (sourceUrl, new tab).
  - When preview is set: an "Abrir prévia" link to preview.url (new tab) and a Badge with PREVIEW_STATUS_LABELS[preview.status]. Variants: secondary for active, outline for disabled, destructive for missing, outline for unknown.
  - Then StageForm.

`src/components/admin/lead-form.tsx` (`'use client'`, imports only types from leads.ts):
- Use `useActionState(action, { errors: {}, message: null, values: null, attempt: 0 })`, with values = state.values ?? defaults.
- Render `<form key={state.attempt} action={formAction} noValidate className="flex flex-col gap-6">`. The key makes the remount re-apply every defaultValue, selects included.
- Fieldsets with legends:
  - Negócio: name "Nome do negócio (obrigatório)", website "Site".
  - Origem: source NativeSelect from sourceOptions, sourceUrl "Link de onde encontrei".
  - Contato: whatsapp type tel, email type email, phone type tel, instagram "Instagram (@ ou link)".
  - Prévia: previewSlug NativeSelect from previewOptions.
  - Próximo passo: nextStep text, dueDate type date.
  - Notas: notes Textarea.
  - Etapa: only when stageOptions is given, a stage NativeSelect.
- Every control has id `lead-<field>`, name `<field>` and defaultValue values[field]. When errors[field] is set, it gets `aria-invalid` and `aria-describedby` pointing at a `<p id="lead-<field>-error" className="text-sm text-destructive">`.
- When there is any field error, show `<p role="alert">Revise os campos marcados.</p>`. state.message renders as its own `<p role="alert">`.
- The submit Button carries submitLabel and is disabled while pending. Use the grid `sm:grid-cols-2` inside fieldsets so it stays one column at 375 px.

`src/app/admin/leads/page.tsx`:
- `await requireAdmin()` first, then `Promise.all([listLeads(), getPreviewIndex()])`.
- Main uses `mx-auto flex max-w-7xl min-w-0 flex-col gap-6 px-4 py-6`.
- Header: h1 "Leads", a muted count ("1 lead" / "N leads"), and an action row: "Novo lead" (Button asChild link to /admin/leads/new), "Prévias de clientes" (outline link to /admin), and the logout form "Sair".
- When not available, render only an Alert with title "Redis indisponível" and the description "Não há credenciais do Redis (KV_REST_API_URL e KV_REST_API_TOKEN) ou a leitura falhou. Os leads aparecem aqui quando o Redis responder.", and hide "Novo lead".
- Otherwise, set today = todayInSaoPaulo() and grouped = groupLeadsByStage(leads), and build each card's preview as { url: previewUrl(slug), status: previewStatus(index, slug) } when previewSlug is set.
- Render `<div role="region" aria-label="Quadro de leads" tabIndex={0} className="flex min-w-0 gap-4 overflow-x-auto pb-2">`. If Biome flags noNoninteractiveTabindex, add a biome-ignore with the reason: the scrollable board must be reachable by keyboard.
- Inside it, one `<section aria-labelledby>` per BOARD_STAGES entry, with `w-72 max-w-[85vw] shrink-0`, an h2 with STAGE_LABELS and a count Badge, and a `<ul>` of LeadCard or "Nenhum lead".
- After the region, `<details>` (closed) with `<summary>` "Perdido (N)" and a `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` list of the perdido cards.

`src/app/admin/leads/new/page.tsx`: `await requireAdmin()`, then getPreviewIndex. Show a back link "Voltar ao quadro" to /admin/leads, an h1 "Novo lead", and `<LeadForm action={createLead} defaults={leadFormValues()} sourceOptions={SOURCE_OPTIONS} previewOptions={leadPreviewOptions(index, null)} stageOptions={STAGE_OPTIONS} submitLabel="Criar lead" />`.

`src/app/admin/leads/[id]/page.tsx` (params is a Promise, like [slug]/page.tsx):
- `await requireAdmin()`, then notFound() unless isLeadId(id). Run `Promise.all([findLead(id), getPreviewIndex()])`. If not available, show the same "Redis indisponível" Alert. If the lead is null, notFound().
- Render:
  - the back link "Voltar ao quadro"
  - h1 name with a stage Badge, and "Atrasado" when overdue
  - a dl with "Criado em" and "Atualizado em" (formatDateTime)
  - StageForm
  - the contact and preview block, using the same hrefs and labels as the card
  - section "Histórico": an ordered list in chronological order, each entry "STAGE_LABELS · formatDateTime(at)"
  - section "Editar": `<LeadForm action={updateLead.bind(null, lead.id)} defaults={leadFormValues(lead)} sourceOptions={SOURCE_OPTIONS} previewOptions={leadPreviewOptions(index, lead.previewSlug)} submitLabel="Salvar alterações" />`, with no stage field
  - section "Excluir": `<details>` with `<summary>` "Excluir lead", the text "Isso apaga o lead e todo o histórico. Não dá para desfazer." and `<form action={deleteLead.bind(null, lead.id)}>` with `<Button type="submit" variant="destructive" size="sm">Confirmar exclusão</Button>`. No window.confirm or alert anywhere.

`src/app/admin/page.tsx`: in the header action row, before "Atualizar índice", add `<Button asChild variant="outline" size="sm"><a href="/admin/leads">Leads</a></Button>`. Nothing else changes.

`tests/e2e.spec.ts`: inside the existing "Hidden admin for client previews" describe, add the test 'leads board needs a session, opens from the dashboard and fits 375 px without Redis'. Steps:
1. `request.get('/admin/leads', { maxRedirects: 0 })` is 307 with a location matching /admin/login.
2. setViewportSize 375x812, log in with the existing ADMIN_USER / ADMIN_PASSWORD constants, and expect the h1 'Prévias de clientes'.
3. Click `getByRole('link', { name: 'Leads', exact: true })`, then expect the URL /admin/leads$ and the h1 'Leads'.
4. `page.getByRole('main').getByRole('alert')` contains 'Redis indisponível'.
5. `document.documentElement.scrollWidth - document.documentElement.clientWidth` is 0.

`README.md`, in both languages, in the "### Admin" sections only (EN around line 156, PT around line 352), in the same voice ("você" in PT):
- In the URLs list, add `/admin/leads` (the leads board, linked from the admin header).
- Add a "Leads:" ("Leads:" in PT) block before the warnings paragraph with four bullets:
  - Storage: one JSON record per lead in Upstash Redis (Vercel Marketplace) at `leads:lead:<id>`, listed by the sorted set `leads:index`. It reads `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which the integration adds to every environment, and locally `.env.local`. Without them the board shows "Redis indisponível".
  - Stages in order, with Perdido collapsed at the end. The stage menu and "Mover" on a card change the stage, and every change is recorded with its time in the lead's history.
  - A lead can link a Blob preview, and the card shows whether it is active or disabled. A next step whose date has passed (São Paulo time) marks the card "Atrasado".
  - "Excluir lead", then "Confirmar exclusão", deletes the record and its history for good.
- In the warnings sentence, add the slug that matches an admin page (`leads`, `login`), whose admin link opens that page instead.

Commit the 9 files: `feat(admin): add the leads board at /admin/leads`.

Visual and real-Redis check after the commit. The temporary prefix is never committed, and the pre-commit unit tests would reject it anyway.
1. Write a counting script in the scratchpad. Run it with `node --env-file=.env.local --input-type=module` from the repo root, so `@upstash/redis` resolves. It builds `new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN })`, SCANs `leads:*` and `leads-check:*`, and prints only the two counts. When passed a `--clean` flag, it first deletes every `leads-check:*` key. Run it and record the baseline counts.
2. Temporarily change KEY_PREFIX in `src/lib/admin/lead-store.ts` from 'leads' to 'leads-check'. Run `pnpm next build` (normal env, so Redis is available; log in the scratchpad). Clear 3100 per the repo rules, then start `ADMIN_USER=e2e-admin ADMIN_PASSWORD=e2e-password-not-a-secret pnpm next start -p 3100` in the background.
3. Write a Playwright script in the scratchpad (chromium from @playwright/test, piped into `node --input-type=module` from the repo root) at a 375x812 viewport. It logs in, prints each check below, and never clicks any Blob action:
   a. /admin, click "Leads": no "Redis indisponível" alert, the six column headings plus the "Perdido (0)" summary, scroll delta 0.
   b. /admin/leads/new: submit with name empty, e-mail 'x', WhatsApp '(11) 91234-5678' and source Instagram. Expect both pt-BR errors visible, the name input aria-invalid, the WhatsApp input still holding '(11) 91234-5678', and the source select still 'instagram'. Scroll delta 0. Save `leads-form-errors-375.png`.
   c. Create lead A: 'Padaria Teste', site 'padariateste.com.br', source Instagram, WhatsApp '(11) 91234-5678', e-mail 'contato@padariateste.com.br', phone '(11) 3333-4444', Instagram '@padariateste', next step 'Mandar a prévia', due date yesterday in São Paulo, stage Prospectado. Expect a redirect to /admin/leads. The card sits in the Prospectado column with data-overdue and "Atrasado", and its links' hrefs are exactly https://wa.me/5511912345678, mailto:contato@padariateste.com.br, tel:1133334444, https://www.instagram.com/padariateste/ and https://padariateste.com.br.
   d. Create lead B: 'Oficina Teste', stage Contatado, due date today in São Paulo. If the preview select has a non-empty option, choose the first one. Expect B in Contatado without "Atrasado". If a preview was linked, its link ends with `/preview/<slug>` and its badge text is one of the four status labels. Otherwise print that no Blob preview was available.
   e. Move A to "Em conversa" (select plus Mover): A now sits in the Em conversa column. Move B to "Perdido": B is not visible, the details element is closed, the summary reads "Perdido (1)", and after clicking the summary B is visible. Save `leads-board-375.png` with the details open, and print the board scroll delta (0).
   f. Open A's page: the history lists exactly Prospectado then Em conversa, each with a timestamp. Edit the next step to 'Ligar na sexta' and save. The board shows 'Ligar na sexta' on A, and A's page still lists exactly 2 history entries. Save `lead-detail-375.png` and print the scroll delta (0).
   g. On each lead's page, open "Excluir lead" and click "Confirmar exclusão". The board ends with zero cards.
4. View the three screenshots with Read. Stop the server (only the 3100 PID whose cwd is this repo). Run the counting script with `--clean`, then without it. `leads-check:*` must be 0 and `leads:*` must equal the baseline. Run `git checkout -- src/lib/admin/lead-store.ts` and confirm `git status --short` is clean. Any UI fix found here becomes a follow-up commit of the touched files only. If Upstash is unreachable, stop the check and report it. Do not fabricate results.
  </action>
  <verify>
    <automated>cd /Users/luiz/Documents/Projetos/Pessoal/pansarinitech && git diff --quiet -- src/lib/admin/lead-store.ts && pnpm exec biome check . && pnpm verify:ci-safety && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm test:unit && grep -q 'href="/admin/leads"' src/app/admin/page.tsx && grep -q 'moveLead.bind' src/components/admin/lead-card.tsx && grep -q 'deleteLead.bind' 'src/app/admin/leads/[id]/page.tsx' && grep -q 'useActionState' src/components/admin/lead-form.tsx && ! grep -rqE 'window\.confirm|[^.]\bconfirm\(' src/app/admin src/components/admin && grep -q 'Redis indisponível' src/app/admin/leads/page.tsx && test "$(grep -c 'leads:index' README.md)" -ge 2 && grep -q "Redis indisponível" tests/e2e.spec.ts && echo task3-ok</automated>
  </verify>
  <done>/admin/leads renders the six columns, scrolling inside the board, and the collapsed Perdido section. Cards move with the stage select and Mover. Leads can be created, edited (history unchanged) and deleted through the details confirmation. Field errors show in pt-BR and the typed values survive them. Overdue cards say "Atrasado". The /admin header links to the board. The real-Redis check printed every expected result at 375 px with scroll delta 0, `leads-check:*` was cleaned to 0, `leads:*` was untouched, and the prefix change was reverted. README EN and PT describe the board and the new warning. The commit holds exactly the 9 files.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser to lead Server Actions | Action IDs can be POSTed directly with any id argument and any form fields |
| Server to Upstash Redis REST API | Writes with the project's KV_REST_API_TOKEN |
| Stored lead fields to rendered hrefs | User-typed URLs, handles and numbers become `href`s on admin pages |
| Verification scripts to the provisioned database | The visual check writes real keys |
| pnpm registry to node_modules | New dependency @upstash/redis |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-dep-01 | Elevation of privilege | createLead, updateLead, moveLead, deleteLead and the three /admin/leads pages | mitigate | `await requireAdmin()` is the first statement everywhere. Unit tests prove nothing is written or removed without a session (Task 2 mutations), and e2e proves /admin/leads redirects to the login |
| T-dep-02 | Tampering | id argument building a Redis key | mitigate | `isLeadId` (lowercase UUID v4) before any key is built. Tests with '../x' prove nothing is read, written or removed. updateLead never upserts a missing id |
| T-dep-03 | Tampering / XSS | website, source link, WhatsApp, phone, Instagram rendered as hrefs | mitigate | Only http/https URLs with a dotted host are accepted (`javascript:` and `ftp:` rejected in tests). wa.me and tel: are built from digits only, Instagram from the `[A-Za-z0-9._]{1,30}` handle, and React escapes all text |
| T-dep-04 | Information disclosure | KV_REST_API_TOKEN | mitigate | Read only in `lead-store.ts` on the server, never `NEXT_PUBLIC_`. lead-form.tsx imports only types from lib modules. Scripts load `.env.local` via `--env-file` and print counts only |
| T-dep-05 | Tampering (CSRF) | new Server Actions | mitigate | Inherited: SameSite=Strict session cookie on Path=/admin plus Next's Origin/Host check on Server Actions |
| T-dep-06 | Denial of service | oversized form payloads | mitigate | Per-field max lengths in the zod schema (notes 5000), Next's default 1 MB action body limit, admin-only |
| T-dep-07 | Tampering | visual check writing to the provisioned database | mitigate | Writes only under the temporary `leads-check:` prefix, deletes every such key afterwards, proves the `leads:*` count is unchanged, and the prefix edit is never committed |
| T-dep-08 | Repudiation | stage history | accept | Single-admin tool, and the server writes history timestamps. Hand edits to Redis are out of scope |
| T-dep-SC | Tampering | `pnpm add @upstash/redis` | mitigate | Verified official package (github.com/upstash/redis-js, @upstash.com maintainers, 1.39.0 published 2026-09-21, one dependency `uncrypto`), locked by the user. pnpm-lock.yaml pins the integrity, and the plan checks that package.json gains only this dependency |
</threat_model>

<verification>
From the repo root, after the three commits, on a clean tree with no mutation or temporary prefix left:
1. `pnpm lint`
2. `pnpm exec next typegen && pnpm exec tsc --noEmit`
3. `pnpm test:unit` and `pnpm test:unit:coverage`. The 100% gate covers client-preview-source.ts, admin/actions.ts, admin/view.ts, admin/leads.ts, admin/lead-store.ts and admin/lead-actions.ts.
4. `pnpm verify:ci-safety`
5. `rm -rf .next`. The visual check's build cached a Blob index read with real credentials, and `next start` would keep serving it. Then run `pnpm build` with the CI-like prefix, which includes prebuild. Run `git status --short` and restore every tracked file the prebuild rewrote with `git checkout -- <path>`. Then run `LOG=<scratchpad>/build.log` and the CI-like prefix with `pnpm next build > "$LOG" 2>&1 && pnpm verify:static "$LOG"`. The log must show `ƒ /admin`, `ƒ /admin/[slug]`, `ƒ /admin/leads`, `ƒ /admin/leads/[id]`, `ƒ /admin/leads/new`, `ƒ /admin/login` and `● /preview/[slug]`.
6. Clear 3100 per the repo rules, then run the CI-like prefix with `PLAYWRIGHT_PORT=3100 pnpm test:e2e` (the full suite, including the 4 admin tests). `Theme toggle persistence across reload` is a known pre-existing flake (261005-qnn SUMMARY). If it alone fails, rerun it once with `-g "Theme toggle"` and record both runs. Any other failure blocks completion.
7. `git status --short` is empty, and `git log --oneline origin/main..HEAD` shows the existing skills commit plus the three new commits on `feat/leads-board`. Nothing is pushed.
</verification>

<success_criteria>
- Luiz can open /admin, click "Leads", and at 375 px see six stage columns scrolling inside the board plus a collapsed Perdido section, with no page-level horizontal scroll.
- He can create a lead with every decided field, see pt-BR errors without losing what he typed, move it with the stage select and "Mover", edit it, and delete it through the details confirmation. Every creation and stage change is in its history with São Paulo timestamps.
- Cards link WhatsApp (wa.me), e-mail, phone, Instagram, site and source, show the linked Blob preview's link and whether it is active or disabled, and say "Atrasado" with a highlight when the due date has passed in São Paulo.
- Data lives in Upstash Redis as `leads:lead:<id>` records plus the `leads:index` sorted set, read through KV_REST_API_URL / KV_REST_API_TOKEN. With no credentials the board shows "Redis indisponível" instead of failing.
- Every lead page and action is admin-only. Blob previews slugged `leads` or `login` carry the reserved-slug warning.
- lint, tsc, unit tests with the 100% gates, ci-safety, the CI-like build plus verify:static, and the full e2e suite are green. Every listed mutation fails a test. Three commits with explicit paths, nothing pushed, `.env.local` untouched.
</success_criteria>

<output>
Create `.planning/quick/261007-dep-leads-board-in-the-hidden-admin-backed-b/261007-dep-SUMMARY.md` when done. Include:
- the mutation tables for Tasks 1 and 2 (mutation, then failing test names)
- the real-Redis visual check output: the baseline and final `leads:*` / `leads-check:*` counts, every printed check, the scroll-width deltas, the screenshot paths, whether a Blob preview was available to link, and confirmation that the prefix edit was reverted
- the final verification outputs and the build-log route lines
- two flagged choices for Luiz to confirm: (1) stage moves use select plus "Mover" rather than submit-on-change (WCAG 3.2.2), and (2) the visual check wrote to the provisioned Upstash database under the throwaway `leads-check:` prefix, which was deleted afterwards
- a post-deploy check: open https://pansarini.dev/admin/leads, create a lead, move it, then delete it, and confirm the board never shows "Redis indisponível" in production
</output>
