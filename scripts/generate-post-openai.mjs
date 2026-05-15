/**
 * OpenAI-powered blog post generator.
 * Called by .github/workflows/generate-post.yml when OPENAI_API_KEY is used.
 *
 * Parses TWO file blocks from the model response:
 *   content/blog/${SLUG}.en.mdx
 *   content/blog/${SLUG}.pt.mdx
 *
 * The pipeline state file is written directly from computed newState (not from model output).
 */
import fs from 'node:fs';
import path from 'node:path';

const { SLUG, TOPIC, TODAY, OPENAI_API_KEY } = process.env;

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

// Read projects context (optional — directory may not exist yet)
let projectsContext = '';
const projDir = 'content/projects-context';
if (fs.existsSync(projDir)) {
  const files = fs.readdirSync(projDir).filter((f) => /\.(md|mdx)$/.test(f));
  projectsContext = files
    .map((f) => fs.readFileSync(path.join(projDir, f), 'utf8'))
    .join('\n\n---\n\n');
}

// Substitute all template variables.
// Replacer functions are used to prevent String.replace() from interpreting
// special patterns like $& or $` in the replacement string (WR-04).
let userPrompt = fs.readFileSync('scripts/generate-post-prompt.md', 'utf8');
userPrompt = userPrompt
  .replace(/\$\{SLUG\}/g, () => SLUG)
  .replace(/\$\{TOPIC\}/g, () => TOPIC)
  .replace(/\$\{TODAY\}/g, () => TODAY)
  .replace(/\$\{PROJECTS_CONTEXT\}/g, () => projectsContext || '(no project context available)')
  .replace(/\$\{STYLE_REF\}/g, () => styleRef);

// Build updated pipeline state (the model receives the exact JSON to write)
let pipelineState = {
  last_topic: null,
  run_count: 0,
  last_run_date: null,
  topic_sequence: [
    'nextjs-react-frontend',
    'software-engineering-career',
    'ai-in-development',
    'personal-projects-open-source',
  ],
};
const stateFile = 'content/blog/.pipeline-state.json';
if (fs.existsSync(stateFile)) {
  try {
    pipelineState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    console.warn('Warning: could not parse .pipeline-state.json, using defaults');
  }
}
const newState = {
  ...pipelineState,
  last_topic: TOPIC,
  run_count: (pipelineState.run_count ?? 0) + 1,
  last_run_date: TODAY,
};

// System prompt instructs the model to output parseable file blocks
// (overrides the "Write tool" instruction in the user prompt template)
// Note: pipeline-state.json is written directly from newState, not from model output.
const systemPrompt = `You are a bilingual technical blog post writer for pansarini.tech.

IMPORTANT: Do NOT use any tools. Instead, output EXACTLY two file blocks in the following format — start immediately with the first marker, no preamble:

===FILE: content/blog/${SLUG}.en.mdx
<full English MDX file content>
===ENDFILE

===FILE: content/blog/${SLUG}.pt.mdx
<full Brazilian Portuguese MDX file content>
===ENDFILE

Ignore any instruction to "Write files using the Write tool" — the calling script handles file writing from your text output.`;

console.log(`Calling OpenAI API (gpt-4o) for topic: ${TOPIC}, slug: ${SLUG}`);

// Abort the request if it takes longer than 90 seconds (CR-03)
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  controller.abort();
}, 90_000); // 90 seconds

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

// Detect truncated responses before attempting to parse blocks (CR-02)
const choice = data.choices?.[0];
if (!choice) {
  console.error('ERROR: Empty choices array from OpenAI API');
  process.exit(1);
}
if (choice.finish_reason === 'length') {
  console.error(
    'ERROR: OpenAI response was truncated (finish_reason=length). ' +
      'Increase max_tokens or shorten the prompt.',
  );
  process.exit(1);
}
const output = choice.message?.content ?? '';

if (!output) {
  console.error('ERROR: Empty response from OpenAI API');
  process.exit(1);
}

// Parse file blocks
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

// Only write model-output blocks for the two expected MDX paths (allowlist).
// Any other path returned by the model is silently skipped to prevent
// path traversal / unexpected writes (CR-01).
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

// Write pipeline state directly from computed newState (not from model output)
// to guarantee state integrity regardless of what the model echoes back (WR-01).
fs.mkdirSync(path.dirname(stateFile), { recursive: true });
fs.writeFileSync(stateFile, `${JSON.stringify(newState, null, 2)}\n`);
console.log(`Written: ${stateFile}`);
