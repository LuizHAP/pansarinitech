import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaletteHint } from './palette-hint';

const LABEL = 'open the command palette';
const ARIA = 'Open the command palette (Ctrl or Cmd + K)';

function mockPlatform(platform: string) {
  return vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
}

function keycapGroup() {
  return screen.getByRole('button').querySelector('.group') as HTMLElement;
}

describe('<PaletteHint />', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('server-renders Ctrl and swaps to the command glyph on Apple platforms after mount', () => {
    mockPlatform('MacIntel');
    expect(renderToString(<PaletteHint label={LABEL} ariaLabel={ARIA} />)).toContain('Ctrl');

    render(<PaletteHint label={LABEL} ariaLabel={ARIA} />);
    expect(screen.getByRole('button')).toHaveTextContent('⌘');
    expect(screen.getByRole('button')).not.toHaveTextContent('Ctrl');
  });

  it('keeps Ctrl on other platforms', () => {
    mockPlatform('Win32');
    render(<PaletteHint label={LABEL} ariaLabel={ARIA} />);

    expect(screen.getByRole('button')).toHaveTextContent('Ctrl');
  });

  it('exposes the aria label as its name and shows the visible label', () => {
    render(<PaletteHint label={LABEL} ariaLabel={ARIA} />);

    const button = screen.getByRole('button', { name: ARIA });
    expect(button).toHaveTextContent(LABEL);
  });

  it('dispatches the palette event once on click', () => {
    const listener = vi.fn();
    window.addEventListener('pansarini:palette', listener);
    render(<PaletteHint label={LABEL} ariaLabel={ARIA} />);

    fireEvent.click(screen.getByRole('button', { name: ARIA }));

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('pansarini:palette', listener);
  });

  it.each([{ metaKey: true }, { ctrlKey: true }])(
    'presses the keycaps for 160ms on %o + K without preventing the default',
    (modifier) => {
      vi.useFakeTimers();
      render(<PaletteHint label={LABEL} ariaLabel={ARIA} />);
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        cancelable: true,
        bubbles: true,
        ...modifier,
      });

      act(() => {
        document.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(false);
      expect(keycapGroup()).toHaveAttribute('data-pressed', 'true');

      act(() => {
        vi.advanceTimersByTime(159);
      });
      expect(keycapGroup()).toHaveAttribute('data-pressed', 'true');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(keycapGroup()).not.toHaveAttribute('data-pressed');
    },
  );

  it('ignores K without a modifier and other shortcuts', () => {
    render(<PaletteHint label={LABEL} ariaLabel={ARIA} />);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true }));
    });
    expect(keycapGroup()).not.toHaveAttribute('data-pressed');
  });
});
