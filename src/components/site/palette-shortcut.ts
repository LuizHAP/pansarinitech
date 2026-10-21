import { useEffect, useState } from 'react';

// Caps Lock or Shift report the key as 'K'.
export function isPaletteShortcut(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
}

// Starts as Ctrl so the server render matches the first client render.
export function usePaletteModifier() {
  const [modifier, setModifier] = useState('Ctrl');
  useEffect(() => {
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) setModifier('⌘');
  }, []);
  return modifier;
}
