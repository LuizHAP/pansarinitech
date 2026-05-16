---
phase: 01-cmd-k-command-palette
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ui/command.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/index.ts
  - src/components/sections/hero.tsx
  - messages/en.json
  - messages/pt.json
  - vitest.config.mts
  - package.json
  - pnpm-lock.yaml
autonomous: true
requirements:
  - UX-01
  - UX-02
  - UX-06
  - UX-07
tags:
  - foundation
  - shadcn
  - i18n
  - vitest
must_haves:
  truths:
    - "Shadcn Command and Dialog primitives exist in src/components/ui/ and re-export from the curated barrel"
    - "The Hero <section> carries id=\"hero\" so document.getElementById('hero') resolves (UX-02 prerequisite)"
    - "messages/en.json and messages/pt.json contain a fully-populated commandPalette namespace with all 22 keys"
    - "vitest config includes the new files in COMPONENT_FILES and inlines cmdk so jsdom tests can import it"
  artifacts:
    - path: "src/components/ui/command.tsx"
      provides: "Shadcn Command primitives (Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut)"
      contains: "export"
    - path: "src/components/ui/dialog.tsx"
      provides: "Shadcn Dialog primitives backing CommandDialog"
      contains: "export"
    - path: "src/components/ui/index.ts"
      provides: "Curated named re-exports of Command and Dialog primitives"
      contains: "from './command'"
    - path: "src/components/sections/hero.tsx"
      provides: "Hero <section> with id=\"hero\""
      contains: "id=\"hero\""
    - path: "messages/en.json"
      provides: "commandPalette namespace (EN copy)"
      contains: "\"commandPalette\""
    - path: "messages/pt.json"
      provides: "commandPalette namespace (PT copy)"
      contains: "\"commandPalette\""
    - path: "vitest.config.mts"
      provides: "cmdk inline + new files in COMPONENT_FILES"
      contains: "'cmdk'"
  key_links:
    - from: "src/components/ui/index.ts"
      to: "src/components/ui/command.tsx"
      via: "barrel re-export"
      pattern: "from './command'"
    - from: "src/components/ui/index.ts"
      to: "src/components/ui/dialog.tsx"
      via: "barrel re-export"
      pattern: "from './dialog'"
    - from: "src/components/ui/command.tsx"
      to: "radix-ui"
      via: "Dialog import from radix-ui monorepo bundle (NOT @radix-ui/react-dialog)"
      pattern: "from 'radix-ui'"
---

<objective>
Land all non-component prerequisites for the Cmd+K palette in a single coordinated change so Plan 2 can focus purely on writing the palette component. This plan installs the Shadcn `command` and `dialog` primitives, normalizes them to the project's `radix-ui` monorepo import convention, exposes them via the curated `src/components/ui/index.ts` barrel, fixes the missing `id="hero"` scroll target, adds the `commandPalette` i18n namespace in both locales, and prepares the vitest config so Plan 2's tests run.

Purpose: Plan 2's palette component depends on (a) the Shadcn primitives existing under `@/components/ui`, (b) the `commandPalette` translation keys existing in `next-intl`'s message bundles, (c) `id="hero"` existing so scroll navigation works, and (d) the vitest config recognizing `cmdk` as an ESM dependency. Splitting these into Plan 1 keeps Plan 2 focused on the single concern of palette UX and limits context per executor.

Output: Generated Shadcn `command.tsx` + `dialog.tsx`, updated `ui/index.ts` barrel, modified `hero.tsx` with `id="hero"`, populated `commandPalette` namespace in `messages/en.json` and `messages/pt.json`, and updated `vitest.config.mts`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

@.planning/phases/01-cmd-k-command-palette/01-CONTEXT.md
@.planning/phases/01-cmd-k-command-palette/01-RESEARCH.md
@.planning/phases/01-cmd-k-command-palette/01-PATTERNS.md
@.planning/phases/01-cmd-k-command-palette/01-UI-SPEC.md

@src/components/ui/sheet.tsx
@src/components/ui/index.ts
@src/components/sections/hero.tsx
@vitest.config.mts

<interfaces>
<!-- Conventions and signatures the executor MUST respect. Extracted from codebase. -->

From `src/components/ui/sheet.tsx` (canonical Shadcn primitive pattern in this repo):
- First line: `'use client';`
- Import Radix Dialog via the monorepo bundle: `import { Dialog as SheetPrimitive } from 'radix-ui';` — NOT `import * as SheetPrimitive from '@radix-ui/react-dialog'`.
- `cn` utility: `import { cn } from '@/lib/utils';`
- Every sub-component carries a `data-slot="..."` attribute (e.g. `data-slot="sheet"`, `data-slot="sheet-content"`).
- Files end with a curated named export block: `export { Sheet, SheetTrigger, ... };` — never `export default`.
- Animation classes use Tailwind v4 data-attribute tokens: `data-[state=open]:animate-in`, `data-[state=closed]:animate-out`, `data-[state=open]:fade-in-0`, `data-[state=open]:zoom-in-95`, etc.
- `showCloseButton` is a boolean prop on the Content component (default `true`). When true, an `<XIcon>` close button renders absolutely positioned top-right inside the dialog.

From `src/components/ui/index.ts` (curated barrel pattern):
- Format: one `export { ComponentName } from './component-file';` per line.
- Ordered alphabetically by file name (alert → badge → button → card → dropdown-menu → reveal-group → separator → sheet → skeleton → sonner → toggle → tooltip).
- Never `export *`. Curated named exports only.

From `messages/en.json` and `messages/pt.json`:
- Top-level object with namespaces as keys.
- Namespaces are sorted alphabetically.
- All keys used by a `useTranslations('namespace')` call must exist in both files (next-intl raises in dev if a key is missing).

From `vitest.config.mts`:
- `COMPONENT_FILES` array (line 16-33) lists every component file gated by `COMPONENT_TARGET` thresholds (70% statements/functions, 60% branches). Adding a file here both includes it in coverage and enforces the gate.
- `test.server.deps.inline` array (line 67) holds ESM packages that must be inlined for jsdom. Currently `['next-intl', 'github-slugger']`.

Resume / link URLs (read directly from `src/data/contact.ts` — used by Plan 2, listed here so executors of Plan 1 do not need to guess copy):
- Resume EN: `/Luiz-Pansarini_Resume.pdf`
- Resume PT: `/Luiz-Pansarini_Curriculo.pdf`
- LinkedIn: `https://linkedin.com/in/luizpansarini`
- GitHub: `https://github.com/LuizHAP`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Shadcn command + dialog, normalize Radix import, update ui barrel</name>
  <files>src/components/ui/command.tsx, src/components/ui/dialog.tsx, src/components/ui/index.ts, package.json, pnpm-lock.yaml</files>
  <read_first>
    - src/components/ui/sheet.tsx (canonical Shadcn primitive in this repo; mirrors structure for command/dialog — `'use client'`, `radix-ui` monorepo import, `data-slot` attributes, `cn` from `@/lib/utils`, named export block)
    - src/components/ui/index.ts (curated barrel: alphabetical order, one `export { X } from './x';` per line, no `export *`)
    - components.json (Shadcn config — confirms `style: radix-nova`, `cssVariables: true`, `baseColor: neutral`; CLI uses these)
    - .planning/phases/01-cmd-k-command-palette/01-RESEARCH.md §"State of the Art" + §"Common Pitfalls" P8 (verify generated `dialog.tsx` imports `Dialog` from `'radix-ui'`, not `'@radix-ui/react-dialog'`)
    - .planning/phases/01-cmd-k-command-palette/01-PATTERNS.md §"src/components/ui/command.tsx" + §"src/components/ui/dialog.tsx"
  </read_first>
  <action>
    Run `npx shadcn@latest add command dialog` from the repo root (per D-01). This installs `cmdk` (current 1.1.1) and writes `src/components/ui/command.tsx` and `src/components/ui/dialog.tsx`. After generation:

    1. Open both generated files. If either imports `Dialog` from `'@radix-ui/react-dialog'` (or `import * as DialogPrimitive from '@radix-ui/react-dialog'`), rewrite to `import { Dialog as DialogPrimitive } from 'radix-ui';` (or the analogous named import). This is the convention used by `sheet.tsx` line 3 and required because the project uses the `radix-ui` monorepo bundle. Do NOT install `@radix-ui/react-dialog` as a separate dependency.
    2. Confirm both files start with `'use client';` on line 1.
    3. Confirm `CommandDialog` exposes `showCloseButton` and that its default behavior matches the Shadcn `new-york-v4` template (renders an `XIcon` close button when `showCloseButton={true}`). If the generated template does not render a close button at all, port the same `showCloseButton` pattern used by `sheet.tsx` lines 47-48 + 64-73 onto `CommandDialog` so UX-07 has a working mobile dismiss affordance.
    4. Append two named-export blocks to `src/components/ui/index.ts`, inserted alphabetically (between `card` and `dropdown-menu`): one block re-exporting `Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut` from `'./command'`, and a second block re-exporting `Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger` from `'./dialog'`. Maintain the existing curated-barrel format — one `export { ... } from '...';` per block, no `export *`.
    5. Run `pnpm exec biome check --write src/components/ui/` to normalize import ordering and formatting on the new files and the barrel.
    6. Run `pnpm tsc --noEmit` and resolve any type errors arising from the new files. The expected ambient context (`cn`, `Button`, `XIcon` from `lucide-react`) is already in the repo.

    Do NOT add a separate `@radix-ui/react-dialog` to dependencies — the `radix-ui` monorepo bundle already exposes `Dialog`.
  </action>
  <verify>
    <automated>test -f src/components/ui/command.tsx &amp;&amp; test -f src/components/ui/dialog.tsx &amp;&amp; grep -q "from 'radix-ui'" src/components/ui/dialog.tsx &amp;&amp; grep -q "from 'cmdk'" src/components/ui/command.tsx &amp;&amp; grep -q "from './command'" src/components/ui/index.ts &amp;&amp; grep -q "from './dialog'" src/components/ui/index.ts &amp;&amp; grep -q "\"cmdk\"" package.json &amp;&amp; pnpm tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/ui/command.tsx` exists and its first non-blank line is `'use client';`
    - File `src/components/ui/dialog.tsx` exists and its first non-blank line is `'use client';`
    - `src/components/ui/command.tsx` contains `from 'cmdk'`
    - `src/components/ui/dialog.tsx` contains `from 'radix-ui'` (the monorepo bundle, not `@radix-ui/react-dialog`)
    - `grep -v '^//' src/components/ui/dialog.tsx | grep -c '@radix-ui/react-dialog'` returns 0
    - `src/components/ui/command.tsx` exports each of: `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator` (CommandShortcut may also be present)
    - `src/components/ui/dialog.tsx` exports each of: `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
    - `CommandDialog` accepts a `showCloseButton` boolean prop and renders a close button (lucide `XIcon` or equivalent) when `true`
    - `src/components/ui/index.ts` contains both `export { ... } from './command';` and `export { ... } from './dialog';` blocks in the curated barrel format
    - `package.json` lists `cmdk` under dependencies; `@radix-ui/react-dialog` is NOT added (the existing `radix-ui` bundle dependency covers it)
    - `pnpm tsc --noEmit` exits 0
    - `pnpm exec biome check src/components/ui/command.tsx src/components/ui/dialog.tsx src/components/ui/index.ts` exits 0
  </acceptance_criteria>
  <done>Shadcn command + dialog primitives generated, normalized to the `radix-ui` monorepo import convention, curated-barrel-exported, and the project type-checks clean. `cmdk` is in `package.json` dependencies.</done>
</task>

<task type="auto">
  <name>Task 2: Add id="hero" to Hero section, populate commandPalette i18n namespace in EN + PT, update vitest config</name>
  <files>src/components/sections/hero.tsx, messages/en.json, messages/pt.json, vitest.config.mts</files>
  <read_first>
    - src/components/sections/hero.tsx (current `<section aria-labelledby="hero-heading">` opening tag — must add `id="hero"` without disturbing other attributes)
    - messages/en.json (current namespace shape and alphabetical ordering — `commandPalette` slots between `blog` and `career`)
    - messages/pt.json (mirror of en.json structure for parallel insertion)
    - .planning/phases/01-cmd-k-command-palette/01-UI-SPEC.md §"Copywriting Contract" (canonical EN + PT strings — 22 keys per locale)
    - .planning/phases/01-cmd-k-command-palette/01-RESEARCH.md §"Translation Keys Needed"
    - vitest.config.mts (lines 16-33: `COMPONENT_FILES` array; line 65-69: `test.server.deps.inline` array currently `['next-intl', 'github-slugger']`)
  </read_first>
  <action>
    Three independent edits, all small and isolated:

    1. **`src/components/sections/hero.tsx`** — Locate the `<section aria-labelledby="hero-heading" ...>` opening tag (around line 28-31). Add `id="hero"` to that element. The existing `aria-labelledby="hero-heading"` and `className` attributes stay unchanged. This satisfies RESEARCH.md Pitfall 4 (`document.getElementById('hero')` must resolve for UX-02) and matches the section-id convention used by `about.tsx`, `projects`, `skills`, `contact`, `career`, `now`.

    2. **`messages/en.json` and `messages/pt.json`** — Add a new `commandPalette` namespace to both files. Place it alphabetically between `blog` and `career`. Use the EXACT 22 keys and copy values from UI-SPEC.md §"Copywriting Contract" — do not paraphrase. The 22 keys are: `title`, `description`, `placeholder`, `empty`, `triggerLabel`, `groupNavigate`, `groupActions`, `groupLinks`, `navHero`, `navAbout`, `navProjects`, `navSkills`, `navCareer`, `navContact`, `navBlog`, `actionToggleTheme`, `actionSwitchPt`, `actionSwitchEn`, `linkResumePt`, `linkResumeEn`, `linkLinkedin`, `linkGithub`. Maintain valid JSON (trailing commas not allowed; preserve 2-space indent matching existing file style).

    3. **`vitest.config.mts`** — Two edits:
       a. Add `'src/components/shared/command-palette.tsx'` to the `COMPONENT_FILES` array (line 16-33). `src/components/shared/header.tsx` is already in the array — do not duplicate.
       b. Add `'cmdk'` to `test.server.deps.inline` (line 67): the array becomes `['next-intl', 'github-slugger', 'cmdk']`. Reason: cmdk is ESM-only and breaks jsdom imports without inlining (RESEARCH.md Pitfall 7).

    After all edits, run `pnpm exec biome check --write messages/en.json messages/pt.json src/components/sections/hero.tsx vitest.config.mts` to normalize formatting.
  </action>
  <verify>
    <automated>grep -q 'id="hero"' src/components/sections/hero.tsx &amp;&amp; node -e "const m=require('./messages/en.json'); ['title','description','placeholder','empty','triggerLabel','groupNavigate','groupActions','groupLinks','navHero','navAbout','navProjects','navSkills','navCareer','navContact','navBlog','actionToggleTheme','actionSwitchPt','actionSwitchEn','linkResumePt','linkResumeEn','linkLinkedin','linkGithub'].forEach(k=>{if(!m.commandPalette?.[k]) throw new Error('en missing '+k)})" &amp;&amp; node -e "const m=require('./messages/pt.json'); ['title','description','placeholder','empty','triggerLabel','groupNavigate','groupActions','groupLinks','navHero','navAbout','navProjects','navSkills','navCareer','navContact','navBlog','actionToggleTheme','actionSwitchPt','actionSwitchEn','linkResumePt','linkResumeEn','linkLinkedin','linkGithub'].forEach(k=>{if(!m.commandPalette?.[k]) throw new Error('pt missing '+k)})" &amp;&amp; grep -q "'cmdk'" vitest.config.mts &amp;&amp; grep -q "command-palette.tsx" vitest.config.mts</automated>
  </verify>
  <acceptance_criteria>
    - `src/components/sections/hero.tsx` `<section>` opening tag contains `id="hero"` AND retains `aria-labelledby="hero-heading"`
    - `messages/en.json` parses as valid JSON (no trailing comma errors) AND contains all 22 `commandPalette.*` keys listed in the action
    - `messages/en.json` `commandPalette.title` equals `"Command Palette"`; `commandPalette.empty` equals `"No results found."`; `commandPalette.triggerLabel` equals `"Open command palette"`; `commandPalette.actionToggleTheme` equals `"Toggle theme (Jedi / Sith)"`
    - `messages/pt.json` parses as valid JSON AND contains all 22 `commandPalette.*` keys
    - `messages/pt.json` `commandPalette.title` equals `"Painel de Comandos"`; `commandPalette.empty` equals `"Nenhum resultado encontrado."`; `commandPalette.triggerLabel` equals `"Abrir painel de comandos"`; `commandPalette.actionToggleTheme` equals `"Alternar tema (Jedi / Sith)"`
    - `vitest.config.mts` `COMPONENT_FILES` array contains the string `'src/components/shared/command-palette.tsx'`
    - `vitest.config.mts` `test.server.deps.inline` array contains `'cmdk'`
    - `pnpm exec biome check messages/en.json messages/pt.json src/components/sections/hero.tsx vitest.config.mts` exits 0
  </acceptance_criteria>
  <done>Hero section anchor is reachable via `#hero`, both locale message bundles carry the complete `commandPalette` namespace, and the vitest config recognizes `cmdk` as an ESM dep and gates `command-palette.tsx` for coverage. Plan 2 can now write the palette component without infrastructure surprises.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | This plan modifies infrastructure files only (i18n strings, Shadcn primitives, vitest config, single attribute on Hero). No new trust boundary introduced. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-P1-01 | Tampering | `commandPalette` translation strings in `messages/{en,pt}.json` | accept | Strings are author-authored static JSON shipped at build time. No user input is rendered as HTML through these keys (next-intl escapes by default; no `dangerouslySetInnerHTML` usage anywhere in shared components). Risk surface is identical to every other namespace already in the bundle. |
| T-01-P1-02 | Information disclosure | Shadcn-generated `command.tsx` / `dialog.tsx` | accept | Vendor-generated UI code from an official Shadcn registry. No secrets, no network calls, no privileged APIs. Same trust posture as the existing `sheet.tsx` already in the repo. |
</threat_model>

<verification>
After both tasks complete:
- `pnpm tsc --noEmit` exits 0
- `pnpm exec biome check src/ messages/ vitest.config.mts` exits 0
- `pnpm vitest run` exits 0 (existing tests must still pass; no new tests added in this plan, but vitest must still bootstrap with `cmdk` inlined and the updated `COMPONENT_FILES` array)
- Manual sanity grep:
  - `grep -R "commandPalette" messages/` shows the namespace in both en and pt
  - `grep "id=\"hero\"" src/components/sections/hero.tsx` shows exactly one match on the `<section>` element
</verification>

<success_criteria>
- Shadcn `command` and `dialog` primitives generated, normalized to `radix-ui` monorepo imports, curated-barrel-exported, and TypeScript-clean
- `id="hero"` lives on the Hero `<section>` so palette nav-to-hero resolves at runtime
- `commandPalette` namespace populated identically (key-for-key) in `messages/en.json` and `messages/pt.json`
- `vitest.config.mts` recognizes `cmdk` as an ESM dep and tracks `command-palette.tsx` for coverage
- Existing test suite still passes; type-check still passes
</success_criteria>

<output>
After completion, create `.planning/phases/01-cmd-k-command-palette/01-P1-SUMMARY.md` documenting:
- Which Shadcn template version generated `command.tsx` / `dialog.tsx` (note the `radix-nova` preset)
- Whether any post-generation import normalization was required (from `@radix-ui/react-dialog` → `radix-ui`)
- The exact `cmdk` version installed (peer of `package.json`)
- Any deviation from the UI-SPEC.md copywriting contract (there should be none)
</output>
</content>
</invoke>