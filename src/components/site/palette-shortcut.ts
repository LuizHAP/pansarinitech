// Caps Lock or Shift report the key as 'K'.
export function isPaletteShortcut(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
}
