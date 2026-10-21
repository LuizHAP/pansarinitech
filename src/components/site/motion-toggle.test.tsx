import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotionToggle } from './motion-toggle';

function motionEvents() {
  const details: { paused: boolean }[] = [];
  const listener = (event: Event) => details.push((event as CustomEvent).detail);
  window.addEventListener('pansarini:motion', listener);
  return { details, stop: () => window.removeEventListener('pansarini:motion', listener) };
}

describe('<MotionToggle />', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    delete document.documentElement.dataset.motion;
  });

  it('starts running with a fixed English name', () => {
    render(<MotionToggle />, { locale: 'en' });

    const button = screen.getByRole('button', { name: 'Pause animations' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.dataset.motion).toBeUndefined();
  });

  it('uses the Portuguese name in pt', () => {
    render(<MotionToggle />, { locale: 'pt' });

    expect(screen.getByRole('button', { name: 'Pausar animações' })).toBeInTheDocument();
  });

  it('pauses and resumes, persisting and broadcasting the state while the name stays fixed', async () => {
    const events = motionEvents();
    render(<MotionToggle />, { locale: 'en' });
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'Pause animations' });

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAccessibleName('Pause animations');
    expect(document.documentElement.dataset.motion).toBe('paused');
    expect(window.localStorage.getItem('pansarini:motion')).toBe('paused');
    expect(events.details).toEqual([{ paused: true }]);

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAccessibleName('Pause animations');
    expect(document.documentElement.dataset.motion).toBeUndefined();
    expect(window.localStorage.getItem('pansarini:motion')).toBeNull();
    expect(events.details).toEqual([{ paused: true }, { paused: false }]);
    events.stop();
  });

  it('restores a stored paused state on mount', () => {
    window.localStorage.setItem('pansarini:motion', 'paused');
    render(<MotionToggle />, { locale: 'en' });

    expect(screen.getByRole('button', { name: 'Pause animations' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.documentElement.dataset.motion).toBe('paused');
  });

  it('still pauses and resumes when site storage is blocked', async () => {
    const blocked = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(blocked);
    const events = motionEvents();
    render(<MotionToggle />, { locale: 'en' });
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'Pause animations' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.motion).toBe('paused');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.dataset.motion).toBeUndefined();
    expect(events.details).toEqual([{ paused: true }, { paused: false }]);
    events.stop();
  });

  it('treats any other stored value as running', () => {
    window.localStorage.setItem('pansarini:motion', '"><img src=x onerror=alert(1)>');
    render(<MotionToggle />, { locale: 'en' });

    expect(screen.getByRole('button', { name: 'Pause animations' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(document.documentElement.dataset.motion).toBeUndefined();
  });
});
