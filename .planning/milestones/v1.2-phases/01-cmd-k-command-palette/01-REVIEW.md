---
phase: 01-cmd-k-command-palette
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/components/shared/command-palette.tsx
  - src/components/shared/command-palette.test.tsx
  - src/components/shared/header.tsx
  - src/components/shared/header.test.tsx
  - src/components/shared/index.ts
  - src/components/ui/command.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/index.ts
  - src/components/sections/hero.tsx
  - messages/en.json
  - messages/pt.json
  - vitest.config.mts
  - vitest.setup.ts
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-13
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 01 delivers a functional Cmd+K command palette: 14 commands across three groups, global keyboard listener, header trigger, and full keyboard accessibility via Radix Dialog + cmdk. The overall architecture is sound — Option B (CommandPaletteRoot in header) avoids module-scoped singletons, the `runCommand` helper enforces close-before-act, and the Radix/next-themes/next-intl integrations follow established project patterns.

Two blockers were found:

1. Every navigate-to scroll command hard-codes `{ behavior: 'smooth' }` without checking `prefers-reduced-motion`. The project's CSS global (`scroll-behavior: auto !important` under `prefers-reduced-motion: reduce`) does **not** override a `scrollIntoView({ behavior: 'smooth' })` JS call — the JS `behavior` option bypasses CSS scroll-behavior in Chromium. The plan's own human-verification checklist (Step 11) expects smooth scroll to be suppressed under reduced motion, but the implementation ignores this.

2. All four `window.open` calls in the links group use `'noopener'` without `'noreferrer'`. Every other external link in the codebase (`contact.tsx`, `footer.tsx`) uses `'noopener noreferrer'` — an explicit T-02-2-06 mitigation documented in those files. The inconsistency leaks the page's referrer URL to LinkedIn, GitHub, and the resume CDN when opened from the palette.

Four warnings cover test quality: the P2-SUMMARY.md claims two tests that do not exist (`e.preventDefault()` called and close button rendered), the `switchLocale` mock accumulates call history across tests (no `mockClear` in `beforeEach`), and there is no test verifying all 14 command labels render correctly in the PT locale.

---

## Critical Issues

### CR-01: Smooth scroll ignores `prefers-reduced-motion`

**File:** `src/components/shared/command-palette.tsx:96–150`
**Issue:** All six navigate-to commands call `scrollIntoView({ behavior: 'smooth' })` unconditionally. The project's `globals.css` applies `scroll-behavior: auto !important` inside `@media (prefers-reduced-motion: reduce)`, but this CSS property does not override a JavaScript `scrollIntoView({ behavior: 'smooth' })` call — the JS `behavior` option takes precedence in Chromium and other engines. Users who have enabled "Reduce motion" in system accessibility settings will still receive animated scrolling from the palette, violating the project's non-negotiable WCAG 2.1 AA / `prefers-reduced-motion` constraint. The plan's own human-verification checklist (Step 11) explicitly states the expected behaviour: "Selecting a Navigate-to command scrolls without smooth-scroll easing (snaps to position)."

Compare with `theme-toggle.tsx` lines 28–37, which reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before choosing the animation path. The same guard is required here.

**Fix:**
```tsx
// Replace the inline scrollIntoView calls with a helper at the top of CommandPalette:

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

// Then in the navigate group:
<CommandItem onSelect={() => runCommand(() => scrollTo('hero'))}>
<CommandItem onSelect={() => runCommand(() => scrollTo('about'))}>
// ...etc
```

---

### CR-02: `window.open` links missing `noreferrer` — inconsistent with codebase security convention

**File:** `src/components/shared/command-palette.tsx:206, 214, 221, 227`
**Issue:** All four link commands (Resume PT, Resume EN, LinkedIn, GitHub) call `window.open(url, '_blank', 'noopener')`. Every other `target="_blank"` link in the project uses `'noopener noreferrer'` — see `contact.tsx` line 8 comment ("All target="_blank" links carry rel="noopener noreferrer" (T-02-2-06 mitigation)") and `footer.tsx` line 8 with the same comment. Without `noreferrer`, the browser sends the `Referer` request header to LinkedIn, GitHub, and the resume host, disclosing the portfolio's URL (and locale path) to those third parties. While not a catastrophic leak, it violates the stated threat mitigation and creates inconsistency that future maintainers may not notice.

**Fix:**
```tsx
// Change all four window.open calls from:
window.open(url, '_blank', 'noopener')

// To:
window.open(url, '_blank', 'noopener,noreferrer')
```

---

## Warnings

### WR-01: P2-SUMMARY claims two tests that do not exist

**File:** `src/components/shared/command-palette.test.tsx` (entire file) / `.planning/phases/01-cmd-k-command-palette/01-P2-SUMMARY.md:219`
**Issue:** The plan summary lists 22 tests covering (among others) "Close button rendered (`showCloseButton={true}`)" and "event.preventDefault() called by keydown listener". Neither test exists in the file. There are indeed 22 tests, but the two claimed above were replaced by "trigger button has correct aria-label in PT locale" and "both locale commands are visible regardless of current locale" — both valid, but the summary's coverage accounting is wrong. The plan's acceptance criteria explicitly required a `preventDefault` spy assertion; its absence means browser default behaviour (cursor navigation to an anchor, or browser find-in-page) is untested.

**Fix:** Add the missing test:
```tsx
it('keydown listener calls event.preventDefault() on Cmd+K', async () => {
  render(<CommandPaletteRoot />, { locale: 'en' });

  let capturedEvent: KeyboardEvent | undefined;
  const handler = (e: KeyboardEvent) => { capturedEvent = e; };
  document.addEventListener('keydown', handler, { capture: true });

  const user = userEvent.setup();
  await user.keyboard('{Meta>}k{/Meta}');

  expect(capturedEvent?.defaultPrevented).toBe(true);
  document.removeEventListener('keydown', handler, { capture: true });
});
```
And for the close button:
```tsx
it('dialog renders a visible close button (showCloseButton={true})', async () => {
  render(<CommandPaletteRoot />, { locale: 'en' });
  const user = userEvent.setup();
  await user.keyboard('{Meta>}k{/Meta}');
  // DialogContent renders XIcon + sr-only "Close" span
  expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
});
```

---

### WR-02: `switchLocale` mock call history is not reset between tests

**File:** `src/components/shared/command-palette.test.tsx:41–48`
**Issue:** `beforeEach` clears `pushMock` via `pushMock.mockClear()` but does not clear the `switchLocale` vi.fn mock. The tests at lines 214–234 use `toHaveBeenCalledWith` which checks the entire call history. If the "Switch to Portuguese" test (line 214) runs before the "Switch to English" test (line 226), the `switchLocale` mock will contain both `'pt'` and `'en'` calls by the time the 'en' assertion runs. This passes today only because both assertions look for their own argument — but if a new test checks `toHaveBeenCalledTimes(1)` it will spuriously fail, and any test relying on `not.toHaveBeenCalledWith` would give a false negative. It also makes the D-07 test (line 238, which invokes locale switches) silently add to the history of subsequent tests.

**Fix:**
```tsx
import { switchLocale } from './locale-toggle-action';

beforeEach(() => {
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
  vi.spyOn(window, 'open').mockImplementation(() => null);
  pushMock.mockClear();
  vi.mocked(switchLocale).mockClear(); // add this line
});
```

---

### WR-03: No test verifying all 14 command labels in the PT locale

**File:** `src/components/shared/command-palette.test.tsx`
**Issue:** Test #9 ("renders three group headings in PT locale") only asserts the three group headings (`'Navegar para'`, `'Ações'`, `'Links'`). There is no test verifying the 14 command item labels render in Portuguese (e.g., `'Início'`, `'Habilidades'`, `'Carreira'`, `'Currículo — PT (PDF)'`, etc.). Given that the PT translations were flagged as MEDIUM confidence in RESEARCH.md (Assumption A1), a missing key or mistaken value in `messages/pt.json` would only surface at runtime. The plan's acceptance criteria required confirming next-intl key resolution works for both bundles across the full command set.

**Fix:** Add a test mirroring the EN 14-item test:
```tsx
it('renders all 14 command items when palette is open (PT)', async () => {
  render(<CommandPaletteRoot />, { locale: 'pt' });
  const user = userEvent.setup();
  await user.keyboard('{Meta>}k{/Meta}');

  expect(screen.getByText('Início')).toBeInTheDocument();
  expect(screen.getByText('Sobre')).toBeInTheDocument();
  expect(screen.getByText('Projetos')).toBeInTheDocument();
  expect(screen.getByText('Habilidades')).toBeInTheDocument();
  expect(screen.getByText('Carreira')).toBeInTheDocument();
  expect(screen.getByText('Blog')).toBeInTheDocument();
  expect(screen.getByText('Contato')).toBeInTheDocument();
  expect(screen.getByText('Alternar tema — Jedi (claro) / Sith (escuro)')).toBeInTheDocument();
  expect(screen.getByText('Trocar para Português')).toBeInTheDocument();
  expect(screen.getByText('Trocar para Inglês')).toBeInTheDocument();
  expect(screen.getByText('Currículo — PT (PDF)')).toBeInTheDocument();
  expect(screen.getByText('Resume — EN (PDF)')).toBeInTheDocument();
  expect(screen.getByText('Perfil no LinkedIn')).toBeInTheDocument();
  expect(screen.getByText('Perfil no GitHub')).toBeInTheDocument();
});
```

---

### WR-04: Close button accessible label is hardcoded English in `dialog.tsx`

**File:** `src/components/ui/dialog.tsx:66`
**Issue:** The `DialogContent` close button renders `<span className="sr-only">Close</span>`. When the command palette is open in the PT locale, assistive technology announces "Close" (English) for the button in the top-right corner — not "Fechar". This violates the project's bilingual completeness constraint ("Every user-facing copy must be authored in both PT and EN before shipping a locale"). The button is the primary dismiss affordance on mobile (UX-07); PT-locale users with screen readers receive an English label.

Note: `dialog.tsx` is a shared Shadcn primitive and the scope instruction marks it for review. The fix belongs in `dialog.tsx` itself, not in the palette component.

**Fix:** Pass the close label through the component API rather than hardcoding it:
```tsx
// In dialog.tsx — add closeButtonLabel prop to DialogContent:
function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeButtonLabel = 'Close',  // add this prop
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  closeButtonLabel?: string;  // add this prop
}) {
  // ...
  {showCloseButton && (
    <DialogPrimitive.Close data-slot="dialog-close" asChild>
      <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
        <XIcon />
        <span className="sr-only">{closeButtonLabel}</span>
      </Button>
    </DialogPrimitive.Close>
  )}
}

// In CommandDialog (command.tsx), thread the translation through:
function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command or run...',
  closeButtonLabel = 'Close',  // add
  ...
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">...</DialogHeader>
      <DialogContent
        showCloseButton={showCloseButton}
        closeButtonLabel={closeButtonLabel}  // pass through
        ...
      >
```

Then in `command-palette.tsx`:
```tsx
<CommandDialog
  // ...
  closeButtonLabel={t('closeButton')}  // add key to both locales
/>
```
And add to both message files:
```json
"closeButton": "Close"   // en.json
"closeButton": "Fechar"  // pt.json
```

---

## Info

### IN-01: `keydown` listener re-registers on every open/close cycle

**File:** `src/components/shared/command-palette.tsx:62–71`
**Issue:** The `useEffect` dependency array includes `[open, onOpenChange]`. Because `open` toggles on every Cmd+K, the listener is removed and re-added on every open and close. Using a functional update removes `open` from the dependency:

```tsx
useEffect(() => {
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onOpenChange((prev) => !prev);  // functional update — no 'open' closure
    }
  }
  document.addEventListener('keydown', onKeydown);
  return () => document.removeEventListener('keydown', onKeydown);
}, [onOpenChange]);  // 'open' no longer needed here
```
With `onOpenChange` being `setOpen` from `useState` (which is stable), this registers the listener once for the component's lifetime.

---

### IN-02: `scrollIntoView` spy doesn't verify the target element

**File:** `src/components/shared/command-palette.test.tsx:274–308`
**Issue:** The "About command calls scrollIntoView" and "Home command scrolls to #hero" tests assert `Element.prototype.scrollIntoView` was called with `{ behavior: 'smooth' }`. They do not verify it was called on the correct element (`#about` or `#hero`). If the command ever targets the wrong section ID, these tests would still pass. The assertion could be tightened:

```tsx
await vi.waitFor(() => {
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  // Also verify the mock was called on the right instance:
  const calls = vi.mocked(Element.prototype.scrollIntoView).mock.instances;
  expect(calls.some((el) => (el as HTMLElement).id === 'about')).toBe(true);
});
```

---

### IN-03: `requestAnimationFrame` callback is not cancelled on unmount

**File:** `src/components/shared/command-palette.tsx:74–77`
**Issue:** `runCommand` schedules `action` via `requestAnimationFrame` without storing the handle for cancellation. If the component unmounts between `onOpenChange(false)` and the next paint (e.g., during a page navigation triggered by the Blog command), the rAF fires against a potentially torn-down React tree. In practice this is harmless — `router.push` and `window.open` are global-safe, `setTheme` persists outside React, and `scrollIntoView` checks element existence via optional chaining. But `switchLocale` causes a server redirect that will proceed regardless of component state. The risk is low and matches the pattern used by the existing locale toggle.

No change is strictly required. If a future action adds React state mutation inside `runCommand`, consider storing the rAF id in a ref and cancelling it in a cleanup effect.

---

_Reviewed: 2026-05-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
