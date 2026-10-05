'use client';

import { PREVIEW_FRAME_SANDBOX } from '@/components/preview/frame-sandbox';
import { BrandLogo } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';
import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';

export type PreviewViewerLabels = {
  preview: string;
  brand: string;
  viewport: string;
  desktop: string;
  mobile: string;
  frame: string;
};

type Viewport = 'desktop' | 'mobile';

const MOBILE_FRAME_WIDTH = 390;

const toggleButton = 'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium';
const pressedButton = 'bg-background text-foreground shadow-sm';
const unpressedButton = 'text-muted-foreground hover:text-foreground';

export function PreviewViewer({
  client,
  src,
  labels,
}: {
  client: string;
  src: string;
  labels: PreviewViewerLabels;
}) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const isMobile = viewport === 'mobile';

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-muted px-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels.brand}
          className="inline-flex shrink-0 items-center gap-2 rounded-md"
        >
          <BrandLogo showWordmark={false} />
          <span className="hidden text-base font-semibold text-foreground sm:inline">
            Luiz Pansarini
          </span>
        </a>
        <h1 className="min-w-0 flex-1 truncate text-sm">
          <span className="text-muted-foreground">{labels.preview}</span>
          <span aria-hidden="true"> · </span>
          <span className="font-medium text-foreground">{client}</span>
        </h1>
        <fieldset
          aria-label={labels.viewport}
          className="hidden items-center gap-1 rounded-lg border border-border p-0.5 md:flex"
        >
          <button
            type="button"
            aria-pressed={!isMobile}
            onClick={() => setViewport('desktop')}
            className={cn(toggleButton, isMobile ? unpressedButton : pressedButton)}
          >
            <Monitor aria-hidden="true" className="size-4" />
            {labels.desktop}
          </button>
          <button
            type="button"
            aria-pressed={isMobile}
            onClick={() => setViewport('mobile')}
            className={cn(toggleButton, isMobile ? pressedButton : unpressedButton)}
          >
            <Smartphone aria-hidden="true" className="size-4" />
            {labels.mobile}
          </button>
        </fieldset>
      </header>
      <main className={cn('min-h-0 flex-1', isMobile && 'flex justify-center bg-muted p-4')}>
        {/* Client pages expect the browser's default white canvas, not the portfolio theme. */}
        {/* No allow-same-origin, so client scripts cannot reach the portfolio's cookies or storage. */}
        <iframe
          src={src}
          title={labels.frame}
          sandbox={PREVIEW_FRAME_SANDBOX}
          className={
            isMobile
              ? 'block h-full max-w-full rounded-md border border-border bg-white'
              : 'block h-full w-full border-0 bg-white'
          }
          style={isMobile ? { width: MOBILE_FRAME_WIDTH } : undefined}
        />
      </main>
    </div>
  );
}
