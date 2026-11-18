import { CampaignControls } from '@/components/admin/campaign-controls';
import { AutoRefresh } from '@/components/admin/campaign-live';
import {
  CampaignStatusBadge,
  MetricsRow,
  ProgressBar,
  TargetStatusBadge,
} from '@/components/admin/campaign-status';
import { requireAdmin } from '@/lib/admin/auth';
import { loadCampaignSnapshot } from '@/lib/admin/campaign-queries';
import { notFound } from 'next/navigation';

const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
});

function time(value: number | null): string {
  return value === null ? '-' : timeFormat.format(new Date(value));
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const snapshot = await loadCampaignSnapshot(id);
  if (!snapshot) notFound();
  const { campaign, metrics, rows } = snapshot;

  return (
    <main className="mx-auto flex max-w-5xl min-w-0 flex-col gap-6 px-4 py-6">
      <AutoRefresh active={campaign.status === 'running' || campaign.status === 'scheduled'} />
      <header className="flex flex-col gap-3">
        <a href="/admin/campanhas" className="text-sm text-muted-foreground hover:underline">
          Campanhas
        </a>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Limite de {campaign.dailyLimit} por dia, intervalo de {campaign.minDelaySec} a{' '}
          {campaign.maxDelaySec}s{campaign.startAt ? `, início em ${time(campaign.startAt)}` : ''}.
        </p>
        <CampaignControls id={campaign.id} status={campaign.status} />
      </header>

      <ProgressBar value={metrics.progress} label="Progresso da campanha" />
      <MetricsRow metrics={metrics} />

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Mensagem</h2>
        <p className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
          {campaign.template}
        </p>
      </section>

      <section className="flex min-w-0 flex-col gap-2">
        <h2 className="text-base font-semibold">Leads ({rows.length})</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="p-2 font-medium">Lead</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Enviada</th>
                <th className="p-2 font-medium">Resposta</th>
                <th className="p-2 font-medium">Erro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.leadId} className="border-b last:border-0">
                  <td className="p-2">
                    <a href={`/admin/leads/${row.leadId}`} className="hover:underline">
                      {row.name}
                    </a>
                  </td>
                  <td className="p-2">
                    <TargetStatusBadge status={row.status} />
                  </td>
                  <td className="p-2 tabular-nums">{time(row.sentAt)}</td>
                  <td className="p-2 tabular-nums">{time(row.repliedAt)}</td>
                  <td className="p-2 text-destructive">{row.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
