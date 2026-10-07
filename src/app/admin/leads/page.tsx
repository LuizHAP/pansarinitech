import { LeadCard, leadPreview } from '@/components/admin/lead-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/admin/actions';
import { requireAdmin } from '@/lib/admin/auth';
import { listLeads } from '@/lib/admin/lead-store';
import {
  BOARD_STAGES,
  type Lead,
  STAGE_LABELS,
  groupLeadsByStage,
  todayInSaoPaulo,
} from '@/lib/admin/leads';
import { type PreviewIndex, getPreviewIndex } from '@/lib/client-preview-source';
import { TriangleAlert } from 'lucide-react';

function leadCount(count: number): string {
  return count === 1 ? '1 lead' : `${count} leads`;
}

function LeadList({
  leads,
  index,
  today,
  className,
}: {
  leads: Lead[];
  index: PreviewIndex;
  today: string;
  className: string;
}) {
  if (leads.length === 0) return <p className="text-sm text-muted-foreground">Nenhum lead</p>;
  return (
    <ul className={className}>
      {leads.map((lead) => (
        <li key={lead.id}>
          <LeadCard lead={lead} today={today} preview={leadPreview(index, lead)} />
        </li>
      ))}
    </ul>
  );
}

export default async function LeadsPage() {
  await requireAdmin();
  const [{ available, leads }, index] = await Promise.all([listLeads(), getPreviewIndex()]);
  const today = todayInSaoPaulo();
  const grouped = groupLeadsByStage(leads);

  return (
    <main className="mx-auto flex max-w-7xl min-w-0 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          {available && <p className="text-sm text-muted-foreground">{leadCount(leads.length)}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {available && (
            <Button asChild size="sm">
              <a href="/admin/leads/new">Novo lead</a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href="/admin">Prévias de clientes</a>
          </Button>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>

      {!available ? (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Redis indisponível</AlertTitle>
          <AlertDescription>
            Não há credenciais do Redis (KV_REST_API_URL e KV_REST_API_TOKEN) ou a leitura falhou.
            Os leads aparecem aqui quando o Redis responder.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <section
            aria-label="Quadro de leads"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrollable board must be reachable by keyboard.
            tabIndex={0}
            className="flex min-w-0 gap-4 overflow-x-auto px-1 pt-1 pb-2"
          >
            {BOARD_STAGES.map((stage) => (
              <section
                key={stage}
                aria-labelledby={`stage-heading-${stage}`}
                className="flex w-72 max-w-[85vw] shrink-0 flex-col gap-3"
              >
                <h2
                  id={`stage-heading-${stage}`}
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  {STAGE_LABELS[stage]}
                  <Badge variant="secondary">{grouped[stage].length}</Badge>
                </h2>
                <LeadList
                  leads={grouped[stage]}
                  index={index}
                  today={today}
                  className="flex flex-col gap-3"
                />
              </section>
            ))}
          </section>

          <details className="px-1">
            <summary className="cursor-pointer text-sm font-semibold">
              {STAGE_LABELS.perdido} ({grouped.perdido.length})
            </summary>
            <div className="mt-3">
              <LeadList
                leads={grouped.perdido}
                index={index}
                today={today}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              />
            </div>
          </details>
        </>
      )}
    </main>
  );
}
