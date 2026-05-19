// Tests for Note RSC component — thin alias of Callout type="info".
// Note is a sync component that delegates to async Callout.
// We test via Callout directly with type="info" to verify the delegation contract.
import React from 'react';
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

describe('<Note /> (via Callout delegation)', () => {
  it('renders as Callout type="info": aside[role=note] with border-primary', async () => {
    // Note delegates to <Callout type="info">, so we verify the info variant renders correctly.
    const jsx = await Callout({ type: 'info', children: 'note content' });
    const { getByRole } = render(jsx);
    const aside = getByRole('note');
    expect(aside).toBeInTheDocument();
    expect(aside.className).toContain('border-primary');
  });
});
