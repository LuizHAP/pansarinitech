'use client';

import { Button } from '@/components/ui/button';
import { scoreLeadAction, scoreLeadsAction } from '@/lib/admin/score-actions';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function RescoreButton({
  leadId,
  label = 'Reanalisar',
}: { leadId: string; label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await scoreLeadAction(leadId);
        if (!result.ok) setError(result.error);
        else router.refresh();
      } catch {
        setError('Não foi possível analisar este lead.');
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="outline" onClick={run} disabled={pending}>
        {pending ? 'Analisando...' : label}
      </Button>
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}

export function ScoreBatchButton({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    let queue = ids;
    const total = ids.length;
    let done = 0;
    let failed = 0;
    setProgress({ done, total, failed });
    try {
      while (queue.length > 0) {
        const { results, remaining } = await scoreLeadsAction(queue);
        done += results.length;
        failed += results.filter((result) => !result.ok).length;
        queue = remaining;
        setProgress({ done, total, failed });
      }
    } catch {
      setError('A análise foi interrompida.');
    }
    setRunning(false);
    router.refresh();
  }

  if (ids.length === 0 && !progress) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={run}
        disabled={running || ids.length === 0}
      >
        Analisar leads sem score ({ids.length})
      </Button>
      {progress && (
        <output className="text-sm text-muted-foreground">
          {running ? 'Analisando' : 'Concluído'}: {progress.done}/{progress.total}
          {progress.failed > 0 && ` (${progress.failed} com falha)`}
        </output>
      )}
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
