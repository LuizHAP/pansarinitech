'use client';
import { useEffect, useRef } from 'react';

const GATE = '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

// A plain import() (not next/dynamic) so the Three.js chunk is fetched after load + idle,
// never during hydration, and never on phones or under reduced motion.
export function HeroFieldGate() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia(GATE);
    let generation = 0;
    let dispose: (() => void) | undefined;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const run = async (id: number) => {
      try {
        const { mountHeroField } = await import('./hero-field-scene');
        if (id === generation && ref.current) dispose = mountHeroField(ref.current);
      } catch {
        // The CSS grid behind the canvas is the fallback.
      }
    };
    const start = () => {
      const id = generation;
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => void run(id), { timeout: 2000 });
      } else {
        timeoutId = window.setTimeout(() => void run(id), 200);
      }
    };
    const mount = () => {
      if (document.readyState === 'complete') start();
      else window.addEventListener('load', start, { once: true });
    };
    const unmount = () => {
      generation++;
      window.removeEventListener('load', start);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      idleId = undefined;
      window.clearTimeout(timeoutId);
      dispose?.();
      dispose = undefined;
    };
    // CSS reduced-motion rules react live; the WebGL loop has to be torn down by hand.
    const onChange = () => {
      unmount();
      if (media.matches) mount();
    };

    if (media.matches) mount();
    media.addEventListener('change', onChange);

    return () => {
      media.removeEventListener('change', onChange);
      unmount();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="absolute inset-0" />;
}
