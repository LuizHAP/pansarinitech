import { Toaster } from '@/components/ui';
import { fireEvent, render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EasterEgg } from './easter-egg';

function rippleCounter() {
  let count = 0;
  const listener = () => {
    count += 1;
  };
  window.addEventListener('pansarini:ripple', listener);
  return {
    get count() {
      return count;
    },
    stop: () => window.removeEventListener('pansarini:ripple', listener),
  };
}

describe('<EasterEgg />', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('typing whoami fires a ripple and shows the localized whoami toast', async () => {
    const ripples = rippleCounter();
    render(
      <>
        <EasterEgg />
        <Toaster />
      </>,
      { locale: 'en' },
    );
    const user = userEvent.setup();

    await user.keyboard('whoami');

    expect(ripples.count).toBe(1);
    expect(
      await screen.findByText('luiz pansarini · principal software engineer · brazil → global'),
    ).toBeInTheDocument();
    ripples.stop();
  });

  it('shows the Portuguese line in pt', async () => {
    render(
      <>
        <EasterEgg />
        <Toaster />
      </>,
      { locale: 'pt' },
    );
    const user = userEvent.setup();

    await user.keyboard('WHOAMI');

    expect(
      await screen.findByText('luiz pansarini · principal software engineer · brasil → mundo'),
    ).toBeInTheDocument();
  });

  it('ignores the sequence typed inside inputs, textareas and contenteditable', async () => {
    const ripples = rippleCounter();
    render(
      <>
        <EasterEgg />
        <input aria-label="search" />
        <textarea aria-label="notes" />
        <div contentEditable suppressContentEditableWarning data-testid="editable" />
      </>,
      { locale: 'en' },
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('search'), 'whoami');
    await user.type(screen.getByLabelText('notes'), 'whoami');
    for (const key of 'whoami') fireEvent.keyDown(screen.getByTestId('editable'), { key });

    expect(ripples.count).toBe(0);
    ripples.stop();
  });

  it('ignores keys pressed with modifiers', () => {
    const ripples = rippleCounter();
    render(<EasterEgg />, { locale: 'en' });

    for (const key of 'whoami') fireEvent.keyDown(document, { key, ctrlKey: true });

    expect(ripples.count).toBe(0);
    ripples.stop();
  });

  it('never prevents Ctrl+R or Cmd+R reloads', () => {
    render(<EasterEgg />, { locale: 'en' });

    for (const init of [
      { key: 'r', metaKey: true },
      { key: 'r', ctrlKey: true },
      { key: 'R', ctrlKey: true, shiftKey: true },
    ]) {
      const event = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('prints no console banner outside production', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<EasterEgg />, { locale: 'en' });

    expect(log).not.toHaveBeenCalled();
  });

  it('prints a terminal banner in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { container } = render(<EasterEgg />, { locale: 'en' });

    expect(container.querySelector('#easter-egg')).toBeNull();
    expect(log).toHaveBeenCalledTimes(1);
    const [format, style, message] = log.mock.calls[0];
    expect(format).toBe('%c%s');
    expect(style).toContain('#8F96FF');
    expect(message).toBe(
      [
        '> whoami',
        'luiz pansarini, principal software engineer',
        '$ git clone github.com/LuizHAP/pansarinitech',
      ].join('\n'),
    );
  });
});
