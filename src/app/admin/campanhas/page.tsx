import { AutoRefresh } from '@/components/admin/campaign-live';
import { CampaignStatusBadge, ProgressBar, percent } from '@/components/admin/campaign-status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin/auth';
import { loadCampaignList } from '@/lib/admin/campaign-queries';
import { TriangleAlert } from 'lucide-react';

export default async function CampaignsPage() {
  await requireAdmin();
  const { available, items } = await loadCampaignList();
  const running = items.some(({ campaign }) => campaign.status === 'running');

  return (
    <main className="mx-auto flex max-w-5xl min-w-0 flex-col gap-6 px-4 py-6">
      <AutoRefresh active={running} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Campanhas</h1>
        {available && (
          <Button asChild size="sm">
            <a href="/admin/campanhas/nova">Nova campanha</a>
          </Button>
        )}
      </header>

      {!available ? (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Redis indisponível</AlertTitle>
          <AlertDescription>As campanhas aparecem aqui quando o Redis responder.</AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma campanha ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ campaign, metrics }) => (
            <li key={campaign.id}>
              <a
                href={`/admin/campanhas/${campaign.id}`}
                className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{campaign.name}</span>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <ProgressBar value={metrics.progress} label={`Progresso de ${campaign.name}`} />
                <p className="flex flex-wrap gap-x-4 text-sm text-muted-foreground tabular-nums">
                  <span>{metrics.total} leads</span>
                  <span>{metrics.sent} enviadas</span>
                  <span>{metrics.replied} respostas</span>
                  <span>{metrics.failed} falhas</span>
                  <span>Resposta: {percent(metrics.replyRate)}</span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
