import { describe, expect, it } from 'vitest';
import en from '../../../messages/en.json';
import pt from '../../../messages/pt.json';

type Problem = string;

function compare(a: unknown, b: unknown, path: string, problems: Problem[]): void {
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray || bIsArray) {
    for (const [side, value] of [
      ['en', a],
      ['pt', b],
    ] as const) {
      const ok =
        Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string');
      if (!ok) problems.push(`${path}: ${side} must be a non-empty array of strings`);
    }
    return;
  }

  const aIsObject = typeof a === 'object' && a !== null;
  const bIsObject = typeof b === 'object' && b !== null;
  if (aIsObject !== bIsObject) {
    problems.push(`${path}: object in ${aIsObject ? 'en' : 'pt'} only`);
    return;
  }
  if (!aIsObject) return;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  for (const key of Object.keys(aObj)) {
    const child = path ? `${path}.${key}` : key;
    if (!(key in bObj)) problems.push(`${child}: missing in pt`);
    else compare(aObj[key], bObj[key], child, problems);
  }
  for (const key of Object.keys(bObj)) {
    if (!(key in aObj)) problems.push(`${path ? `${path}.${key}` : key}: missing in en`);
  }
}

function messageParityProblems(a: unknown, b: unknown): Problem[] {
  const problems: Problem[] = [];
  compare(a, b, '', problems);
  return problems;
}

describe('messages en/pt parity', () => {
  it('en.json and pt.json have the same deep key tree', () => {
    expect(messageParityProblems(en, pt)).toEqual([]);
  });

  it('reports keys present on one side only', () => {
    expect(messageParityProblems({ a: { b: 'x', c: 'y' } }, { a: { b: 'x' }, d: 'z' })).toEqual([
      'a.c: missing in pt',
      'd: missing in en',
    ]);
  });

  it('treats arrays as leaves that must be non-empty string arrays on both sides', () => {
    expect(messageParityProblems({ w: ['a', 'b'] }, { w: ['a'] })).toEqual([]);
    expect(messageParityProblems({ w: ['a'] }, { w: [] })).toEqual([
      'w: pt must be a non-empty array of strings',
    ]);
    expect(messageParityProblems({ w: ['a'] }, { w: 'a' })).toEqual([
      'w: pt must be a non-empty array of strings',
    ]);
  });

  it('keeps no theme keys and only the terminal 404 keys in both files', () => {
    for (const messages of [en, pt] as Record<string, Record<string, unknown>>[]) {
      const themed = (obj: Record<string, unknown>) =>
        Object.keys(obj).filter((k) => /theme/i.test(k));
      expect(themed(messages)).toEqual([]);
      expect(themed(messages.commandPalette)).toEqual([]);
      expect(Object.keys(messages.notFound).sort()).toEqual(['cta', 'title']);
    }
  });
});
