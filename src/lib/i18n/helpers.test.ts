// src/lib/i18n/helpers.test.ts — Phase 01 Plan 02 (100% coverage on bilingual UX helpers)
import { describe, expect, it } from 'vitest';
import { formatDate, formatLongDate, formatPeriod, pickLocale } from './helpers';

describe('pickLocale()', () => {
  it("returns the 'en' value for locale='en'", () => {
    expect(pickLocale({ en: 'A', pt: 'B' }, 'en')).toBe('A');
  });

  it("returns the 'pt' value for locale='pt'", () => {
    expect(pickLocale({ en: 'A', pt: 'B' }, 'pt')).toBe('B');
  });
});

describe('formatDate()', () => {
  it('formats YYYY-MM string with en locale (short month + year)', () => {
    const result = formatDate('2023-01', 'en');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2023/);
  });

  it('formats YYYY-MM string with pt locale (short month + year in pt-BR)', () => {
    const result = formatDate('2023-01', 'pt');
    expect(result).toMatch(/jan/i);
    expect(result).toMatch(/2023/);
  });

  it('formats YYYY-MM-DD string with en locale (length !== 7 branch)', () => {
    const result = formatDate('2023-01-15', 'en');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2023/);
  });

  it('formats a Date object input with en locale (typeof !== string branch)', () => {
    const d = new Date(Date.UTC(2024, 2, 15, 12));
    const result = formatDate(d, 'en');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2024/);
  });

  it('formats YYYY-MM-DD string with pt locale', () => {
    const result = formatDate('2023-06-15', 'pt');
    expect(result).toMatch(/jun/i);
    expect(result).toMatch(/2023/);
  });

  it('formats a Date object input with pt locale', () => {
    const d = new Date(Date.UTC(2024, 2, 15, 12));
    const result = formatDate(d, 'pt');
    expect(result).toMatch(/mar/i);
    expect(result).toMatch(/2024/);
  });
});

describe('formatLongDate()', () => {
  it('formats YYYY-MM string with en locale (long month + year, length===7 branch)', () => {
    const result = formatLongDate('2023-01', 'en');
    expect(result).toMatch(/January/);
    expect(result).toMatch(/2023/);
  });

  it('formats YYYY-MM-DD string with pt locale (length !== 7 branch)', () => {
    const result = formatLongDate('2026-05-02', 'pt');
    expect(result).toMatch(/maio/);
    expect(result).toMatch(/2026/);
  });

  it('formats a Date object input with en locale (typeof !== string branch)', () => {
    const d = new Date(Date.UTC(2024, 2, 15, 12));
    const result = formatLongDate(d, 'en');
    expect(result).toMatch(/March/);
    expect(result).toMatch(/2024/);
  });

  it('formats YYYY-MM-DD string with en locale', () => {
    const result = formatLongDate('2023-01-15', 'en');
    expect(result).toMatch(/January/);
    expect(result).toMatch(/2023/);
  });

  it('formats a Date object input with pt locale', () => {
    const d = new Date(Date.UTC(2024, 2, 15, 12));
    const result = formatLongDate(d, 'pt');
    expect(result).toMatch(/março/i);
    expect(result).toMatch(/2024/);
  });
});

describe('formatPeriod()', () => {
  it('formats explicit start/end with em-dash separator (non-present branch)', () => {
    const result = formatPeriod({ start: '2019-04', end: '2023-12' }, 'en');
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/Dec/);
    expect(result).toContain(' — ');
  });

  it("uses 'Present' label for end='present' in en locale", () => {
    const result = formatPeriod({ start: '2023-04', end: 'present' }, 'en');
    expect(result).toMatch(/Present/);
    expect(result).toContain(' — ');
  });

  it("uses 'Presente' label for end='present' in pt locale (presentLabel.pt branch)", () => {
    const result = formatPeriod({ start: '2023-04', end: 'present' }, 'pt');
    expect(result).toMatch(/Presente/);
    expect(result).toContain(' — ');
  });
});
