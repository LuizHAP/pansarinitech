import { ScoreBatchButton } from '@/components/admin/score-controls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/admin/auth';
import { listLeads } from '@/lib/admin/lead-store';
import { STAGE_LABELS } from '@/lib/admin/leads';
import { PRIORITY_LABELS, sortByScore, unscoredLeadIds } from '@/lib/crm/scoring/view';

const TOP = 20;

export default async function ScoringPage() {
  await requireAdmin();
  const { available, leads } = await listLeads();
  const scored = sortByScore(leads.filter((lead) => lead.extras?.score));
  const unscored = unscoredLeadIds(leads);
  const counts = {
    alta: scored.filter((l) => l.extras?.score?.priority === 'alta').length,
    media: scored.filter((l) => l.extras?.score?.priority === 'media').length,
    baixa: scored.filter((l) => l.extras?.score?.priority === 'baixa').length,
  };
  const cards = [
    { label: 'Prioridade alta', value: counts.alta, href: '/admin/leads?prioridade=alta' },
    { label: 'Prioridade média', value: counts.media, href: '/admin/leads?prioridade=media' },
    { label: 'Prioridade baixa', value: counts.baixa, href: '/admin/leads?prioridade=baixa' },
    { label: 'Sem score', value: unscored.length, href: '/admin/leads?prioridade=sem' },
  ];

  return (
    <main className="mx-auto flex max-w-5xl min-w-0 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Lead scoring</h1>
        <p className="text-sm text-muted-foreground">
          Quem não tem site ou tem site fraco pontua mais alto. A IA só entra se OPENROUTER_API_KEY
          estiver definida.
        </p>
      </header>

      {!available ? (
        <p className="text-sm text-muted-foreground">Redis indisponível.</p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((card) => (
              <li key={card.label}>
                <a href={card.href} className="block">
                  <Card className="transition-colors hover:bg-accent/40">
                    <CardHeader>
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {card.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{card.value}</CardContent>
                  </Card>
                </a>
              </li>
            ))}
          </ul>

          <ScoreBatchButton ids={unscored} />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Melhores oportunidades</h2>
            {scored.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum lead analisado ainda. Use o botão acima.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {scored.slice(0, TOP).map((lead) => {
                  const score = lead.extras?.score;
                  if (!score) return null;
                  return (
                    <li key={lead.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <a href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                          {lead.name}
                        </a>
                        <span className="text-sm text-muted-foreground">
                          {score.value} · {PRIORITY_LABELS[score.priority]} ·{' '}
                          {STAGE_LABELS[lead.stage]}
                        </span>
                      </div>
                      {score.reasons[0] && (
                        <p className="mt-1 text-sm text-muted-foreground">{score.reasons[0]}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  );
}
