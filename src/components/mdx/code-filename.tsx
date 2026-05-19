import { cn } from '@/lib/utils';
import { FileIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

export async function CodeFilename({
  filename,
  children,
}: {
  filename: string;
  children: ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'mdx' });

  return (
    <div
      className={cn('rounded-md overflow-hidden border border-border')}
      aria-label={`${t('codeFilename.ariaPrefix')}: ${filename}`}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
        <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-mono text-muted-foreground">{filename}</span>
      </div>
      {children}
    </div>
  );
}
