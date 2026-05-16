---
phase: 02-ux-polish-testing-interactions-animations
verified: 2026-05-13T17:30:00Z
status: human_needed
score: 8/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Personal Projects section visual quality at all breakpoints"
    expected: "All 5 cards render with consistent layout matching Featured Projects and Skills sections; 2 cards (doacao, redzone-boss) show real screenshots; 3 cards (starlimp, notificame, mtgprice) show correct fallback (screenshot or gradient); responsive layout holds on 375px (iPhone SE)"
    why_human: "screenshotDraft:true causes doacao and redzone-boss to render the gradient path despite having screenshot fields — the card renders identically to a no-screenshot entry. Visual confirmation that gradient fallback is intentional and not broken is required."
  - test: "Scroll-reveal stagger on Personal Projects grid"
    expected: "Scrolling to the Personal Projects section shows 5 cards animating in sequentially with ~70ms stagger between each card (RevealGroup stagger={0.07})"
    why_human: "RevealGroup stagger is implemented in code (verified: stagger={0.07} at personal-projects.tsx:81) but the scroll-triggered IntersectionObserver behavior cannot be verified programmatically"
  - test: "CopyEmailButton animated icon swap visual verification"
    expected: "Clicking the copy button shows a green Check icon that scales/fades in over 150ms, then returns to CopyIcon after 2 seconds. Under prefers-reduced-motion the swap is instant."
    why_human: "The AnimatePresence animation (opacity+scale transitions) depends on the browser's rendering pipeline. Tests confirm state transitions but not the visual rendering of the 150ms animation."
---

# Phase 2: UX Polish — Testing, Interactions & Animations Verification Report

**Phase Goal:** The copy-email button has full test coverage, the Personal Projects section matches the quality standard of the rest of the site, and micro-interactions across all sections feel consistent and intentional
**Verified:** 2026-05-13T17:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Clicking the copy-email button shows a check-icon confirmation, resets after a timeout, and announces the action accessibly | ✓ VERIFIED | AnimatePresence mode="wait" with motion.span key="check"/"copy" at copy-email-button.tsx:80-103; aria-live="polite" aria-atomic="true" on inner span at line 104; setCopied(false) timeout at line 65 |
| 2 | All of the above is covered by Vitest + RTL tests (resolving TD-07) | ✓ VERIFIED | 7 tests pass in copy-email-button.test.tsx; Test 7 (icon swap) asserts check-icon/copy-icon DOM swap via lucide-react + motion/react mocks; 200/200 suite-wide |
| 3 | Personal Projects section visually matches quality of other sections at all breakpoints | ? UNCERTAIN | Code structure matches (RevealGroup grid, Card components, badge layout, hover effects); screenshotDraft:true on doacao + redzone-boss means the next/image branch is NOT rendered for those 2 cards — requires human visual confirmation |
| 4 | Personal Projects cards animate in with scroll-reveal stagger consistent with v1.1 animation system | ✓ VERIFIED (code) | RevealGroup stagger={0.07} at personal-projects.tsx:81 — code path is correct; visual firing requires human verify |
| 5 | Hover states, focus rings, and scroll-reveal entry timings are consistent across all homepage sections | ✓ VERIFIED | skills.tsx line 57: focus-visible:ring-3 focus-visible:ring-ring/50 (matches contact.tsx); now-preview.tsx line 32: decoration-2 underline-offset-4 hover:decoration-foreground (matches featured-projects-teaser.tsx) |
| 6 | Skills filter chip focus ring matches Contact button focus ring pattern | ✓ VERIFIED | grep confirms: `focus-visible:ring-3 focus-visible:ring-ring/50` present; old `ring-2 ring-ring` absent |
| 7 | NowPreview inline link uses established link-hover pattern | ✓ VERIFIED | grep confirms: `underline-offset-4 hover:decoration-foreground` present; old `underline-offset-2 hover:opacity-80` absent |
| 8 | Test suite passes with no regressions (200 tests) | ✓ VERIFIED | npx vitest run: "Test Files 25 passed (25), Tests 200 passed (200)" |
| 9 | public/screenshots/ directory exists with screenshot assets | ✓ VERIFIED (partial) | ls public/screenshots/ returns doacao.png + redzone-boss.png; .gitkeep exists (committed at 7968811); notificame.png + mtgprice.png absent (accepted deviation) |

**Score:** 8/9 truths verified (Truth 3 is UNCERTAIN — requires human)

---

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

None — no items deferred to later phases.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `src/components/sections/copy-email-button.tsx` | AnimatePresence icon swap with Check + motion.span wrapper | ✓ VERIFIED | Contains AnimatePresence mode="wait" initial={false}; motion.span key="check" with text-green-600 dark:text-green-400; motion.span key="copy"; both with opacity+scale transitions |
| `src/components/sections/copy-email-button.test.tsx` | 7 tests — 6 pre-existing + Test 7 icon-swap | ✓ VERIFIED | vi.mock('lucide-react') at module scope; vi.mock('motion/react') synchronous stub; Test 7 asserts icon swap; 7/7 pass |
| `src/components/sections/skills.tsx` | DEV-1 fix — focus-visible:ring-3 focus-visible:ring-ring/50 | ✓ VERIFIED | Line 57 confirmed; no bare ring-2 or ring-ring (without /50) present |
| `src/components/sections/now-preview.tsx` | DEV-2 fix — underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground | ✓ VERIFIED | Line 32 confirmed; no underline-offset-2 or hover:opacity-80 present |
| `src/data/personal-projects.ts` | screenshot field for doacao + redzone-boss; notificame + mtgprice remain as gradient placeholders | ✓ VERIFIED (partial) | Lines 42-43: screenshot: '/screenshots/doacao.png', screenshotDraft: true; lines 80-81: screenshot: '/screenshots/redzone-boss.png', screenshotDraft: true; notificame + mtgprice have no screenshot field |
| `public/screenshots/` | Directory with doacao.png + redzone-boss.png | ✓ VERIFIED (partial) | doacao.png (272 KB) + redzone-boss.png (671 KB) present; notificame.png + mtgprice.png absent per accepted deviation |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| copy-email-button.tsx | motion/react | AnimatePresence mode="wait" wrapping motion.span key="check"/"copy" | ✓ WIRED | Import at line 14; AnimatePresence at line 80; both motion.span elements rendered |
| copy-email-button.test.tsx | lucide-react | vi.mock('lucide-react') replacing Check+CopyIcon with data-testid spans | ✓ WIRED | Lines 13-20; spreads ...actual; both Check and CopyIcon replaced |
| copy-email-button.test.tsx | motion/react | vi.mock('motion/react') making AnimatePresence synchronous | ✓ WIRED | Lines 24-46; AnimatePresence renders as React.Fragment; motion.* elements rendered as plain HTML |
| skills.tsx filter chip | contact.tsx button pattern | focus-visible:ring-3 focus-visible:ring-ring/50 class | ✓ WIRED | Line 57 confirmed |
| now-preview.tsx Link | featured-projects-teaser.tsx nav link pattern | decoration-2 underline-offset-4 hover:decoration-foreground classes | ✓ WIRED | Line 32 confirmed |
| personal-projects.ts screenshot fields | public/screenshots/ directory | next/image src prop in ProjectScreenshot component | ⚠️ PARTIAL | Paths exist; BUT screenshotDraft:true flag causes ProjectScreenshot to render gradient (not next/image) for doacao + redzone-boss — see note below |

**Note on screenshotDraft:** personal-projects.tsx line 38 guards `if (project.screenshot && !project.screenshotDraft)`. With screenshotDraft:true on doacao and redzone-boss, those cards always render the gradient fallback regardless of the screenshot field. This is an intentional behavior (documented in commits 71252f8 and b14e6b4 as a "CR-02 enforce screenshotDraft" fix) to prevent pre-redesign screenshots from appearing in production. The screenshot fields are wired at the data layer but the render guard suppresses them intentionally.

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `personal-projects.tsx` (PersonalProjects) | `personalProjects` array | `src/data/personal-projects.ts` static const | Yes — static bilingual data, not empty | ✓ FLOWING |
| `copy-email-button.tsx` | `copied` state | `useState(false)` + `setCopied(true)` in handleCopy on clipboard success | Yes — driven by real clipboard API calls | ✓ FLOWING |
| `skills.tsx` | `filtered` array | `skills` data + `active` filter state | Yes — flatMap over skills data constant | ✓ FLOWING |
| `now-preview.tsx` | `now` data | `src/data/now.ts` static import | Yes — static content object | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 7 tests pass in copy-email-button.test.tsx | `npx vitest run src/components/sections/copy-email-button.test.tsx` | 7 passed (7) | ✓ PASS |
| Full 200-test suite passes | `npx vitest run` | 25 files, 200 tests passed | ✓ PASS |
| AnimatePresence mode="wait" present | grep AnimatePresence copy-email-button.tsx | Line 80: AnimatePresence mode="wait" initial={false} | ✓ PASS |
| skills.tsx ring-3 pattern present | grep focus-visible:ring skills.tsx | Line 57: ring-3 ring-ring/50 confirmed | ✓ PASS |
| now-preview.tsx correct link classes | grep underline-offset now-preview.tsx | Line 32: underline-offset-4 hover:decoration-foreground confirmed | ✓ PASS |
| Screenshot files exist | ls public/screenshots/ | doacao.png + redzone-boss.png present | ✓ PASS |
| screenshotDraft guard in ProjectScreenshot | grep screenshotDraft personal-projects.tsx | Line 38: `if (project.screenshot && !project.screenshotDraft)` | ✓ PASS |

---

### Probe Execution

No probes declared in PLAN files. Not a migration/tooling phase. Step 7c: SKIPPED.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| UX-08 | 02-01 | RTL tests for copy-email clipboard + toast (TD-07) | ✓ SATISFIED | 7 tests in copy-email-button.test.tsx cover clipboard success, execCommand fallback, failure, EN/PT labels, revert timeout, and icon swap |
| UX-09 | 02-01 | Copy-email visual polish (check icon, reset timeout, a11y announcement) | ✓ SATISFIED | Check icon with text-green-600/dark:text-green-400 at lines 84-91; 2000ms setTimeout at line 65; aria-live="polite" aria-atomic="true" inner span at line 104 |
| UX-10 | 02-03 | Personal Projects layout refinement | ? PARTIALLY SATISFIED | Data structure wired; 2/4 screenshot paths added; screenshotDraft:true means 2 cards render gradient even with screenshot field — visual quality requires human confirm |
| UX-11 | 02-03 | Personal Projects scroll-reveal stagger animations | ✓ SATISFIED (code verified) | RevealGroup stagger={0.07} at personal-projects.tsx:81; RevealItem wrapping each card at lines 83/139 |
| UX-12 | 02-02 | Micro-interactions polish across all sections | ✓ SATISFIED | DEV-1 (skills focus ring) and DEV-2 (NowPreview link) both fixed; 02-02 SUMMARY confirms audit found only 2 deviations which are now closed |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps UX-08 through UX-12 all to Phase 2. No phase-2 requirements appear without a claiming plan. No orphans.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/data/personal-projects.ts` | 43, 81 | `screenshotDraft: true` on doacao + redzone-boss | ℹ️ Info | Intentional — flags pre-redesign screenshots to suppress rendering until redesigns are complete. Documented in commits 71252f8 + b14e6b4. Not a bug. |

No TBD, FIXME, or XXX markers found in any phase-modified file. No unlinked debt markers. No stub patterns (empty returns, placeholder divs) in production code paths.

---

### Human Verification Required

#### 1. Personal Projects Visual Quality

**Test:** Open `http://localhost:3000/en`, scroll to the Personal Projects section. Inspect all 5 cards at desktop (1280px) and mobile (375px).
**Expected:** All 5 cards render with consistent card layout (screenshot/gradient area, title, status badge, description, stack badges, links). The 3 cards without active screenshots (notificame, mtgprice, and effectively doacao/redzone-boss due to screenshotDraft) show gradient placeholders that are visually cohesive, not broken-looking. The section should feel at parity with Featured Projects and Skills sections.
**Why human:** screenshotDraft:true means doacao and redzone-boss intentionally render gradients despite having screenshot paths. Only human evaluation can confirm the gradient placeholder rendering meets the "quality standard of the rest of the site" success criterion.

#### 2. Personal Projects Scroll-Reveal Stagger

**Test:** Refresh the page, scroll to Personal Projects slowly.
**Expected:** The 5 project cards animate in sequentially — each card fades+slides up approximately 70ms after the previous one (stagger={0.07}).
**Why human:** RevealGroup uses IntersectionObserver to trigger the stagger sequence. This cannot be triggered programmatically in the test environment; the behavior requires an actual browser with scroll simulation.

#### 3. CopyEmailButton Animated Icon Swap Visual

**Test:** In the Contact section, click the "Copy email" button.
**Expected:** The CopyIcon immediately transitions (150ms fade+scale) to a green Check icon, which persists for 2 seconds before fading back to CopyIcon. On a device with `prefers-reduced-motion: reduce`, the swap is instant with no animation frames.
**Why human:** Tests confirm state transitions via mocked AnimatePresence. The rendered animation depends on actual browser rendering of the motion library transitions.

---

### Gaps Summary

No blocking gaps. All code-verifiable must-haves are VERIFIED. The three human verification items above are required before this phase can be marked fully passed — specifically Truth 3 (Personal Projects visual quality) remains UNCERTAIN pending visual confirmation that the gradient-fallback rendering under screenshotDraft:true meets the phase goal's quality bar.

The screenshotDraft pattern is architecturally sound and intentional (doacao + redzone-boss have real screenshots wired at the data layer; the screenshotDraft flag prevents pre-redesign screenshots from appearing until the projects are redesigned). This is a quality decision, not a gap.

---

_Verified: 2026-05-13T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
