import { CopyButton } from '@/components/admin/copy-button';
import { RescoreButton } from '@/components/admin/score-controls';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/admin/view';
import type { LeadScore } from '@/lib/crm/contract';
import { PRIORITY_LABELS, describeSignals } from '@/lib/crm/scoring/view';
import { cn } from '@/lib/utils';

export const PRIORITY_CLASSES: Record<LeadScore['priority'], string> = {
  alta: 'bg-emerald-500/20 text-emerald-300',
  media: 'bg-amber-500/20 text-amber-300',
  baixa: 'bg-muted text-muted-foreground',
};

export function ScoreBadge({ score }: { score: LeadScore | null | undefined }) {
  if (!score) return null;
  return (
    <Badge
      data-testid="score-badge"
      className={cn(PRIORITY_CLASSES[score.priority])}
      title={`Prioridade ${PRIORITY_LABELS[score.priority].toLowerCase()}`}
    >
      {score.value} · {PRIORITY_LABELS[score.priority]}
    </Badge>
  );
}

export function ScorePanel({
  leadId,
  score,
}: { leadId: string; score: LeadScore | null | undefined }) {
  if (!score) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Qualificação</h2>
        <p className="text-sm text-muted-foreground">Este lead ainda não foi analisado.</p>
        <RescoreButton leadId={leadId} label="Analisar" />
      </section>
    );
  }
  const signals = describeSignals(score.signals);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Qualificação</h2>
        <ScoreBadge score={score} />
        <span className="text-xs text-muted-foreground">
          {score.engine === 'ai' ? 'IA' : 'Regras locais'} · {formatDateTime(score.analyzedAt)}
        </span>
      </div>
      {signals.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Sinais">
          {signals.map((signal) => (
            <li key={signal.label}>
              <Badge
                variant={signal.tone === 'gap' ? 'default' : 'outline'}
                className={cn(signal.tone === 'neutral' && 'text-muted-foreground')}
              >
                {signal.label}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {score.reasons.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          {score.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {score.suggestedMessage && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Mensagem sugerida</h3>
          <p className="rounded-md border border-border p-3 text-sm break-words whitespace-pre-wrap">
            {score.suggestedMessage}
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={score.suggestedMessage} label="Copiar mensagem" />
          </div>
        </div>
      )}
      <RescoreButton leadId={leadId} />
    </section>
  );
}
