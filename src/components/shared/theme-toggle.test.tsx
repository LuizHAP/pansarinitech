import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';

describe('<ThemeToggle />', () => {
  it('renders a toggle button with aria-label and aria-pressed=false in light theme', () => {
    render(<ThemeToggle />, { theme: 'light' });

    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Toggle theme');
    // resolvedTheme='light' → isDark=false → aria-pressed=false
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders aria-pressed=true when theme is dark', () => {
    render(<ThemeToggle />, { theme: 'dark' });

    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('falls through the no-VT branch under jsdom and toggles html.dark class', async () => {
    // jsdom does not implement document.startViewTransition, so the component
    // falls through to plain setTheme(next). next-themes flips html.dark on call.
    render(<ThemeToggle />, { theme: 'light' });
    const user = userEvent.setup();

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByRole('button'));

    // next-themes attribute="class" — after click, dark class should be set
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('PT locale renders the correct aria-label from messages', () => {
    render(<ThemeToggle />, { locale: 'pt', theme: 'light' });

    const btn = screen.getByRole('button');
    // pt message is "Alternar tema"
    expect(btn).toHaveAttribute('aria-label', 'Alternar tema');
  });

  it('calls startViewTransition when available and reduced-motion is off', async () => {
    // Stub document.startViewTransition so the component takes the VT branch
    const startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
      };
    });
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: startViewTransition,
    });

    // Override matchMedia to say prefers-reduced-motion: no-preference (not reduce)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList => ({
        matches: false, // 'reduce' is NOT matched → VT path proceeds
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    render(<ThemeToggle />, { theme: 'light' });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    expect(startViewTransition).toHaveBeenCalledOnce();

    // Restore: remove startViewTransition so other tests stay in no-VT path
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: undefined,
    });
  });
});
