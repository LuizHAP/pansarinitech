// src/lib/mdx/toc.test.ts — Phase 01 Plan 02 (100% coverage on extractToc)
import { describe, expect, it } from 'vitest';
import { extractToc } from './toc';

describe('extractToc()', () => {
  it('returns [] for documents under the default 1000-word threshold', () => {
    expect(extractToc('short content')).toEqual([]);
  });

  it('returns [] when custom threshold is not exceeded', () => {
    expect(extractToc('a b c', { wordCountThreshold: 10 })).toEqual([]);
  });

  it('returns [] for an empty string', () => {
    expect(extractToc('')).toEqual([]);
  });

  it('returns entries when word count exceeds custom low threshold', () => {
    const body = `${Array(20).fill('w').join(' ')}\n\n## Section\n`;
    const toc = extractToc(body, { wordCountThreshold: 5 });
    expect(toc).toHaveLength(1);
    expect(toc[0]).toEqual({ id: 'section', text: 'Section', level: 2 });
  });

  it('excludes headings inside fenced code blocks (long body)', () => {
    const long = Array(1001).fill('word').join(' ');
    const body = `${long}\n\`\`\`\n## Not a heading\n\`\`\`\n\n## Real Heading\n`;
    const toc = extractToc(body);
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Real Heading');
  });

  it('assigns level 2 to ## and level 3 to ### in source order', () => {
    const long = Array(1001).fill('word').join(' ');
    const body = `${long}\n\n## H2\n### H3\n`;
    const toc = extractToc(body);
    expect(toc[0].level).toBe(2);
    expect(toc[1].level).toBe(3);
  });

  it('uses github-slugger for ids and deduplicates duplicate headings per call', () => {
    const long = Array(1001).fill('word').join(' ');
    const body = `${long}\n\n## Hello World\n## Hello World\n`;
    const toc = extractToc(body);
    expect(toc[0].id).toBe('hello-world');
    expect(toc[1].id).toBe('hello-world-1');
  });

  it('trims surrounding whitespace from heading text', () => {
    const long = Array(1001).fill('word').join(' ');
    const body = `${long}\n\n## Section   \n`;
    const toc = extractToc(body);
    expect(toc[0].text).toBe('Section');
    expect(toc[0].id).toBe('section');
  });

  it('handles body with exactly threshold+1 words (boundary: above threshold)', () => {
    // wordCountThreshold defaults to 1000; use a body with exactly 1001 words
    const body = `${Array(1001).fill('word').join(' ')}\n\n## Threshold Heading\n`;
    const toc = extractToc(body);
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Threshold Heading');
  });

  it('fenced-code word count reduction causes short-circuit on boundary body', () => {
    // Build a body where words inside fenced code push total count over threshold,
    // but stripping fenced code brings word count to <= threshold -> returns []
    // 500 real words + fenced block with 600 words (which gets replaced by single space)
    const realWords = Array(500).fill('real').join(' ');
    const fencedWords = Array(600).fill('code').join(' ');
    const body = `${realWords}\n\`\`\`\n${fencedWords}\n\`\`\`\n\n## Not Returned\n`;
    const toc = extractToc(body);
    expect(toc).toEqual([]);
  });
});
