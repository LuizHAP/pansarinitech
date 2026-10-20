import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mountHeroField, dispose } = vi.hoisted(() => {
  const dispose = vi.fn();
  return { dispose, mountHeroField: vi.fn((_el: HTMLElement) => dispose) };
});

vi.mock('./hero-field-scene', () => ({ mountHeroField }));

import { HeroFieldGate } from './hero-field-gate';

const GATE = '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

function mockGate(matches: boolean) {
  const original = window.matchMedia;
  const spy = vi.fn(
    (query: string) => ({ matches: matches && query === GATE, media: query }) as MediaQueryList,
  );
  window.matchMedia = spy as unknown as typeof window.matchMedia;
  return {
    spy,
    restore: () => {
      window.matchMedia = original;
    },
  };
}

function mockIdle() {
  const callbacks: (() => void)[] = [];
  const request = vi.fn((cb: () => void, _options?: IdleRequestOptions) => {
    callbacks.push(cb);
    return callbacks.length;
  });
  const cancel = vi.fn();
  Object.assign(window, { requestIdleCallback: request, cancelIdleCallback: cancel });
  return {
    request,
    cancel,
    flush: () => {
      for (const cb of callbacks.splice(0)) cb();
    },
  };
}

describe('<HeroFieldGate />', () => {
  let gate: ReturnType<typeof mockGate>;

  beforeEach(() => {
    mountHeroField.mockClear();
    mountHeroField.mockImplementation(() => dispose);
    dispose.mockClear();
  });

  afterEach(() => {
    gate.restore();
    Reflect.deleteProperty(window, 'requestIdleCallback');
    Reflect.deleteProperty(window, 'cancelIdleCallback');
    vi.useRealTimers();
  });

  it('renders a decorative container and never loads the scene when the gate fails', async () => {
    gate = mockGate(false);
    const idle = mockIdle();
    const { container } = render(<HeroFieldGate />);

    expect(gate.spy).toHaveBeenCalledWith(GATE);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(idle.request).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mountHeroField).not.toHaveBeenCalled();
  });

  it('mounts the scene once, after idle, into its container and disposes on unmount', async () => {
    gate = mockGate(true);
    const idle = mockIdle();
    const { container, unmount } = render(<HeroFieldGate />);

    expect(mountHeroField).not.toHaveBeenCalled();
    expect(idle.request).toHaveBeenCalledTimes(1);
    expect(idle.request.mock.calls[0][1]).toEqual({ timeout: 2000 });

    idle.flush();
    await waitFor(() => expect(mountHeroField).toHaveBeenCalledTimes(1));
    expect(mountHeroField).toHaveBeenCalledWith(container.firstElementChild);

    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(idle.cancel).toHaveBeenCalled();
  });

  it('waits for the window load event when the document is still loading', async () => {
    gate = mockGate(true);
    const idle = mockIdle();
    const readyState = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    render(<HeroFieldGate />);

    expect(idle.request).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    expect(idle.request).toHaveBeenCalledTimes(1);

    idle.flush();
    await waitFor(() => expect(mountHeroField).toHaveBeenCalledTimes(1));
    readyState.mockRestore();
  });

  it('falls back to a timeout when requestIdleCallback is missing', async () => {
    gate = mockGate(true);
    vi.useFakeTimers();
    render(<HeroFieldGate />);

    expect(mountHeroField).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    vi.useRealTimers();
    await waitFor(() => expect(mountHeroField).toHaveBeenCalledTimes(1));
  });

  it('does not mount when unmounted before the idle callback fires', async () => {
    gate = mockGate(true);
    const idle = mockIdle();
    const { unmount } = render(<HeroFieldGate />);

    unmount();
    idle.flush();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mountHeroField).not.toHaveBeenCalled();
  });

  it('keeps the fallback when mounting throws', async () => {
    gate = mockGate(true);
    const idle = mockIdle();
    mountHeroField.mockImplementation(() => {
      throw new Error('WebGL unavailable');
    });
    const { container } = render(<HeroFieldGate />);

    idle.flush();
    await waitFor(() => expect(mountHeroField).toHaveBeenCalledTimes(1));
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });
});
