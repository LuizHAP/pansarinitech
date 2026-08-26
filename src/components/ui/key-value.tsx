import { cn } from '@/lib/utils';

interface KeyValueProps {
  label: string;
  value: string | number;
  className?: string;
}

export function KeyValue({ label, value, className }: KeyValueProps) {
  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-baseline', className)}>
      <dt className="font-mono text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </dl>
  );
}

interface KeyValueGroupProps {
  items: Array<{ label: string; value: string | number }>;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function KeyValueGroup({ items, className, columns = 2 }: KeyValueGroupProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid gap-3', colClass, className)}>
      {items.map((item) => (
        <KeyValue key={item.label} {...item} />
      ))}
    </div>
  );
}
