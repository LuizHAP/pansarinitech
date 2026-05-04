// src/lib/mdx/schema.test.ts — Phase 01 Plan 02 (100% coverage on MDX frontmatter Zod schemas)
import { describe, expect, it } from 'vitest';
import { BlogFrontmatter, ProjectFrontmatter } from './schema';

describe('ProjectFrontmatter', () => {
  const baseInput = {
    title: 'My Project',
    role: 'Lead Engineer',
    year: 2024,
    stack: ['Next.js'],
    blurb: 'A'.repeat(20),
    heroImage: '/img.png',
  };

  it('applies defaults when optional fields are omitted', () => {
    const parsed = ProjectFrontmatter.parse(baseInput);
    expect(parsed.tags).toEqual([]);
    expect(parsed.featured).toBe(true);
    expect(parsed.order).toBe(99);
  });

  it('respects explicit overrides for defaults', () => {
    const parsed = ProjectFrontmatter.parse({
      ...baseInput,
      tags: ['ts'],
      featured: false,
      order: 1,
    });
    expect(parsed.tags).toEqual(['ts']);
    expect(parsed.featured).toBe(false);
    expect(parsed.order).toBe(1);
  });

  it('rejects year = 2017 (below min 2018)', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, year: 2017 }).success).toBe(false);
  });

  it('rejects year = 2031 (above max 2030)', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, year: 2031 }).success).toBe(false);
  });

  it('rejects year = 2020.5 (not an integer)', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, year: 2020.5 }).success).toBe(false);
  });

  it('rejects stack = [] (covers .min(1))', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, stack: [] }).success).toBe(false);
  });

  it('rejects stack containing an empty string (inner .min(1))', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, stack: [''] }).success).toBe(false);
  });

  it('rejects blurb with 19 chars (below min 20)', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, blurb: 'A'.repeat(19) }).success).toBe(
      false,
    );
  });

  it('rejects blurb with 281 chars (above max 280)', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, blurb: 'A'.repeat(281) }).success).toBe(
      false,
    );
  });

  it('rejects title = empty string (covers .min(1))', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, title: '' }).success).toBe(false);
  });

  it('rejects role = empty string (covers .min(1))', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, role: '' }).success).toBe(false);
  });

  it('rejects heroImage = empty string (covers .min(1))', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, heroImage: '' }).success).toBe(false);
  });

  it('accepts year at boundary values 2018 and 2030', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, year: 2018 }).success).toBe(true);
    expect(ProjectFrontmatter.safeParse({ ...baseInput, year: 2030 }).success).toBe(true);
  });

  it('accepts order = 1 (at min(1))', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, order: 1 }).success).toBe(true);
  });

  it('rejects order = 0 (below min(1))', () => {
    expect(ProjectFrontmatter.safeParse({ ...baseInput, order: 0 }).success).toBe(false);
  });
});

describe('BlogFrontmatter', () => {
  const baseInput = {
    title: 'Hello Blog',
    date: '2026-05-03',
    excerpt: 'A'.repeat(50),
  };

  it('applies defaults: tags=[] and draft=false', () => {
    const parsed = BlogFrontmatter.parse(baseInput);
    expect(parsed.tags).toEqual([]);
    expect(parsed.draft).toBe(false);
  });

  it('accepts draft: true and explicit tags', () => {
    const parsed = BlogFrontmatter.parse({ ...baseInput, draft: true, tags: ['x'] });
    expect(parsed.draft).toBe(true);
    expect(parsed.tags).toEqual(['x']);
  });

  it("rejects date = '2026-5-3' (regex fail — not zero-padded)", () => {
    expect(BlogFrontmatter.safeParse({ ...baseInput, date: '2026-5-3' }).success).toBe(false);
  });

  it("rejects date = '2026-05' (missing day)", () => {
    expect(BlogFrontmatter.safeParse({ ...baseInput, date: '2026-05' }).success).toBe(false);
  });

  it('rejects excerpt with 39 chars (below min 40)', () => {
    expect(BlogFrontmatter.safeParse({ ...baseInput, excerpt: 'A'.repeat(39) }).success).toBe(
      false,
    );
  });

  it('rejects excerpt with 281 chars (above max 280)', () => {
    expect(BlogFrontmatter.safeParse({ ...baseInput, excerpt: 'A'.repeat(281) }).success).toBe(
      false,
    );
  });

  it('rejects title = empty string (covers .min(1))', () => {
    expect(BlogFrontmatter.safeParse({ ...baseInput, title: '' }).success).toBe(false);
  });

  it('accepts excerpt at exactly boundary values 40 and 280', () => {
    expect(BlogFrontmatter.safeParse({ ...baseInput, excerpt: 'A'.repeat(40) }).success).toBe(true);
    expect(BlogFrontmatter.safeParse({ ...baseInput, excerpt: 'A'.repeat(280) }).success).toBe(
      true,
    );
  });
});
