import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function SectionHead({
  id,
  title,
  comment,
  as: Heading = 'h2',
  className,
}: {
  id: string;
  title: ReactNode;
  comment: string;
  as?: 'h1' | 'h2';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-8 gap-y-4', className)}>
      <Heading
        id={id}
        className="font-display text-[clamp(44px,6vw,84px)] leading-[0.92] font-extrabold tracking-[-0.045em] text-balance [overflow-wrap:anywhere]"
      >
        {title}
      </Heading>
      <p className="font-mono text-sm text-muted-foreground">{comment}</p>
    </div>
  );
}
