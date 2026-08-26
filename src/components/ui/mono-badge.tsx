import { cn } from '@/lib/utils';

interface MonoBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'outline';
  className?: string;
  asChild?: boolean;
}

export function MonoBadge({
  children,
  variant = 'default',
  className,
  asChild = false,
}: MonoBadgeProps) {
  const base =
    'font-mono text-[10px] uppercase tracking-wider rounded px-2 py-0.5 transition-colors';
  const variants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    outline:
      'border border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
  };

  if (asChild) {
    return (
      <span className={cn(base, variants[variant], className)} {...{ 'data-mono-badge': '' }}>
        {children}
      </span>
    );
  }

  return <span className={cn(base, variants[variant], className)}>{children}</span>;
}

interface SkillBadgeProps {
  name: string;
  daily?: boolean;
  className?: string;
}

export function SkillBadge({ name, daily = false, className }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'font-mono text-xs px-2 py-1 rounded transition-colors',
        daily
          ? 'text-foreground underline decoration-primary decoration-1 underline-offset-2'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {name}
    </span>
  );
}
