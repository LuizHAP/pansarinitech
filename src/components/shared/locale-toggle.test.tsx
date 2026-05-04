import { render, screen } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';

// locale-toggle-action is a Server Action ('use server') — mock it so jsdom
// does not error trying to import next/headers, next/cookies, etc.
vi.mock('./locale-toggle-action', () => ({
  switchLocale: vi.fn(async () => {}),
}));

import { LocaleToggle } from './locale-toggle';

describe('<LocaleToggle />', () => {
  it('marks EN button with aria-current="page" when locale is en', () => {
    render(<LocaleToggle />, { locale: 'en' });

    const enBtn = screen.getByRole('button', { name: /^EN$/ });
    const ptBtn = screen.getByRole('button', { name: /^PT$/ });

    expect(enBtn).toHaveAttribute('aria-current', 'page');
    expect(ptBtn).not.toHaveAttribute('aria-current');
  });

  it('marks PT button with aria-current="page" when locale is pt', () => {
    render(<LocaleToggle />, { locale: 'pt' });

    const ptBtn = screen.getByRole('button', { name: /^PT$/ });
    const enBtn = screen.getByRole('button', { name: /^EN$/ });

    expect(ptBtn).toHaveAttribute('aria-current', 'page');
    expect(enBtn).not.toHaveAttribute('aria-current');
  });

  it('renders the form with an accessible label', () => {
    render(<LocaleToggle />, { locale: 'en' });

    // form has aria-label from the "localeToggle.label" message key
    const form = screen.getByRole('form', { name: /Switch language/i });
    expect(form).toBeInTheDocument();
  });
});
