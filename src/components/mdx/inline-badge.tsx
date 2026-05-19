import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'muted' | 'destructive';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: 'border-primary/30 text-primary',
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
