import { act, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TypedLine } from './typed-line';

const WORDS = ['web', 'apps'];
const SR = 'I build web and apps.';

function mockReducedMotion(reduce: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

function typedText(container: HTMLElement) {
  return container.querySelector('.text-signal-soft')?.textContent;
}

function advanceTicks(ticks: number) {
  act(() => {
    vi.advanceTimersByTime(ticks * 75);
  });
}

describe('<TypedLine />', () => {
  let restoreMatchMedia: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    restoreMatchMedia = mockReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreMatchMedia();
    delete document.documentElement.dataset.motion;
  });

  it('server-renders the first word hidden from AT next to the sr-only sentence', () => {
    const html = renderToString(<TypedLine prefix="> I build" words={WORDS} srText={SR} />);
    const host = document.createElement('div');
    host.innerHTML = html;

    expect(host.querySelector('.sr-only')?.textContent).toBe(SR);
    const visual = host.querySelector('[aria-hidden="true"]');
    expect(visual?.textContent).toContain('> I build');
    expect(visual?.querySelector('.text-signal-soft')?.textContent).toBe('web');
  });

  it('holds the full word for 18 ticks, deletes it and types the next word at 75ms per char', () => {
    const { container } = render(<TypedLine prefix=">" words={WORDS} srText={SR} />);
    expect(typedText(container)).toBe('web');

    advanceTicks(18);
    expect(typedText(container)).toBe('web');

    advanceTicks(1);
    expect(typedText(container)).toBe('we');
    advanceTicks(2);
    expect(typedText(container)).toBe('');
    advanceTicks(2);
    expect(typedText(container)).toBe('ap');
    advanceTicks(2);
    expect(typedText(container)).toBe('apps');
    advanceTicks(18);
    expect(typedText(container)).toBe('apps');
    advanceTicks(1);
    expect(typedText(container)).toBe('app');
  });

  it('never starts under prefers-reduced-motion', () => {
    restoreMatchMedia();
    restoreMatchMedia = mockReducedMotion(true);
    const { container } = render(<TypedLine prefix=">" words={WORDS} srText={SR} />);

    advanceTicks(40);
    expect(typedText(container)).toBe('web');
  });

  it('never starts when motion is already paused', () => {
    document.documentElement.dataset.motion = 'paused';
    const { container } = render(<TypedLine prefix=">" words={WORDS} srText={SR} />);

    advanceTicks(40);
    expect(typedText(container)).toBe('web');
  });

  it('stops on a pause event and resumes on a play event', () => {
    const { container } = render(<TypedLine prefix=">" words={WORDS} srText={SR} />);

    act(() => {
      window.dispatchEvent(new CustomEvent('pansarini:motion', { detail: { paused: true } }));
    });
    advanceTicks(40);
    expect(typedText(container)).toBe('web');

    act(() => {
      window.dispatchEvent(new CustomEvent('pansarini:motion', { detail: { paused: false } }));
    });
    advanceTicks(19);
    expect(typedText(container)).toBe('we');
  });

  it('renders nothing typed and stays idle for an empty word list', () => {
    const { container } = render(<TypedLine prefix=">" words={[]} srText={SR} />);

    advanceTicks(40);
    expect(typedText(container)).toBe('');
  });
});
