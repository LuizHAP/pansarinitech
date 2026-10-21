'use client';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { toast } from 'sonner';

const SEQUENCE = 'whoami';

const BANNER_LINES = [
  '> whoami',
  'luiz pansarini, principal software engineer',
  '$ git clone github.com/LuizHAP/pansarinitech',
];

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('input, textarea, select, [contenteditable]') !== null;
}

export function EasterEgg() {
  const whoami = useTranslations('site.easterEgg')('whoami');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    console.log(
      '%c%s',
      'color: #8F96FF; font-family: monospace; font-size: 12px;',
      BANNER_LINES.join('\n'),
    );
  }, []);

  useEffect(() => {
    let buffer = '';
    function onKeydown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length !== 1 || isEditable(event.target)) return;
      buffer = (buffer + event.key.toLowerCase()).slice(-SEQUENCE.length);
      if (buffer !== SEQUENCE) return;
      buffer = '';
      window.dispatchEvent(new CustomEvent('pansarini:ripple'));
      toast(whoami);
    }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [whoami]);

  return null;
}
