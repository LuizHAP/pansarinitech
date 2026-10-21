import { cn } from '@/lib/utils';

export function TerminalLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-xl leading-none font-semibold text-foreground',
        className,
      )}
    >
      <span className="text-signal-soft" aria-hidden="true">
        &gt;
      </span>
      pansarini
      <span aria-hidden="true" className="lp-cursor ml-1 h-[19px] w-[9px] bg-signal" />
    </span>
  );
}
