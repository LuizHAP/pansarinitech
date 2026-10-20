import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { renderers } = vi.hoisted(() => ({
  renderers: [] as {
    domElement: HTMLCanvasElement;
    render: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    forceContextLoss: ReturnType<typeof vi.fn>;
  }[],
}));

vi.mock('three', async (importOriginal) => {
  const three = await importOriginal<typeof import('three')>();
  class FakeRenderer {
    domElement = document.createElement('canvas');
    setPixelRatio = vi.fn();
    setClearColor = vi.fn();
    setSize = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    constructor() {
      renderers.push(this);
    }
  }
  return { ...three, WebGLRenderer: FakeRenderer };
});

import { mountHeroField } from './hero-field-scene';

const LISTENERS = ['pointermove', 'pointerdown', 'pansarini:ripple', 'pansarini:motion'];

describe('mountHeroField', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    renderers.length = 0;
    el = document.createElement('div');
    document.body.append(el);
  });

  afterEach(() => {
    el.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('releases the renderer, canvas and listeners when setup fails after they exist', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor() {
          throw new Error('observer unavailable');
        }
      },
    );
    const removed = vi.spyOn(window, 'removeEventListener');

    expect(() => mountHeroField(el)).toThrow('observer unavailable');

    const [renderer] = renderers;
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(el.querySelector('canvas')).toBeNull();
    expect(removed.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(LISTENERS));
  });

  it('disposes everything once', () => {
    const removed = vi.spyOn(window, 'removeEventListener');
    const dispose = mountHeroField(el);
    expect(el.querySelector('canvas')).not.toBeNull();

    dispose();
    dispose();

    const [renderer] = renderers;
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(el.querySelector('canvas')).toBeNull();
    expect(removed.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(LISTENERS));
  });
});
