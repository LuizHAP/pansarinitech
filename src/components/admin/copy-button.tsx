'use client';

import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'failed';

const FEEDBACK_MS = 2000;

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [status, setStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => setStatus('idle'), FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  const text =
    status === 'copied' ? 'Copiado' : status === 'failed' ? 'Não foi possível copiar' : label;

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className={className}>
      {status === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{text}</span>
    </Button>
  );
}
