import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createMdxLoader } from './factory';

const { compileMDX } = vi.hoisted(() => ({
  compileMDX: vi.fn(),
}));

vi.mock('next-mdx-remote/rsc', () => ({ compileMDX }));

const frontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
});

const validPost = `---
title: "Valid post"
date: "2026-11-05"
---

{this is deliberately invalid MDX
`;

const invalidFrontmatterPost = `---
title: ""
date: "2026-11-05"
---

Body
`;

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  compileMDX.mockReset();
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('createMdxLoader().getAll()', () => {
  it('reads only frontmatter and skips an invalid post without compiling MDX', async () => {
    const contentDir = await mkdtemp(join(tmpdir(), 'mdx-frontmatter-'));
    temporaryDirectories.push(contentDir);

    await Promise.all([
      writeFile(join(contentDir, 'valid.en.mdx'), validPost),
      writeFile(join(contentDir, 'valid.pt.mdx'), validPost),
      writeFile(join(contentDir, 'invalid.en.mdx'), invalidFrontmatterPost),
      writeFile(join(contentDir, 'invalid.pt.mdx'), invalidFrontmatterPost),
      writeFile(join(contentDir, 'missing.pt.mdx'), validPost),
    ]);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const loader = createMdxLoader({
      contentDir,
      schema: frontmatterSchema,
      kind: 'posts',
    });

    await expect(loader.getAll('en')).resolves.toEqual([
      expect.objectContaining({ slug: 'valid', title: 'Valid post' }),
    ]);
    expect(compileMDX).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Skipping content/blog/invalid.en.mdx'),
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Skipping content/blog/missing.en.mdx: locale file is missing'),
    );
  });
});
