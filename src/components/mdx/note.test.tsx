// Tests for Note RSC component — thin alias of Callout type="info".
// Note is a sync function that returns JSX calling Callout. We invoke Note() to register
// its coverage, then extract the resolved Callout JSX for rendering via RTL.
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    if (key === 'callout.info') return 'Note:';
    if (key === 'callout.warn') return 'Warning:';
    if (key === 'callout.error') return 'Error:';
    return key;
  }),
}));

import { render } from '@testing-library/react';
import { Callout } from './callout';
import { Note } from './note';

describe('<Note />', () => {
  it('returns Callout type="info" element: aside[role=note] with border-primary', async () => {
    // Note() invokes the component function, registering coverage for note.tsx.
    // It returns a React element whose type is Callout. We then call Callout directly
    // (same as callout.test.tsx pattern) to get the renderable async JSX.
    const noteElement = Note({ children: 'note content' }) as React.ReactElement<{
      type: string;
      children: React.ReactNode;
    }>;
    expect(noteElement.type).toBe(Callout);
    expect(noteElement.props.type).toBe('info');

    // Verify the delegation renders the correct Callout variant.
    const jsx = await Callout({ type: 'info', children: 'note content' });
    const { getByRole } = render(jsx);
    const aside = getByRole('note');
    expect(aside).toBeInTheDocument();
    expect(aside.className).toContain('border-primary');
  });
});
