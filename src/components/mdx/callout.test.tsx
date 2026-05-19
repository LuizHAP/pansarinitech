// Tests for Callout async RSC component.
// Mocks next-intl/server so getTranslations resolves synchronously in jsdom.
// Each test awaits the async Callout function and passes the returned JSX to RTL render().
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

describe('<Callout />', () => {
  it('type=info: renders aside[role=note] with border-primary and "Note:" label', async () => {
    const jsx = await Callout({ type: 'info', children: 'info content' });
    const { getByRole, getByText } = render(jsx);
    const aside = getByRole('note');
    expect(aside).toBeInTheDocument();
    expect(aside.className).toContain('border-primary');
    expect(getByText('Note:')).toBeInTheDocument();
  });

  it('type=warn: renders aside with border-yellow-500 and "Warning:" label', async () => {
    const jsx = await Callout({ type: 'warn', children: 'warn content' });
    const { getByRole, getByText } = render(jsx);
    const aside = getByRole('note');
    expect(aside).toBeInTheDocument();
    expect(aside.className).toContain('border-yellow-500');
    expect(getByText('Warning:')).toBeInTheDocument();
  });

  it('type=error: renders aside with border-destructive and "Error:" label', async () => {
    const jsx = await Callout({ type: 'error', children: 'error content' });
    const { getByRole, getByText } = render(jsx);
    const aside = getByRole('note');
    expect(aside).toBeInTheDocument();
    expect(aside.className).toContain('border-destructive');
    expect(getByText('Error:')).toBeInTheDocument();
  });

  it('explicit label overrides i18n key', async () => {
    const jsx = await Callout({ type: 'info', label: 'Custom label', children: 'content' });
    const { getByText, queryByText } = render(jsx);
    expect(getByText('Custom label')).toBeInTheDocument();
    expect(queryByText('Note:')).toBeNull();
  });
});
