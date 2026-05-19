// Tests for CodeFilename async RSC component.
// Mocks next-intl/server so getTranslations resolves synchronously in jsdom.
// Follows the same vi.mock + await-then-render pattern as callout.test.tsx.
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    if (key === 'codeFilename.ariaPrefix') return 'File';
    return key;
  }),
}));

import { render } from '@testing-library/react';
import { CodeFilename } from './code-filename';

describe('<CodeFilename />', () => {
  it('renders filename string in the filename bar', async () => {
    const jsx = await CodeFilename({
      filename: 'src/app/page.tsx',
      children: React.createElement('pre', null, 'code'),
    });
    const { getByText } = render(jsx);
    expect(getByText('src/app/page.tsx')).toBeInTheDocument();
  });

  it('renders FileIcon as aria-hidden svg', async () => {
    const jsx = await CodeFilename({
      filename: 'src/app/page.tsx',
      children: React.createElement('pre', null, 'code'),
    });
    const { container } = render(jsx);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).not.toBeNull();
  });

  it('outer div has aria-label with translated prefix and filename', async () => {
    const jsx = await CodeFilename({
      filename: 'src/app/page.tsx',
      children: React.createElement('pre', null, 'code'),
    });
    const { container } = render(jsx);
    const outer = container.firstChild as HTMLElement;
    expect(outer.getAttribute('aria-label')).toBe('File: src/app/page.tsx');
  });

  it('renders children inside the container', async () => {
    const jsx = await CodeFilename({
      filename: 'src/app/page.tsx',
      children: React.createElement('pre', { 'data-testid': 'child-pre' }, 'code'),
    });
    const { getByTestId } = render(jsx);
    expect(getByTestId('child-pre')).toBeInTheDocument();
  });
});
