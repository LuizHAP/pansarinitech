// src/lib/utils.test.ts — co-located with utils.ts (Phase 01 Plan 01 toolchain proof)
import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn()', () => {
  it('merges plain class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deduplicates conflicting Tailwind utilities (tailwind-merge contract)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles the full ClassValue surface — strings, falsy, arrays, objects', () => {
    expect(cn('a', false, null, undefined, ['b', { c: true, d: false }])).toBe('a b c');
  });
});
