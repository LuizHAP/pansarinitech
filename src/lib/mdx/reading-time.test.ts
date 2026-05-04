// src/lib/mdx/reading-time.test.ts — co-located with reading-time.ts (Phase 01 Plan 01)
import { describe, expect, it } from 'vitest';
import { calculateReadingTime } from './reading-time';

describe('calculateReadingTime()', () => {
  it('returns 1 minute for very short prose (1-minute floor)', () => {
    expect(calculateReadingTime('hello world').minutes).toBe(1);
  });

  it('rounds up to 2 minutes for exactly 440 words at 220 wpm', () => {
    const body = Array(440).fill('word').join(' ');
    expect(calculateReadingTime(body).minutes).toBe(2);
  });

  it('ceils non-integer minute counts (221 words → 2 minutes, exercises Math.ceil)', () => {
    const body = Array(221).fill('word').join(' ');
    expect(calculateReadingTime(body).minutes).toBe(2);
  });

  it('strips fenced code blocks before counting words', () => {
    const body = ['```ts', ...Array(500).fill('const x = 1;'), '```', 'hello world'].join('\n');
    // Fenced block removed → only "hello world" counted → 1-minute floor
    expect(calculateReadingTime(body).minutes).toBe(1);
  });

  it('strips inline code before counting words', () => {
    const body = 'Use `someVeryLongFunctionName()` to do the thing.';
    expect(calculateReadingTime(body).minutes).toBe(1);
  });

  it('returns 1 minute for an empty string (1-minute floor + .filter(Boolean))', () => {
    expect(calculateReadingTime('').minutes).toBe(1);
  });

  it('returns 1 minute for whitespace-only input', () => {
    expect(calculateReadingTime('   \n\n   ').minutes).toBe(1);
  });
});
