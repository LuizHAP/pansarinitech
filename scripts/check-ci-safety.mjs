#!/usr/bin/env node
/**
 * scripts/check-ci-safety.mjs
 *
 * Fast pre-commit grep gate. Catches patterns that pass local unit tests
 * but reliably break the CI Playwright / verify-metadata jobs.
 *
 * Runs in ~50ms — no server, no build required.
 * Add new rules to RULES[] as CI anti-patterns are discovered.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const RULES = [
  // localePrefix:'always' — every route is served under /en or /pt. A bare
  // goto('/') or toHaveURL(/^\/blog/) targets a URL that middleware 307s away
  // from, so tests must use the explicit locale-prefixed path.
  {
    id: 'LOCALE_PREFIX_REQUIRED_IN_TEST_GOTO',
    description: "page.goto() with a locale-free path (localePrefix is 'always')",
    // NOTE: the glob resolver below only expands '**' when it precedes at
    // least one more path segment held by a directory — it does not match
    // files sitting directly inside the '**' directory. All spec files live
    // flat under tests/, so 'tests/*.spec.ts' is used instead of 'tests/**/*.ts'
    // (which would silently resolve to zero files and make this rule a no-op).
    files: ['tests/*.spec.ts'],
    // Flags goto('/'), goto('/blog'), goto('/does-not-exist'), etc. Allows
    // goto('/en'), goto('/pt/...'), and template literals whose first segment
    // is a dynamic locale (e.g. goto(`/${locale}${path}`)) — those derive the
    // prefix from the Playwright project name at runtime.
    pattern: /goto\(\s*['"`]\/(?!en\b|pt\b|\$\{)[^'"`]*['"`]/,
    message:
      "Prefix test URLs with the target locale, e.g. goto('/en/blog') or " +
      "goto('/pt/blog'), to match localePrefix:'always'.",
  },
  // gh pr edit has no --add-body flag. This breaks post-generation workflows
  // after the PR is created and the Vercel preview is deployed.
  {
    id: 'NO_GH_PR_EDIT_ADD_BODY',
    description: 'unsupported gh pr edit --add-body flag in workflow',
    files: ['.github/workflows/*.yml'],
    pattern: /\bgh\s+pr\s+edit\b.*--add-body|--add-body\b/,
    message:
      'Use gh pr edit --body-file to replace the body after appending text, ' +
      'or gh pr comment --body to add a PR comment.',
  },
];

// ---------------------------------------------------------------------------
// File glob resolver (simple — supports ** and * only at the end segment)
// ---------------------------------------------------------------------------

function resolveGlob(pattern) {
  const parts = pattern.split('/');
  const files = [];

  function walk(dir, depth) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      const stat = statSync(full);
      const seg = parts[depth];

      if (depth === parts.length - 1) {
        // Last segment — match files
        if (seg === '**') {
          if (stat.isFile()) files.push(full);
          else if (stat.isDirectory()) walk(full, depth);
        } else if (seg.startsWith('*')) {
          const ext = seg.slice(1); // e.g. '*.ts' → '.ts'
          if (stat.isFile() && entry.endsWith(ext)) files.push(full);
        } else {
          if (stat.isFile() && entry === seg) files.push(full);
        }
      } else {
        // Intermediate segment
        if (seg === '**') {
          // recurse into any directory
          if (stat.isDirectory()) walk(full, depth); // stay at this depth
          if (stat.isDirectory()) walk(full, depth + 1); // and advance
        } else if (stat.isDirectory() && (seg === '*' || entry === seg)) {
          walk(full, depth + 1);
        }
      }
    }
  }

  walk('.', 0);
  return [...new Set(files)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let violations = 0;

for (const rule of RULES) {
  const filePaths = rule.files.flatMap(resolveGlob);

  for (const filePath of filePaths) {
    let source;
    try {
      source = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = source.split('\n');
    const matches = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      // Skip pure comment lines (// ...) — rules target code, not documentation
      if (trimmed.startsWith('//')) continue;
      if (rule.pattern.test(lines[i])) {
        matches.push({ line: i + 1, text: trimmed });
      }
    }

    if (matches.length > 0) {
      console.error(`\n[check-ci-safety] ✘ ${rule.id}`);
      console.error(`  File: ${filePath}`);
      console.error(`  Problem: ${rule.description}`);
      for (const m of matches) {
        console.error(`  Line ${m.line}: ${m.text.slice(0, 120)}`);
      }
      console.error(`  Fix: ${rule.message}`);
      violations += matches.length;
    }
  }
}

if (violations > 0) {
  console.error(
    `\n[check-ci-safety] ${violations} violation(s) found — commit blocked to prevent CI failure.\n`,
  );
  process.exit(1);
}

console.log('[check-ci-safety] ✓ No CI-safety violations found.');
