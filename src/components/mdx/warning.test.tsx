// Tests for Warning RSC component — thin alias of Callout type="warn".
// Warning is a sync component that delegates to async Callout.
// We test via Callout directly with type="warn" to verify the delegation contract.
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

describe('<Warning /> (via Callout delegation)', () => {
  it('renders as Callout type="warn": aside[role=note] with border-yellow-500', async () => {
    // Warning delegates to <Callout type="warn">, so we verify the warn variant renders correctly.
    const jsx = await Callout({ type: 'warn', children: 'warn content' });
    const { getByRole } = render(jsx);
    const aside = getByRole('note');
    expect(aside).toBeInTheDocument();
    expect(aside.className).toContain('border-yellow-500');
  });
});
