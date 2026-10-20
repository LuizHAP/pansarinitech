'use client';
import { useEffect, useState } from 'react';
import { isPaletteShortcut } from './palette-shortcut';

const PRESS_MS = 160;

const keycap =
  'rounded-[7px] px-[11px] py-[7px] font-semibold text-paper shadow-[0_4px_0_#eeece6] transition-[transform,box-shadow] duration-75 group-data-[pressed=true]:translate-y-1 group-data-[pressed=true]:shadow-none';

export function PaletteHint({ label, ariaLabel }: { label: string; ariaLabel: string }) {
  const [modifier, setModifier] = useState('Ctrl');
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) setModifier('⌘');

    let timeout: number | undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isPaletteShortcut(event)) return;
      setPressed(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setPressed(false), PRESS_MS);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => window.dispatchEvent(new CustomEvent('pansarini:palette'))}
      className="absolute right-8 bottom-10 hidden items-center gap-3 rounded-lg bg-ink px-3 py-2.5 font-mono text-[13px] text-ink-muted transition-colors hover:text-paper lg:pointer-fine:flex"
    >
      <span
        aria-hidden="true"
        data-pressed={pressed ? 'true' : undefined}
        className="group flex items-center gap-3"
      >
        <span className={`${keycap} border-[1.5px] border-paper`}>{modifier}</span>
        <span>+</span>
        <span className={`${keycap} bg-signal px-[13px]`}>K</span>
      </span>
      <span aria-hidden="true">{label}</span>
    </button>
  );
}
