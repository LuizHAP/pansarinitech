// Tests for Warning RSC component — thin alias of Callout type="warn".
// Warning is a sync function that returns JSX calling Callout. We invoke Warning() to register
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
import { Warning } from './warning';

describe('<Warning />', () => {
  it('returns Callout type="warn" element: aside[role=note] with border-yellow-500', async () => {
    // Warning() invokes the component function, registering coverage for warning.tsx.
    // It returns a React element whose type is Callout. We then call Callout directly
    // (same as callout.test.tsx pattern) to get the renderable async JSX.
    const warningElement = Warning({ children: 'warn content' }) as React.ReactElement<{
      type: string;
      children: React.ReactNode;
    }>;
    expect(warningElement.type).toBe(Callout);
    expect(warningElement.props.type).toBe('warn');

    // Verify the delegation renders the correct Callout variant.
    const jsx = await Callout({ type: 'warn', children: 'warn content' });
    const { getByRole } = render(jsx);
    const aside = getByRole('note');
    expect(aside).toBeInTheDocument();
    expect(aside.className).toContain('border-yellow-500');
  });
});
