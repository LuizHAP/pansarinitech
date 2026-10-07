import { LeadLinks, StageForm, leadPreview } from '@/components/admin/lead-card';
import { LeadForm } from '@/components/admin/lead-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin/auth';
import { deleteLead, updateLead } from '@/lib/admin/lead-actions';
import { findLead } from '@/lib/admin/lead-store';
import {
  SOURCE_OPTIONS,
  STAGE_LABELS,
  isLeadId,
  isOverdue,
  leadFormValues,
  leadPreviewOptions,
  todayInSaoPaulo,
} from '@/lib/admin/leads';
import { formatDateTime } from '@/lib/admin/view';
import { getPreviewIndex } from '@/lib/client-preview-source';
import { TriangleAlert } from 'lucide-react';
import { notFound } from 'next/navigation';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <a
      href="/admin/leads"
      className="text-sm text-muted-foreground underline-offset-4 hover:underline"
    >
      Voltar ao quadro
    </a>
  );
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isLeadId(id)) notFound();
  const [{ available, lead }, index] = await Promise.all([findLead(id), getPreviewIndex()]);

  if (!available) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        <BackLink />
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Redis indisponível</AlertTitle>
          <AlertDescription>
            Não há credenciais do Redis (KV_REST_API_URL e KV_REST_API_TOKEN) ou a leitura falhou.
            Os leads aparecem aqui quando o Redis responder.
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  if (!lead) notFound();

  const overdue = isOverdue(lead.dueDate, todayInSaoPaulo());

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-2">
        <BackLink />
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 text-2xl font-semibold break-words">{lead.name}</h1>
          <Badge variant="secondary">{STAGE_LABELS[lead.stage]}</Badge>
          {overdue && <Badge variant="destructive">Atrasado</Badge>}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Criado em">{formatDateTime(lead.createdAt)}</Field>
        <Field label="Atualizado em">{formatDateTime(lead.updatedAt)}</Field>
      </dl>

      <StageForm lead={lead} />

      <section className="flex flex-col gap-2 text-sm">
        <h2 className="text-lg font-semibold">Contato e prévia</h2>
        <LeadLinks
          lead={lead}
          preview={leadPreview(index, lead)}
          emptyText="Nenhum contato ou prévia."
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Histórico</h2>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
          {lead.history.map((change) => (
            <li key={`${change.stage}-${change.at}`}>
              {STAGE_LABELS[change.stage]} · {formatDateTime(change.at)}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Editar</h2>
        <LeadForm
          action={updateLead.bind(null, lead.id)}
          defaults={leadFormValues(lead)}
          sourceOptions={SOURCE_OPTIONS}
          previewOptions={leadPreviewOptions(index, lead.previewSlug)}
          submitLabel="Salvar alterações"
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Excluir</h2>
        <details>
          <summary className="cursor-pointer text-sm font-medium text-destructive">
            Excluir lead
          </summary>
          <div className="mt-2 flex flex-col items-start gap-2">
            <p className="text-sm">Isso apaga o lead e todo o histórico. Não dá para desfazer.</p>
            <form action={deleteLead.bind(null, lead.id)}>
              <Button type="submit" variant="destructive" size="sm">
                Confirmar exclusão
              </Button>
            </form>
          </div>
        </details>
      </section>
    </main>
  );
}
