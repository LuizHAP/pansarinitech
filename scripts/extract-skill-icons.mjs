/**
 * Extracts only the skill icons used in src/data/skills.ts from the
 * @iconify-json/logos collection and writes a compact JSON to
 * src/data/skill-icons.json.
 *
 * Run: node scripts/extract-skill-icons.mjs
 * Also runs automatically as the `prebuild` script.
 *
 * This eliminates the @iconify/react CDN round-trips at runtime while keeping
 * the bundle impact minimal (~28 icons instead of ~1000+ in the full collection).
 */

import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const logos = require('@iconify-json/logos/icons.json');

// Must stay in sync with the `icon` values in src/data/skills.ts
// (strip the "logos:" prefix — these are just the icon names within the collection)
const NEEDED = [
  'nextjs-icon',
  'react',
  'typescript-icon',
  'tailwindcss-icon',
  'radix-ui',
  'html-5',
  'expo-icon',
  'android-icon',
  'nodejs-icon',
  'graphql',
  'playwright',
  'jest',
  'testing-library',
  'vitest',
  'vercel-icon',
  'aws',
  'github-actions',
  'docker-icon',
  'postgresql',
  'mongodb-icon',
  'redis',
  'prisma',
  'git-icon',
  'github-icon',
  'visual-studio-code',
  'figma',
  'biome',
  'pnpm',
];

const subset = { prefix: 'logos', icons: {}, width: logos.width, height: logos.height };
const missing = [];

for (const name of NEEDED) {
  if (logos.icons[name]) {
    subset.icons[name] = logos.icons[name];
  } else {
    missing.push(name);
  }
}

if (missing.length > 0) {
  console.warn(`[extract-skill-icons] Missing icons in logos collection: ${missing.join(', ')}`);
}

const outPath = join(__dirname, '../src/data/skill-icons.json');
writeFileSync(outPath, JSON.stringify(subset), 'utf8');

const iconCount = Object.keys(subset.icons).length;
console.log(`[extract-skill-icons] Wrote ${iconCount} icons to src/data/skill-icons.json`);
