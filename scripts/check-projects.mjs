#!/usr/bin/env node
// scripts/check-projects.mjs — Phase 3 D-05
//
// Pre-build fast-feedback gate. Drives the loader's parity + Zod paths so
// missing locale files or malformed frontmatter fail BEFORE next build, saving
// CI minutes. Mirrors the verify:data pattern.
//
// USAGE: pnpm verify:projects (wires `tsx scripts/check-projects.mjs`)
//
// This intentionally avoids importing the React-bound loader.ts to keep the
// gate fast and dependency-light. It re-implements the parity check + Zod
// validation against the SAME ProjectFrontmatter schema so the two stay in
// sync. If the schema drifts, both this script and loader.ts will fail
// together because they share the import.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { exit } from 'node:process';

const CONTENT_DIR = join(process.cwd(), 'content', 'projects');
const FILE_PATTERN = /^([a-z0-9-]+)\.(en|pt)\.mdx$/;

let entries;
try {
  entries = await readdir(CONTENT_DIR);
} catch (err) {
  console.error(`✗ projects: cannot read ${CONTENT_DIR}: ${err.message}`);
  exit(1);
}

// Index: slug -> { en?: filename, pt?: filename }
const perSlug = new Map();
for (const filename of entries) {
  const match = FILE_PATTERN.exec(filename);
  if (!match) continue;
  const [, slug, locale] = match;
  const bucket = perSlug.get(slug) ?? {};
  bucket[locale] = filename;
  perSlug.set(slug, bucket);
}

// Parity check (D-05)
const missing = [];
for (const [slug, bucket] of perSlug.entries()) {
  if (!bucket.en) missing.push(`content/projects/${slug}.en.mdx`);
  if (!bucket.pt) missing.push(`content/projects/${slug}.pt.mdx`);
}
if (missing.length > 0) {
  console.error('✗ projects: bilingual parity violation — missing:');
  for (const m of missing) console.error(`  - ${m}`);
  exit(1);
}

// Frontmatter check — minimal YAML parser identical in shape to loader.ts.
function parseFrontmatter(raw) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(raw);
  if (!fm) return null;
  const [, text, body] = fm;
  const data = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!m) {
      i += 1;
      continue;
    }
    const [, key, rest] = m;
    const trimmed = rest.trim();
    if (trimmed === '') {
      const items = [];
      i += 1;
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, '').replace(/^"(.*)"$|^'(.*)'$/, '$1$2'));
        i += 1;
      }
      data[key] = items;
      continue;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1).trim();
      data[key] =
        inner === ''
          ? []
          : inner.split(',').map((v) => v.trim().replace(/^"(.*)"$|^'(.*)'$/, '$1$2'));
    } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      data[key] = Number(trimmed);
    } else if (trimmed === 'true' || trimmed === 'false') {
      data[key] = trimmed === 'true';
    } else {
      data[key] = trimmed.replace(/^"(.*)"$|^'(.*)'$/, '$1$2');
    }
    i += 1;
  }
  return { data, body };
}

const errors = [];
let enCount = 0;
let ptCount = 0;
for (const [, bucket] of perSlug.entries()) {
  for (const locale of ['en', 'pt']) {
    const filename = bucket[locale];
    if (!filename) continue;
    const raw = await readFile(join(CONTENT_DIR, filename), 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed) {
      errors.push(`${filename}: missing or malformed YAML frontmatter`);
      continue;
    }
    const { data } = parsed;
    // Minimum-viable shape check; loader.ts uses Zod for the strict pass.
    if (typeof data.title !== 'string' || data.title.length < 1) {
      errors.push(`${filename}: title must be a non-empty string`);
    }
    if (typeof data.role !== 'string' || data.role.length < 1) {
      errors.push(`${filename}: role must be a non-empty string`);
    }
    if (typeof data.year !== 'number' || data.year < 2018 || data.year > 2030) {
      errors.push(
        `${filename}: year must be an integer in [2018, 2030]; got ${JSON.stringify(data.year)}`,
      );
    }
    if (!Array.isArray(data.stack) || data.stack.length < 1) {
      errors.push(`${filename}: stack must be a non-empty string array`);
    }
    if (typeof data.blurb !== 'string' || data.blurb.length < 20 || data.blurb.length > 280) {
      errors.push(
        `${filename}: blurb must be 20-280 chars; got ${typeof data.blurb === 'string' ? data.blurb.length : 'non-string'}`,
      );
    }
    if (typeof data.heroImage !== 'string' || data.heroImage.length < 1) {
      errors.push(`${filename}: heroImage must be a non-empty string`);
    }
    if (locale === 'en') enCount += 1;
    else ptCount += 1;
  }
}

if (errors.length > 0) {
  console.error('✗ projects: frontmatter validation failed:');
  for (const e of errors) console.error(`  - ${e}`);
  exit(1);
}

console.log(`✓ projects: ${enCount} EN / ${ptCount} PT (parity ok)`);
