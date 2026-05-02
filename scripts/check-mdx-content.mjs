#!/usr/bin/env node
// scripts/check-mdx-content.mjs — Phase 4 D-05 (generalized from Phase 3's
// scripts/check-projects.mjs; renamed via git mv in Plan 04-02)
//
// Pre-build fast-feedback gate. Drives the loader's parity + frontmatter shape
// paths so missing locale files or malformed frontmatter fail BEFORE next build,
// saving CI minutes. Mirrors the verify:data pattern.
//
// USAGE:
//   pnpm verify:projects               (alias for --kind=projects)
//   pnpm verify:posts                  (alias for --kind=posts)
//   pnpm verify:mdx-content            (alias for --kind=all)
//   node scripts/check-mdx-content.mjs --kind=projects|posts|all
//
// This intentionally avoids importing the React-bound factory.ts to keep the
// gate fast and dependency-light. It re-implements the parity check + minimum
// shape validation against the SAME schemas (ProjectFrontmatter +
// BlogFrontmatter) so the two stay in sync. If the schemas drift, both this
// script and factory.ts will fail together.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { argv, exit } from 'node:process';

const FILE_PATTERN = /^([a-z0-9-]+)\.(en|pt)\.mdx$/;

const CONTENT_KINDS = {
  projects: {
    dir: join(process.cwd(), 'content', 'projects'),
    label: 'projects',
    validate: validateProjectFrontmatter,
    requireDir: true,
  },
  posts: {
    dir: join(process.cwd(), 'content', 'blog'),
    label: 'blog',
    validate: validatePostFrontmatter,
    // posts dir is allowed to be missing pre-launch; treat as "no posts found"
    requireDir: false,
  },
};

function parseKindFlag() {
  const flag = argv.find((a) => a.startsWith('--kind='));
  if (!flag) return 'all';
  const value = flag.split('=')[1];
  if (value !== 'projects' && value !== 'posts' && value !== 'all') {
    console.error(`✗ unknown --kind value: ${value}. Use projects|posts|all.`);
    exit(2);
  }
  return value;
}

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

function validateProjectFrontmatter(filename, data, errors) {
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
}

function validatePostFrontmatter(filename, data, errors) {
  if (typeof data.title !== 'string' || data.title.length < 1) {
    errors.push(`${filename}: title must be a non-empty string`);
  }
  if (typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push(`${filename}: date must be YYYY-MM-DD; got ${JSON.stringify(data.date)}`);
  }
  if (typeof data.excerpt !== 'string' || data.excerpt.length < 40 || data.excerpt.length > 280) {
    errors.push(
      `${filename}: excerpt must be 40-280 chars; got ${typeof data.excerpt === 'string' ? data.excerpt.length : 'non-string'}`,
    );
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    errors.push(`${filename}: tags must be a string array (or omitted)`);
  }
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    errors.push(`${filename}: draft must be a boolean (or omitted)`);
  }
}

async function checkKind(kindKey) {
  const cfg = CONTENT_KINDS[kindKey];
  let entries;
  try {
    entries = await readdir(cfg.dir);
  } catch (err) {
    if (err.code === 'ENOENT' && !cfg.requireDir) {
      console.log(`✓ ${cfg.label}: directory missing (no content yet, ok)`);
      return true;
    }
    console.error(`✗ ${cfg.label}: cannot read ${cfg.dir}: ${err.message}`);
    return false;
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
    if (!bucket.en) missing.push(`content/${cfg.label}/${slug}.en.mdx`);
    if (!bucket.pt) missing.push(`content/${cfg.label}/${slug}.pt.mdx`);
  }
  if (missing.length > 0) {
    console.error(`✗ ${cfg.label}: bilingual parity violation — missing:`);
    for (const m of missing) console.error(`  - ${m}`);
    return false;
  }

  // Frontmatter shape check
  const errors = [];
  let enCount = 0;
  let ptCount = 0;
  for (const [, bucket] of perSlug.entries()) {
    for (const locale of ['en', 'pt']) {
      const filename = bucket[locale];
      if (!filename) continue;
      const raw = await readFile(join(cfg.dir, filename), 'utf8');
      const parsed = parseFrontmatter(raw);
      if (!parsed) {
        errors.push(`${filename}: missing or malformed YAML frontmatter`);
        continue;
      }
      cfg.validate(filename, parsed.data, errors);
      if (locale === 'en') enCount += 1;
      else ptCount += 1;
    }
  }

  if (errors.length > 0) {
    console.error(`✗ ${cfg.label}: frontmatter validation failed:`);
    for (const e of errors) console.error(`  - ${e}`);
    return false;
  }

  console.log(`✓ ${cfg.label}: ${enCount} EN / ${ptCount} PT (parity ok)`);
  return true;
}

const kindFlag = parseKindFlag();
const targets = kindFlag === 'all' ? ['projects', 'posts'] : [kindFlag];

let allOk = true;
for (const k of targets) {
  const ok = await checkKind(k);
  if (!ok) allOk = false;
}

exit(allOk ? 0 : 1);
