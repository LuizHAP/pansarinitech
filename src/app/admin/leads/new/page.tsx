import { LeadForm } from '@/components/admin/lead-form';
import { requireAdmin } from '@/lib/admin/auth';
import { createLead } from '@/lib/admin/lead-actions';
import {
  SOURCE_OPTIONS,
  STAGE_OPTIONS,
  leadFormValues,
  leadPreviewOptions,
} from '@/lib/admin/leads';
import { getPreviewIndex } from '@/lib/client-preview-source';

export default async function NewLeadPage() {
  await requireAdmin();
  const index = await getPreviewIndex();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-2">
        <a
          href="/admin/leads"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Voltar ao quadro
        </a>
        <h1 className="text-2xl font-semibold">Novo lead</h1>
      </div>
      <LeadForm
        action={createLead}
        defaults={leadFormValues()}
        sourceOptions={SOURCE_OPTIONS}
        previewOptions={leadPreviewOptions(index, null)}
        stageOptions={STAGE_OPTIONS}
        submitLabel="Criar lead"
      />
    </main>
  );
}
