import { CopyButton } from '@/components/admin/copy-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { logout, refreshIndex } from '@/lib/admin/actions';
import { requireAdmin } from '@/lib/admin/auth';
import {
  type AdminPreview,
  formatBytes,
  formatDateTime,
  listAdminPreviews,
  publicUrls,
} from '@/lib/admin/view';
import { getPreviewIndex } from '@/lib/client-preview-source';
import { TriangleAlert } from 'lucide-react';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

function warningLabel(count: number): string {
  return count === 1 ? '1 aviso' : `${count} avisos`;
}

function PreviewCard({ preview }: { preview: AdminPreview }) {
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">
          <a
            href={`/admin/${encodeURIComponent(preview.slug)}`}
            className="underline-offset-4 hover:underline"
          >
            {preview.client}
          </a>
        </h2>
        <Badge variant="secondary">{preview.source === 'blob' ? 'Blob' : 'Repositório'}</Badge>
        {preview.warnings.length > 0 && (
          <Badge variant="destructive">{warningLabel(preview.warnings.length)}</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Slug">
            <span className="font-mono text-xs">{preview.slug}</span>
          </Field>
          <Field label="Idioma">{preview.locale.toUpperCase()}</Field>
          <Field label="Arquivos">{preview.fileCount ?? '—'}</Field>
          <Field label="Tamanho">
            {preview.totalSize === null ? '—' : formatBytes(preview.totalSize)}
          </Field>
          <Field label="Atualizado em">
            {preview.updatedAt === null ? '—' : formatDateTime(preview.updatedAt)}
          </Field>
        </dl>
        <p className="font-mono text-xs break-all">{preview.url}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={preview.url} label="Copiar URL" />
          <Button asChild variant="outline" size="sm">
            <a href={preview.url} target="_blank" rel="noopener noreferrer">
              Abrir
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const index = await getPreviewIndex();
  const previews = listAdminPreviews(index);
  const urls = publicUrls(previews);
  const hasBlobPreviews = previews.some((preview) => preview.source === 'blob');

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Prévias de clientes</h1>
          <p className="text-sm text-muted-foreground">
            Índice gerado em {formatDateTime(index.generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={refreshIndex}>
            <Button type="submit" size="sm">
              Atualizar índice
            </Button>
          </form>
          <CopyButton value={urls.join('\n')} label="Copiar todas as URLs" />
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>

      {!index.available && (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Blob indisponível</AlertTitle>
          <AlertDescription>
            Não há credenciais do Blob ou a listagem falhou. Só as prévias do repositório aparecem
            abaixo.
          </AlertDescription>
        </Alert>
      )}
      {index.available && !hasBlobPreviews && (
        <p className="text-sm text-muted-foreground">Nenhuma prévia no Blob ainda.</p>
      )}

      <ul className="flex flex-col gap-4">
        {previews.map((preview) => (
          <li key={`${preview.source}:${preview.slug}`}>
            <PreviewCard preview={preview} />
          </li>
        ))}
      </ul>
    </main>
  );
}
