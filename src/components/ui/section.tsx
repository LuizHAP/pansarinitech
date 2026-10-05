import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

// box-content keeps the 6xl measure on the content box so section edges line up with the header.
export const sectionContainer = 'mx-auto box-content max-w-6xl px-4 md:px-6';

const sectionVariants = cva(`${sectionContainer} py-8 sm:py-10 lg:py-14`, {
  variants: {
    eyebrow: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    eyebrow: false,
  },
});

export interface SectionProps {
  children: ReactNode;
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  eyebrow?: ReactNode;
}

export function Section({ children, id, ariaLabelledBy, className, eyebrow }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(sectionVariants({ eyebrow: !!eyebrow }), className)}
    >
      {children}
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
