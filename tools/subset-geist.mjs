// tools/subset-geist.mjs — Phase 4 D-23 (one-time font subset)
// Run: node tools/subset-geist.mjs
// Reads node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf,
// subsets to ASCII Latin-1 + PT diacritics, writes src/app/fonts/geist-bold.ttf.
//
// Output is committed to git (so the runtime renderOgImage in src/lib/og.tsx
// has a stable artifact to readFile). Re-run only when:
//   - Geist npm package updates Geist-Bold.ttf (rare)
//   - We need additional glyphs (e.g. add ES locale)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

// Find the Geist Bold ttf — path may shift between Geist versions.
const candidates = [
  'node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf',
  'node_modules/geist/dist/fonts/Geist-Bold.ttf',
];
const inputPath = candidates.find((p) => existsSync(p));
if (!inputPath) {
  console.error(
    '[subset-geist] Geist Bold ttf not found. Run: pnpm install. Searched:',
    candidates,
  );
  process.exit(1);
}

// ASCII alphanumerics + minimal punctuation + PT-only diacritics actually used
// in EN/PT site copy. Trimmed from full Latin-1 to fit the 30KB budget per
// CRITICAL CORRECTION #3. If a future translation needs broader glyph coverage
// (e.g. ES, FR), reintroduce additional characters here and re-run.
const subsetChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
  ' ·—-.,!?:;()\'"/&@#' +
  'áâãéêíóôõúçÁÂÃÉÊÍÓÔÕÚÇ';

const input = readFileSync(inputPath);
// noLayoutClosure drops GSUB substitution closure (we don't need ligatures or
// stylistic alternates for OG titles). Saves ~6KB on the Geist Bold subset.
const subset = await subsetFont(input, subsetChars, {
  targetFormat: 'truetype',
  noLayoutClosure: true,
});

const outDir = join('src', 'app', 'fonts');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'geist-bold.ttf');
writeFileSync(outPath, subset);
console.log(`[subset-geist] wrote ${outPath} (${(subset.length / 1024).toFixed(1)} KB)`);
