#!/usr/bin/env node
// scripts/verify-no-highlighter.mjs
//
// Phase 3 D-18, D-19 — PERF-04 CI gate (PARSER, not builder).
//
// Mirrors the Phase 1 parser pattern (scripts/check-static-rendering.mjs):
// CALLER runs `pnpm next build` first; this script ONLY inspects .next/static/chunks.
//
// FORBIDDEN substrings (Pitfall 7 — chosen as exact import-path tokens
// that bundlers emit, never as English words):
//   'shiki', 'prismjs', 'monaco-editor', 'highlight.js', '@shikijs/'

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { exit } from 'node:process';

const FORBIDDEN = ['shiki', 'prismjs', 'monaco-editor', 'highlight.js', '@shikijs/'];
const CHUNKS_DIR = join(process.cwd(), '.next', 'static', 'chunks');

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (full.endsWith('.js')) yield full;
  }
}

let chunks;
try {
  chunks = [...walk(CHUNKS_DIR)];
} catch (err) {
  console.error(`✗ Failed to read ${CHUNKS_DIR}: ${err.message}`);
  console.error('  Run `pnpm next build` first.');
  exit(2);
}

const violations = [];
for (const chunk of chunks) {
  const contents = readFileSync(chunk, 'utf8');
  for (const needle of FORBIDDEN) {
    if (contents.includes(needle)) {
      violations.push({ chunk: chunk.replace(`${process.cwd()}/`, ''), needle });
    }
  }
}

if (violations.length > 0) {
  console.error('\n✗ PERF-04 VIOLATION: highlighter detected in client chunks:');
  for (const v of violations) console.error(`  - ${v.chunk} contains '${v.needle}'`);
  console.error('\n  Phase 3 ships syntax highlighting via rehype-pretty-code at BUILD time only.');
  console.error('  An `import` of shiki/prism/monaco/highlight.js in any client component or');
  console.error('  shared utility breaks PERF-04. Move the import to a server-only module or');
  console.error('  remove it.\n');
  exit(1);
}

console.log(`✓ PERF-04 verified: 0 highlighter substrings across ${chunks.length} client chunks.`);
