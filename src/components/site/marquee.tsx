function WordList({ words, label }: { words: string[]; label?: string }) {
  return (
    <ul
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {words.map((word) => (
        <li key={word} className="flex items-center gap-10 whitespace-nowrap">
          {word}
          {/* Ink on the accent fill is decoration only (2.9:1), so it stays out of the text layer. */}
          <span aria-hidden="true" className="text-ink before:content-['>']" />
        </li>
      ))}
    </ul>
  );
}

export function Marquee({ words, label }: { words: string[]; label: string }) {
  return (
    <div className="surface-accent overflow-hidden border-t border-ink py-[18px] font-mono text-[22px] font-semibold">
      <div className="lp-marquee-track">
        <WordList words={words} label={label} />
        <WordList words={words} />
      </div>
    </div>
  );
}
