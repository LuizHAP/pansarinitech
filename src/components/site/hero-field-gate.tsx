'use client';
import { useEffect, useRef } from 'react';

const GATE = '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

// A plain import() (not next/dynamic) so the Three.js chunk is fetched after load + idle,
// never during hydration, and never on phones or under reduced motion.
export function HeroFieldGate() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia(GATE).matches) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const run = async () => {
      try {
        const { mountHeroField } = await import('./hero-field-scene');
        if (!cancelled && ref.current) dispose = mountHeroField(ref.current);
      } catch {
        // The CSS grid behind the canvas is the fallback.
      }
    };
    const start = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => void run(), { timeout: 2000 });
      } else {
        timeoutId = window.setTimeout(() => void run(), 200);
      }
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      window.clearTimeout(timeoutId);
      dispose?.();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="absolute inset-0" />;
}
