import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeLocale } from './change-locale';

describe('changeLocale()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('writes the locale cookie, then reloads the page', () => {
    const calls: string[] = [];
    vi.spyOn(document, 'cookie', 'set').mockImplementation((value) => {
      calls.push(`cookie:${value}`);
    });
    vi.stubGlobal('location', { reload: () => calls.push('reload') });

    changeLocale('pt');

    expect(calls).toEqual([
      'cookie:NEXT_LOCALE=pt; path=/; max-age=31536000; samesite=lax; secure',
      'reload',
    ]);
  });
});
