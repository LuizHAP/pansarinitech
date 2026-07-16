/**
 * Manual blog post generator — triggered by workflow_dispatch.
 * Same generation logic as generate-post-openai.mjs but:
 *  - Does NOT update .pipeline-state.json (manual posts are outside the automated sequence).
 *  - Accepts MANUAL_TOPIC and MANUAL_INSTRUCTIONS for custom content.
 */
import fs from 'node:fs';
import path from 'node:path';

const { SLUG, TOPIC, TODAY, MANUAL_INSTRUCTIONS, OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set');
  process.exit(1);
}
if (!SLUG || !TOPIC || !TODAY) {
  console.error('ERROR: SLUG, TOPIC, and TODAY env vars are required');
  process.exit(1);
}

// Read style reference
let styleRef;
try {
  styleRef = fs.readFileSync('content/blog/building-this-portfolio.en.mdx', 'utf8');
} catch (err) {
  console.error('ERROR: Could not read style reference file:', err.message);
  process.exit(1);
}

// Read projects context
let projectsContext = '';
const projDir = 'content/projects-context';
if (fs.existsSync(projDir)) {
  const files = fs.readdirSync(projDir).filter((f) => /\.(md|mdx)$/.test(f));
  projectsContext = files
    .map((f) => fs.readFileSync(path.join(projDir, f), 'utf8'))
    .join('\n\n---\n\n');
}

// Extract existing tags from all published posts (for tag diversity)
function extractExistingTags(currentSlug) {
  const tags = new Set();
  const dir = 'content/blog';
  if (!fs.existsSync(dir)) return '(no existing posts)';
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.en.mdx') && f !== `${currentSlug}.en.mdx`);
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) continue;
    const tagSection = frontmatter[1].match(/^tags:\n((?:\s+- .+\n?)*)/m);
    if (!tagSection) continue;
    const fileTags = tagSection[1].match(/- .+/g);
    if (!fileTags) continue;
    for (const tag of fileTags) {
      tags.add(tag.replace(/^- /, '').trim());
    }
  }
  return (
    [...tags]
      .sort()
      .map((t) => `  - ${t}`)
      .join('\n') || '(none yet)'
  );
}
const existingTags = extractExistingTags(SLUG);

// Build prompt
let userPrompt = fs.readFileSync('scripts/generate-post-prompt.md', 'utf8');
userPrompt = userPrompt
  .replace(/\$\{SLUG\}/g, () => SLUG)
  .replace(/\$\{TOPIC\}/g, () => TOPIC)
  .replace(/\$\{TODAY\}/g, () => TODAY)
  .replace(/\$\{PROJECTS_CONTEXT\}/g, () => projectsContext || '(no project context available)')
  .replace(/\$\{STYLE_REF\}/g, () => styleRef)
  .replace(/\$\{EXISTING_TAGS\}/g, () => existingTags);

if (MANUAL_INSTRUCTIONS) {
  userPrompt += `\n\n## CUSTOM INSTRUCTIONS\n\nThe blog owner provided these specific instructions for this post:\n\n${MANUAL_INSTRUCTIONS}`;
}

const systemPrompt = `You are a bilingual technical blog post writer for pansarini.tech.

IMPORTANT: Do NOT use any tools. Instead, output EXACTLY two file blocks in the following format — start immediately with the first marker, no preamble:

===FILE: content/blog/${SLUG}.en.mdx
<full English MDX file content>
===ENDFILE

===FILE: content/blog/${SLUG}.pt.mdx
<full Brazilian Portuguese MDX file content>
===ENDFILE

Ignore any instruction to "Write files using the Write tool" — the calling script handles file writing from your text output.`;

console.log(`Calling OpenAI API (gpt-4o) for manual post — topic: ${TOPIC}, slug: ${SLUG}`);

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 90_000);

let response;
try {
  response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 8000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
} catch (err) {
  if (err.name === 'AbortError') {
    console.error('ERROR: OpenAI API request timed out after 90s');
    process.exit(1);
  }
  throw err;
} finally {
  clearTimeout(timeoutId);
}

if (!response.ok) {
  const errText = await response.text();
  console.error(`OpenAI API error ${response.status}:`, errText);
  process.exit(1);
}

const data = await response.json();
const choice = data.choices?.[0];
if (!choice) {
  console.error('ERROR: Empty choices array from OpenAI API');
  process.exit(1);
}
if (choice.finish_reason === 'length') {
  console.error('ERROR: OpenAI response was truncated (finish_reason=length)');
  process.exit(1);
}
const output = choice.message?.content ?? '';
if (!output) {
  console.error('ERROR: Empty response from OpenAI API');
  process.exit(1);
}

const fileRegex = /===FILE: ([^\n]+)\n([\s\S]*?)===ENDFILE/g;
const blocks = {};
for (const m of output.matchAll(fileRegex)) {
  blocks[m[1].trim()] = m[2];
}

const enPath = `content/blog/${SLUG}.en.mdx`;
const ptPath = `content/blog/${SLUG}.pt.mdx`;

if (!blocks[enPath]) {
  console.error('ERROR: EN file block not found in model output');
  console.error('Output preview (first 800 chars):', output.slice(0, 800));
  process.exit(1);
}
if (!blocks[ptPath]) {
  console.error('ERROR: PT file block not found in model output');
  process.exit(1);
}

const ALLOWED_PATHS = new Set([enPath, ptPath]);
for (const [filePath, content] of Object.entries(blocks)) {
  if (!ALLOWED_PATHS.has(filePath)) {
    console.warn(`Skipping unexpected file path from model: ${filePath}`);
    continue;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`Written: ${filePath}`);
}
