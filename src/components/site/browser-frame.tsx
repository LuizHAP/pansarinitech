import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function BrowserFrame({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[14px] border-[1.5px] border-ink-line bg-ink-card',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-[7px] border-b-[1.5px] border-ink-line px-3.5 py-[11px]"
      >
        <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
        <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
        <span className="size-[9px] shrink-0 rounded-full bg-ink-line" />
        <span className="ml-2 truncate font-mono text-[11px] text-ink-muted">{url}</span>
      </div>
      {children}
    </div>
  );
}
