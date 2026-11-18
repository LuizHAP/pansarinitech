import { Badge } from '@/components/ui/badge';
import type { CampaignMetrics } from '@/lib/crm/campaign';
import type { Campaign, CampaignTargetStatus } from '@/lib/crm/contract';

export const CAMPAIGN_STATUS_LABELS: Record<Campaign['status'], string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  running: 'Em andamento',
  paused: 'Pausada',
  done: 'Concluída',
};

export const TARGET_STATUS_LABELS: Record<CampaignTargetStatus, string> = {
  pending: 'Pendente',
  queued: 'Na fila',
  sent: 'Enviada',
  replied: 'Respondeu',
  failed: 'Falhou',
  skipped: 'Ignorado',
};

export function CampaignStatusBadge({ status }: { status: Campaign['status'] }) {
  return (
    <Badge variant={status === 'running' ? 'default' : 'secondary'}>
      {CAMPAIGN_STATUS_LABELS[status]}
    </Badge>
  );
}

export function TargetStatusBadge({ status }: { status: CampaignTargetStatus }) {
  const variant =
    status === 'failed' ? 'destructive' : status === 'replied' ? 'default' : 'secondary';
  return <Badge variant={variant}>{TARGET_STATUS_LABELS[status]}</Badge>;
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <progress
      aria-label={label}
      max={100}
      value={Math.round(value * 100)}
      className="h-2 w-full overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary"
    />
  );
}

export function MetricsRow({ metrics }: { metrics: CampaignMetrics }) {
  const items: [string, string | number][] = [
    ['Enviadas', metrics.sent],
    ['Respostas', metrics.replied],
    ['Falhas', metrics.failed],
    ['Taxa de resposta', percent(metrics.replyRate)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border p-3">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
