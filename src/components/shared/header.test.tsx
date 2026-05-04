import { render, screen } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';

// locale-toggle-action is a Server Action ('use server') — mock it for jsdom
vi.mock('./locale-toggle-action', () => ({
  switchLocale: vi.fn(async () => {}),
}));

import { Header } from './header';

describe('<Header />', () => {
  it('renders the brand link pointing to home', () => {
    render(<Header />, { locale: 'en' });

    // Brand link has aria-label "Luiz Pansarini — home"
    const brandLink = screen.getByRole('link', { name: /Luiz Pansarini/i });
    expect(brandLink).toBeInTheDocument();
    // The Link from next-intl prepends the locale; href will be /en
    expect(brandLink.getAttribute('href')).toMatch(/^\/(en|pt)?/);
  });

  it('renders the locale toggle buttons (PT and EN)', () => {
    render(<Header />, { locale: 'en' });

    expect(screen.getByRole('button', { name: /^EN$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^PT$/ })).toBeInTheDocument();
  });

  it('renders the theme toggle button', () => {
    render(<Header />, { locale: 'en' });

    // ThemeToggle renders a button with aria-label "Toggle theme"
    const themeBtn = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeBtn).toBeInTheDocument();
    expect(themeBtn).toHaveAttribute('aria-pressed');
  });
});
