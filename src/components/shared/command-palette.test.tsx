// src/components/shared/command-palette.test.tsx
// Vitest + RTL tests for CommandPalette behavior (Phase 01 UX-01 to UX-07).
import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock locale-toggle-action (Server Action — 'use server') so jsdom doesn't
// error trying to import next/headers, next/cookies, etc.
vi.mock('./locale-toggle-action', () => ({
  switchLocale: vi.fn(async () => {}),
}));

// Mock @/lib/i18n/navigation to provide a test-friendly useRouter.
// We use a module-level pushMock so the Blog test can assert on the same instance.
const pushMock = vi.fn();

vi.mock('@/lib/i18n/navigation', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/i18n/navigation')>('@/lib/i18n/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

import { CommandPaletteRoot } from './command-palette';
// Must import after mocks are declared
import { switchLocale } from './locale-toggle-action';

// Note: Element.prototype.scrollIntoView stub is defined in vitest.setup.ts
// (cmdk calls scrollIntoView internally — jsdom doesn't implement it).

describe('<CommandPaletteRoot />', () => {
  beforeEach(() => {
    // Spy on scrollIntoView — wrap the stub we defined above
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    // Spy on window.open — set a no-op implementation
    vi.spyOn(window, 'open').mockImplementation(() => null);
    // Reset the push mock between tests
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Open / Close
  // -------------------------------------------------------------------------

  it('opens palette via Cmd+K (Meta+k) keyboard shortcut', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens palette via Ctrl+K keyboard shortcut', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('toggles palette closed via Cmd+K when already open', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    // Open
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close via toggle
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens palette by clicking the trigger button', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    const trigger = screen.getByRole('button', { name: /open command palette/i });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('trigger button has correct aria-label from translation (EN)', () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    expect(screen.getByRole('button', { name: 'Open command palette' })).toBeInTheDocument();
  });

  it('trigger button has correct aria-label in PT locale', () => {
    render(<CommandPaletteRoot />, { locale: 'pt' });
    expect(screen.getByRole('button', { name: 'Abrir painel de comandos' })).toBeInTheDocument();
  });

  it('closes palette via Escape key', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Command groups + items rendered
  // -------------------------------------------------------------------------

  it('renders three group headings when palette is open', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');

    expect(screen.getByText('Navigate to')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
  });

  it('renders three group headings in PT locale', async () => {
    render(<CommandPaletteRoot />, { locale: 'pt' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');

    expect(screen.getByText('Navegar para')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
  });

  it('renders all 14 command items when palette is open (EN)', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();
    await user.keyboard('{Meta>}k{/Meta}');

    // 7 navigate items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Career')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    // 3 action items
    expect(screen.getByText('Toggle theme — Jedi (light) / Sith (dark)')).toBeInTheDocument();
    expect(screen.getByText('Switch to Portuguese')).toBeInTheDocument();
    expect(screen.getByText('Switch to English')).toBeInTheDocument();
    // 4 link items
    expect(screen.getByText('Resume — PT (PDF)')).toBeInTheDocument();
    expect(screen.getByText('Resume — EN (PDF)')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn profile')).toBeInTheDocument();
    expect(screen.getByText('GitHub profile')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Theme command
  // -------------------------------------------------------------------------

  it('theme command closes dialog then toggles dark class (light → dark)', async () => {
    render(<CommandPaletteRoot />, { locale: 'en', theme: 'light' });
    const user = userEvent.setup();

    // Verify no dark class initially
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const themeItem = screen.getByText('Toggle theme — Jedi (light) / Sith (dark)');
    await user.click(themeItem);

    // Dialog should be closed immediately
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // After requestAnimationFrame, dark class should be set
    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('theme command closes dialog then toggles dark class (dark → light)', async () => {
    render(<CommandPaletteRoot />, { locale: 'en', theme: 'dark' });
    const user = userEvent.setup();

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.keyboard('{Meta>}k{/Meta}');
    const themeItem = screen.getByText('Toggle theme — Jedi (light) / Sith (dark)');
    await user.click(themeItem);

    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Locale commands
  // -------------------------------------------------------------------------

  it('Switch to Portuguese calls switchLocale("pt")', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('Switch to Portuguese'));

    await vi.waitFor(() => {
      expect(switchLocale).toHaveBeenCalledWith('pt');
    });
  });

  it('Switch to English calls switchLocale("en")', async () => {
    render(<CommandPaletteRoot />, { locale: 'pt' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('Trocar para Inglês'));

    await vi.waitFor(() => {
      expect(switchLocale).toHaveBeenCalledWith('en');
    });
  });

  it('both locale commands are visible regardless of current locale (D-07)', async () => {
    // EN locale — both EN and PT options visible
    const { unmount } = render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByText('Switch to Portuguese')).toBeInTheDocument();
    expect(screen.getByText('Switch to English')).toBeInTheDocument();
    unmount();

    // PT locale — both options still visible
    render(<CommandPaletteRoot />, { locale: 'pt' });
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByText('Trocar para Português')).toBeInTheDocument();
    expect(screen.getByText('Trocar para Inglês')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Blog navigation
  // -------------------------------------------------------------------------

  it('Blog command calls router.push("/blog")', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('Blog'));

    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/blog');
    });
  });

  // -------------------------------------------------------------------------
  // Navigate scroll commands
  // -------------------------------------------------------------------------

  it('About command calls scrollIntoView with behavior: smooth', async () => {
    const aboutEl = document.createElement('section');
    aboutEl.id = 'about';
    document.body.appendChild(aboutEl);

    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('About'));

    await vi.waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: expect.stringMatching(/smooth|auto/) }),
      );
    });

    document.body.removeChild(aboutEl);
  });

  it('Home command scrolls to #hero section', async () => {
    const heroEl = document.createElement('section');
    heroEl.id = 'hero';
    document.body.appendChild(heroEl);

    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('Home'));

    await vi.waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: expect.stringMatching(/smooth|auto/) }),
      );
    });

    document.body.removeChild(heroEl);
  });

  // -------------------------------------------------------------------------
  // Link commands
  // -------------------------------------------------------------------------

  it('Resume PT command calls window.open with PT resume URL and noopener', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('Resume — PT (PDF)'));

    await vi.waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        '/Luiz-Pansarini_Curriculo.pdf',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  it('Resume EN command calls window.open with EN resume URL and noopener', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('Resume — EN (PDF)'));

    await vi.waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        '/Luiz-Pansarini_Resume.pdf',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  it('LinkedIn command calls window.open with LinkedIn URL and noopener', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('LinkedIn profile'));

    await vi.waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'https://linkedin.com/in/luizpansarini',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  it('GitHub command calls window.open with GitHub URL and noopener', async () => {
    render(<CommandPaletteRoot />, { locale: 'en' });
    const user = userEvent.setup();

    await user.keyboard('{Meta>}k{/Meta}');
    await user.click(screen.getByText('GitHub profile'));

    await vi.waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'https://github.com/LuizHAP',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });
});
