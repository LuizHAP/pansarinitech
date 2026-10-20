import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// box-content keeps the 1280px measure on the content box so section edges line up with the header.
export const sectionContainer = 'mx-auto box-content max-w-[1280px] px-4 sm:px-5 md:px-8';

const SURFACES = {
  ink: 'surface-ink',
  paper: 'surface-paper',
  accent: 'surface-accent',
} as const;

export interface SectionProps {
  children: ReactNode;
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  eyebrow?: ReactNode;
  surface?: keyof typeof SURFACES;
}

export function Section({
  children,
  id,
  ariaLabelledBy,
  className,
  eyebrow,
  surface,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn('scroll-mt-16', surface && SURFACES[surface])}
    >
      <div className={cn(sectionContainer, 'py-22 md:py-30', className)}>
        {eyebrow && <p className="mb-4 font-mono text-sm text-muted-foreground">{eyebrow}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({
  children,
  className,
  eyebrow,
  id,
}: {
  children: ReactNode;
  className?: string;
  eyebrow?: ReactNode;
  id?: string;
}) {
  return (
    <header className="flex flex-col gap-1 mb-6">
      {eyebrow && (
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2 id={id} className="text-2xl font-semibold tracking-tight">
        {children}
      </h2>
    </header>
  );
}
