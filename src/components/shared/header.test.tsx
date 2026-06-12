import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// locale-toggle-action is a Server Action ('use server') — mock it for jsdom
vi.mock('./locale-toggle-action', () => ({
  switchLocale: vi.fn(async () => {}),
}));

// @/lib/i18n/navigation is needed by CommandPaletteRoot (useRouter for Blog command)
vi.mock('@/lib/i18n/navigation', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/i18n/navigation')>('@/lib/i18n/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

// Mock the deferred command palette to render the real component in tests.
// In production, ssr:false defers hydration until user interaction.
// In jsdom tests, we need the component to render immediately.
vi.mock('./deferred-command-palette', async () => {
  const { CommandPaletteRoot } = await import('./command-palette');
  return { CommandPaletteRoot };
});

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

  it('renders the command palette trigger button between locale and theme toggles', () => {
    render(<Header />, { locale: 'en' });

    const trigger = screen.getByRole('button', { name: /open command palette/i });
    expect(trigger).toBeInTheDocument();
  });

  it('clicking the palette trigger opens the command palette dialog', async () => {
    render(<Header />, { locale: 'en' });
    const user = userEvent.setup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: /open command palette/i });
    await user.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('trigger appears after locale toggle and before theme toggle in DOM order', () => {
    render(<Header />, { locale: 'en' });

    const allButtons = screen.getAllByRole('button');
    const localeEnIdx = allButtons.findIndex((b) => b.textContent?.trim() === 'EN');
    const localeCtrlIdx = allButtons.findIndex((b) =>
      /switch language/i.test(b.getAttribute('aria-label') ?? ''),
    );
    const triggerIdx = allButtons.findIndex((b) =>
      /open command palette/i.test(b.getAttribute('aria-label') ?? ''),
    );
    const themeIdx = allButtons.findIndex((b) =>
      /toggle theme/i.test(b.getAttribute('aria-label') ?? ''),
    );

    // LocaleToggle buttons appear before the palette trigger
    expect(Math.max(localeEnIdx, localeCtrlIdx)).toBeLessThan(triggerIdx);
    // Palette trigger appears before the theme toggle
    expect(triggerIdx).toBeLessThan(themeIdx);
  });
});
