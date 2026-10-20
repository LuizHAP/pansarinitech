import { InstancedMesh, Matrix4, type Scene } from 'three';
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

function stubViewport() {
  let onIntersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof onIntersect) {
        onIntersect = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => {});
  return {
    show: (isIntersecting: boolean) => onIntersect([{ isIntersecting }]),
    nextFrame: () => frames.shift()?.(0),
  };
}

function lastPose() {
  const calls = renderers[0].render.mock.calls;
  const scene = calls[calls.length - 1][0] as Scene;
  const mesh = scene.children.find((child) => child instanceof InstancedMesh) as InstancedMesh;
  const matrix = new Matrix4();
  return Array.from({ length: mesh.count }, (_, k) => {
    mesh.getMatrixAt(k, matrix);
    return matrix.elements[13];
  });
}

function setMotion(paused: boolean) {
  if (paused) document.documentElement.dataset.motion = 'paused';
  else delete document.documentElement.dataset.motion;
  window.dispatchEvent(new CustomEvent('pansarini:motion', { detail: { paused } }));
}

describe('mountHeroField', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    renderers.length = 0;
    el = document.createElement('div');
    document.body.append(el);
  });

  afterEach(() => {
    el.remove();
    delete document.documentElement.dataset.motion;
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

  it('keeps the paused pose still when the hero scrolls back into view', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const viewport = stubViewport();
    document.documentElement.dataset.motion = 'paused';
    const dispose = mountHeroField(el);

    viewport.show(true);
    const before = lastPose();
    now.mockReturnValue(6000);
    viewport.show(false);
    viewport.show(true);

    expect(renderers[0].render).toHaveBeenCalledTimes(2);
    expect(lastPose()).toEqual(before);
    dispose();
  });

  it('drops ripples requested while paused instead of replaying them on resume', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const viewport = stubViewport();
    document.documentElement.dataset.motion = 'paused';
    const dispose = mountHeroField(el);
    viewport.show(true);

    window.dispatchEvent(new Event('pansarini:ripple'));
    setMotion(false);
    viewport.nextFrame();

    expect(renderers[0].render).toHaveBeenCalledTimes(2);
    expect(Math.max(...lastPose())).toBeLessThan(1);
    dispose();
  });
});
