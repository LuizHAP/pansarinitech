#!/usr/bin/env node
// scripts/check-message-length.mjs — Phase 4 SEO best-practice gate.
//
// Flags any seo.descriptions.* value > 160 chars (Google snippet truncation).
// Run via: pnpm verify:message-length
//
// Catches the case where a translator (human or LLM) ships a meta-description
// that gets truncated in SERP snippets — the kind of regression Lighthouse
// won't catch but a recruiter searching the site name will see.
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

const MAX_DESCRIPTION_LENGTH = 160;
const FILES = ['messages/en.json', 'messages/pt.json'];

let failed = 0;
for (const file of FILES) {
  const content = JSON.parse(readFileSync(file, 'utf8'));
  const descriptions = content?.seo?.descriptions ?? {};
  for (const [key, value] of Object.entries(descriptions)) {
    if (typeof value !== 'string') continue;
    if (value.length > MAX_DESCRIPTION_LENGTH) {
      console.error(
        `[check-message-length] ${file}: seo.descriptions.${key} is ${value.length} chars (max ${MAX_DESCRIPTION_LENGTH})`,
      );
      failed++;
    }
  }
}

if (failed > 0) {
  console.error(
    `[check-message-length] ${failed} SEO description(s) exceed ${MAX_DESCRIPTION_LENGTH} chars`,
  );
  exit(1);
}
console.log(
  `[check-message-length] ✓ all seo.descriptions.* within ${MAX_DESCRIPTION_LENGTH} chars`,
);
