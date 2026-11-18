'use client';

import { Button } from '@/components/ui/button';
import {
  type ActionResult,
  deleteCampaign,
  pauseCampaign,
  resumeCampaign,
  startCampaign,
} from '@/lib/admin/campaign-actions';
import type { Campaign } from '@/lib/crm/contract';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function CampaignControls({ id, status }: { id: string; status: Campaign['status'] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: (id: string) => Promise<ActionResult>, confirmation?: string) => {
    if (confirmation && !window.confirm(confirmation)) return;
    startTransition(async () => {
      const result = await action(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      if (action === deleteCampaign) router.push('/admin/campanhas');
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status === 'draft' && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                startCampaign,
                'Iniciar a campanha? As mensagens passam a ser enviadas de verdade.',
              )
            }
          >
            Iniciar
          </Button>
        )}
        {(status === 'running' || status === 'scheduled') && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(pauseCampaign)}>
            Pausar
          </Button>
        )}
        {status === 'paused' && (
          <Button size="sm" disabled={pending} onClick={() => run(resumeCampaign)}>
            Retomar
          </Button>
        )}
        {status !== 'running' && (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => run(deleteCampaign, 'Excluir esta campanha?')}
          >
            Excluir
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
