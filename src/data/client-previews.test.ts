import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clientPreviews, getClientPreview } from './client-previews';

describe('clientPreviews registry', () => {
  it('has unique slugs', () => {
    const slugs = clientPreviews.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses only lowercase letters, digits and hyphens in slugs', () => {
    for (const { slug } of clientPreviews) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('has an index.html on disk for every entry', () => {
    for (const { slug } of clientPreviews) {
      const file = join(process.cwd(), 'public', 'client-previews', slug, 'index.html');
      expect(existsSync(file), `missing ${file}`).toBe(true);
    }
  });
});

describe('getClientPreview', () => {
  it('returns undefined for an unknown slug', () => {
    expect(getClientPreview('does-not-exist')).toBeUndefined();
  });
});
