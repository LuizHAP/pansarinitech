'use client';
import { useEffect, useState } from 'react';

const TICK_MS = 75;
const HOLD_TICKS = 18;

export function TypedLine({
  prefix,
  words,
  srText,
}: {
  prefix: string;
  words: string[];
  srText: string;
}) {
  const [typed, setTyped] = useState(words[0] ?? '');

  useEffect(() => {
    if (words.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let word = 0;
    let length = words[0].length;
    let direction = -1;
    let hold = HOLD_TICKS;
    let interval: number | undefined;

    const tick = () => {
      if (hold > 0) {
        hold--;
        return;
      }
      length += direction;
      if (length >= words[word].length) {
        direction = -1;
        hold = HOLD_TICKS;
      } else if (length <= 0) {
        length = 0;
        direction = 1;
        word = (word + 1) % words.length;
      }
      setTyped(words[word].slice(0, length));
    };

    const start = () => {
      if (interval === undefined) interval = window.setInterval(tick, TICK_MS);
    };
    const stop = () => {
      window.clearInterval(interval);
      interval = undefined;
    };
    const onMotion = (event: Event) => {
      if ((event as CustomEvent<{ paused: boolean }>).detail?.paused) stop();
      else start();
    };

    if (document.documentElement.dataset.motion !== 'paused') start();
    window.addEventListener('pansarini:motion', onMotion);
    return () => {
      stop();
      window.removeEventListener('pansarini:motion', onMotion);
    };
  }, [words]);

  return (
    <p className="min-h-[2.6em] font-mono text-[clamp(18px,2.2vw,26px)] leading-[1.3] sm:min-h-[1.3em]">
      <span className="sr-only">{srText}</span>
      <span aria-hidden="true">
        {prefix}&nbsp;<span className="text-signal-soft">{typed}</span>
        <span className="lp-cursor ml-1 h-[1em] w-[0.46em] translate-y-[0.15em] bg-signal" />
      </span>
    </p>
  );
}
