'use client';
import { Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pansarini:motion';

function applyMotion(paused: boolean) {
  const root = document.documentElement;
  if (paused) root.dataset.motion = 'paused';
  else delete root.dataset.motion;
  window.dispatchEvent(new CustomEvent('pansarini:motion', { detail: { paused } }));
}

export function MotionToggle() {
  const t = useTranslations('site.motion');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === 'paused') {
      setPaused(true);
      applyMotion(true);
    }
  }, []);

  function toggle() {
    const next = !paused;
    setPaused(next);
    if (next) window.localStorage.setItem(STORAGE_KEY, 'paused');
    else window.localStorage.removeItem(STORAGE_KEY);
    applyMotion(next);
  }

  const Icon = paused ? Play : Pause;

  return (
    <button
      type="button"
      aria-label={t('label')}
      aria-pressed={paused}
      onClick={toggle}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md font-mono text-ink-muted transition-colors hover:bg-ink-card hover:text-paper"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
