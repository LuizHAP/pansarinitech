// scripts/check-data.ts — Phase 2 D-03 CI gate
// Loads every data module, runs Schema.parse() via safeParse() so errors print
// with their failing path (Zod's .issues array). Exits non-zero on any failure.
//
// Doubles as a behavioral smoke test for src/lib/i18n/helpers.ts:
//   - pickLocale picks the right field
//   - formatPeriod produces locale-correct "Mon YYYY" / "Presente" output
//
// Wired into CI between `Typecheck` and `Build` (.github/workflows/ci.yml).
//
// Run via: `pnpm verify:data` (-> tsx scripts/check-data.ts).
import type { z } from 'zod';
import { about } from '../src/data/about';
import { career } from '../src/data/career';
import { contact } from '../src/data/contact';
import { hero } from '../src/data/hero';
import { now } from '../src/data/now';
import {
  AboutSchema,
  ContactSchema,
  HeroSchema,
  NowSchema,
  RoleSchema,
  SkillCategorySchema,
} from '../src/data/schemas';
import { skills } from '../src/data/skills';
import { formatPeriod, pickLocale } from '../src/lib/i18n/helpers';

function safeParse<T>(name: string, schema: z.ZodType<T>, value: unknown): boolean {
  const r = schema.safeParse(value);
  if (!r.success) {
    console.error(`✗ ${name} failed Zod validation:`);
    console.error(JSON.stringify(r.error.issues, null, 2));
    return false;
  }
  return true;
}

let ok = true;
ok = safeParse('hero', HeroSchema, hero) && ok;
ok = safeParse('about', AboutSchema, about) && ok;
ok = safeParse('career', RoleSchema.array(), career) && ok;
ok = safeParse('skills', SkillCategorySchema.array(), skills) && ok;
ok = safeParse('now', NowSchema, now) && ok;
ok = safeParse('contact', ContactSchema, contact) && ok;

// Helper smoke tests (TDD assertions for the behavior block)
if (pickLocale({ en: 'foo', pt: 'bar' }, 'pt') !== 'bar') {
  console.error('✗ pickLocale failed: expected "bar"');
  ok = false;
}

const periodEn = formatPeriod({ start: '2023-01', end: 'present' }, 'en');
if (!periodEn.includes('Jan') || !periodEn.includes('Present')) {
  console.error(`✗ formatPeriod EN: got "${periodEn}" (expected to contain "Jan" and "Present")`);
  ok = false;
}

const periodPt = formatPeriod({ start: '2023-01', end: 'present' }, 'pt');
if (!periodPt.toLowerCase().includes('jan') || !periodPt.includes('Presente')) {
  console.error(
    `✗ formatPeriod PT: got "${periodPt}" (expected to contain "jan" case-insensitive and "Presente")`,
  );
  ok = false;
}

// Domain assertions: career has 5 roles reverse-chronological, exactly one pivot.
if (career.length !== 5) {
  console.error(`✗ career: expected 5 roles, got ${career.length}`);
  ok = false;
}
const pivotCount = career.filter((r) => r.pivot === true).length;
if (pivotCount !== 1) {
  console.error(`✗ career: expected exactly 1 pivot:true role (UAUBox 2019), got ${pivotCount}`);
  ok = false;
}
const uauBox = career.find((r) => r.id === 'uaubox');
if (!uauBox?.pivot) {
  console.error('✗ career: UAUBox role must carry pivot:true');
  ok = false;
}

// Skills: 7 categories, 6 daily-flagged items.
if (skills.length !== 7) {
  console.error(`✗ skills: expected 7 categories, got ${skills.length}`);
  ok = false;
}
const dailyCount = skills.flatMap((c) => c.items).filter((i) => i.daily === true).length;
if (dailyCount !== 6) {
  console.error(
    `✗ skills: expected 6 daily-use items (Next.js, TS, Tailwind, Shadcn, RN, Vercel), got ${dailyCount}`,
  );
  ok = false;
}

if (!ok) {
  process.exit(1);
}

console.log('✓ data validation: schemas pass');
console.log(
  `  hero, about, ${career.length} roles, ${skills.length} categories, now, contact (${dailyCount} daily-use skills)`,
);
