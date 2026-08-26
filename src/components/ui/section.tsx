import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import type { ReactNode } from 'react';

const sectionVariants = cva('mx-auto px-4 py-12 sm:py-16 lg:py-20', {
  variants: {
    width: {
      narrow: 'max-w-3xl',
      standard: 'max-w-5xl',
      wide: 'max-w-7xl',
    },
    eyebrow: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    width: 'standard',
    eyebrow: false,
  },
});

export interface SectionProps {
  children: ReactNode;
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  width?: VariantProps<typeof sectionVariants>['width'];
  eyebrow?: ReactNode;
}

export function Section({
  children,
  id,
  ariaLabelledBy,
  className,
  width = 'standard',
  eyebrow,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(sectionVariants({ width, eyebrow: !!eyebrow }), className)}
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
    <header className="flex flex-col gap-1 mb-8">
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
