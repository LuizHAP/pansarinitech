import { render, screen, within } from '@/test/render';
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
  it('renders the terminal logo as the home link with the localized name', () => {
    render(<Header />, { locale: 'en' });

    const brandLink = screen.getByRole('link', { name: 'Luiz Pansarini — home' });
    expect(brandLink).toHaveAttribute('href', '/en');
    expect(brandLink).toHaveTextContent('>pansarini');
    expect(brandLink.querySelector('img')).toBeNull();
  });

  it('renders the localized nav links and contact CTA', () => {
    render(<Header />, { locale: 'pt' });

    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'projetos' })).toHaveAttribute(
      'href',
      '/pt/projects',
    );
    expect(within(nav).getByRole('link', { name: 'blog' })).toHaveAttribute('href', '/pt/blog');
    expect(within(nav).getByRole('link', { name: 'agora' })).toHaveAttribute('href', '/pt/now');
    expect(screen.getByRole('link', { name: 'contato' })).toHaveAttribute('href', '/pt#contact');
  });

  it('renders the locale toggle buttons (PT and EN)', () => {
    render(<Header />, { locale: 'en' });

    expect(screen.getByRole('button', { name: /^EN$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^PT$/ })).toBeInTheDocument();
  });

  it('renders the pause-motion toggle and no theme toggle', () => {
    render(<Header />, { locale: 'en' });

    const motion = screen.getByRole('button', { name: 'Pause animations' });
    expect(motion).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: /theme/i })).not.toBeInTheDocument();
  });

  it('clicking the palette trigger opens the command palette dialog', async () => {
    render(<Header />, { locale: 'en' });
    const user = userEvent.setup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open command palette/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('orders the controls locale toggle, palette trigger, motion toggle', () => {
    render(<Header />, { locale: 'en' });

    const allButtons = screen.getAllByRole('button');
    const localeIdx = allButtons.findIndex((b) => b.textContent?.trim() === 'EN');
    const triggerIdx = allButtons.findIndex((b) =>
      /open command palette/i.test(b.getAttribute('aria-label') ?? ''),
    );
    const motionIdx = allButtons.findIndex(
      (b) => b.getAttribute('aria-label') === 'Pause animations',
    );

    expect(localeIdx).toBeGreaterThanOrEqual(0);
    expect(localeIdx).toBeLessThan(triggerIdx);
    expect(triggerIdx).toBeLessThan(motionIdx);
  });
});
