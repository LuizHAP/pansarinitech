import { cn } from '@/lib/utils';
// src/components/mdx/callout.tsx — Phase 3 D-07
// RSC callout (server-only by absence of the client directive — async component reads getTranslations).
// Used inside MDX bodies as <Callout type="info|warn|error">…</Callout>; aliased
// by Note (info) and Warning (warn) for ergonomic authoring.
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

type CalloutType = 'info' | 'warn' | 'error';

const ICONS: Record<CalloutType, typeof Info> = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
};

const STYLES: Record<CalloutType, string> = {
  info: 'border-l-4 border-primary bg-primary/5 text-foreground',
  warn: 'border-l-4 border-yellow-500 bg-yellow-500/5 text-foreground',
  error: 'border-l-4 border-destructive bg-destructive/5 text-foreground',
};

const ICON_TINT: Record<CalloutType, string> = {
  info: 'text-primary',
  warn: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-destructive',
};

export async function Callout({
  type = 'info',
  label,
  children,
}: {
  type?: CalloutType;
  label?: string;
  children: ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'mdx' });
  const Icon = ICONS[type];
  const resolvedLabel = label ?? t(`callout.${type}`);

  return (
    <aside
      role="note"
      className={cn(
        'my-6 flex items-start gap-3 rounded-md p-4 text-sm leading-relaxed',
        STYLES[type],
      )}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', ICON_TINT[type])} aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium">{resolvedLabel}</p>
        <div className="mt-1 [&>p]:my-0">{children}</div>
      </div>
    </aside>
  );
}
