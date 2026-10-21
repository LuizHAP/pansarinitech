import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

function ruleBody(css: string, selector: string): string | null {
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(ruleRe)) {
    const selectors = match[1].split(',').map((s) => s.trim());
    if (selectors.includes(selector)) return match[2];
  }
  return null;
}

function declaredVariables(body: string): Set<string> {
  return new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
}

describe('public surface tokens', () => {
  const rootBody = ruleBody(CSS, ':root');
  const rootVars = declaredVariables(rootBody ?? '');

  it('reads the :root token set', () => {
    expect(rootBody).not.toBeNull();
    expect(rootVars.size).toBe(17);
  });

  it.each(['html.site', '.surface-ink', '.surface-paper', '.surface-accent'])(
    '%s declares every :root variable plus its own background and colour',
    (selector) => {
      const body = ruleBody(CSS, selector);
      expect(body, `${selector} rule not found in globals.css`).not.toBeNull();
      const declared = declaredVariables(body ?? '');
      const missing = [...rootVars].filter((name) => !declared.has(name));
      expect(missing, `${selector} is missing ${missing.join(', ')}`).toEqual([]);
      expect(body).toMatch(/background-color:\s*var\(--background\)/);
      expect(body).toMatch(/(^|[;\s])color:\s*var\(--foreground\)/);
    },
  );
});
