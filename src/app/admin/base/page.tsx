import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { requireAdmin } from '@/lib/admin/auth';
import { listLeads } from '@/lib/admin/lead-store';
import { BOARD_STAGES, SOURCE_LABELS, STAGE_LABELS } from '@/lib/admin/leads';
import { filterBase, parseBaseFilter } from '@/lib/crm/base';
import { PRIORITY_LABELS } from '@/lib/crm/scoring/view';

export default async function BasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const filter = parseBaseFilter(await searchParams);
  const { available, leads } = await listLeads();
  const rows = filterBase(leads, filter);
  const exportQuery = new URLSearchParams();
  if (filter.q) exportQuery.set('q', filter.q);
  if (filter.stage) exportQuery.set('etapa', filter.stage);

  return (
    <main className="mx-auto flex max-w-7xl min-w-0 flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Base de leads</h1>
        <p className="text-sm text-muted-foreground">
          {available ? `${rows.length} de ${leads.length} leads` : 'Redis indisponível'}
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="base-q" className="text-sm text-muted-foreground">
            Buscar
          </label>
          <Input
            id="base-q"
            name="q"
            defaultValue={filter.q}
            maxLength={80}
            placeholder="Nome, categoria, cidade, telefone..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="base-stage" className="text-sm text-muted-foreground">
            Etapa
          </label>
          <NativeSelect id="base-stage" name="etapa" defaultValue={filter.stage ?? ''}>
            <option value="">Todas</option>
            {[...BOARD_STAGES, 'perdido' as const].map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button asChild type="button" size="sm" variant="outline">
          <a href={`/admin/base/export?${exportQuery}`}>Exportar CSV</a>
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Lead</th>
              <th className="px-3 py-2 font-medium">Cidade</th>
              <th className="px-3 py-2 font-medium">Etapa</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Contato</th>
              <th className="px-3 py-2 font-medium">Origem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => {
              const score = lead.extras?.score;
              return (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-3 py-2">
                    <a href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.name}
                    </a>
                    {lead.extras?.category && (
                      <p className="text-xs text-muted-foreground">{lead.extras.category}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{lead.extras?.city ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{STAGE_LABELS[lead.stage]}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    {score ? `${score.value} · ${PRIORITY_LABELS[score.priority]}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {[lead.whatsapp && 'WhatsApp', lead.email && 'E-mail', lead.website && 'Site']
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{SOURCE_LABELS[lead.source]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {available && rows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nenhum lead encontrado.</p>
        )}
      </div>
    </main>
  );
}
