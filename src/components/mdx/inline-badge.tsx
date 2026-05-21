import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'muted' | 'destructive';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  // text-primary is the default; dark:text-[var(--badge-primary-text)] overrides to a
  // lighter saber red in Sith mode so small badge text clears WCAG 1.4.3 AA 4.5:1
  // against the dark background (--primary at 54% gives only 3.67:1). [Rule 1 - A11y]
  primary: 'border-primary/30 text-primary dark:text-[var(--badge-primary-text)]',
  secondary: 'bg-muted text-muted-foreground',
  muted: 'border-border text-muted-foreground',
  destructive: 'border-destructive/30 text-destructive',
};

export function InlineBadge({
  variant = 'primary',
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        VARIANT_STYLES[variant],
      )}
    >
      {children}
    </span>
  );
}
