import { CopyButton } from '@/components/admin/copy-button';
import { PREVIEW_FRAME_SANDBOX } from '@/components/preview/frame-sandbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { disablePreview, enablePreview, purgePreview } from '@/lib/admin/actions';
import { requireAdmin } from '@/lib/admin/auth';
import {
  WARNING_MESSAGES,
  findAdminPreview,
  formatBytes,
  formatDateTime,
  previewAssetHref,
} from '@/lib/admin/view';
import { getPreviewIndex } from '@/lib/client-preview-source';
import { notFound } from 'next/navigation';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const preview = findAdminPreview(await getPreviewIndex(), slug);
  if (!preview) notFound();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-2">
        <a
          href="/admin"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Voltar
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold break-words">{preview.client}</h1>
          {preview.disabled && <Badge variant="outline">Desativada</Badge>}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Field label="Slug">
          <span className="font-mono text-xs">{preview.slug}</span>
        </Field>
        <Field label="Idioma">{preview.locale.toUpperCase()}</Field>
        <Field label="Origem">{preview.source === 'blob' ? 'Blob' : 'Repositório'}</Field>
        <Field label="Arquivos">{preview.fileCount ?? '—'}</Field>
        <Field label="Tamanho">
          {preview.totalSize === null ? '—' : formatBytes(preview.totalSize)}
        </Field>
        <Field label="Atualizado em">
          {preview.updatedAt === null ? '—' : formatDateTime(preview.updatedAt)}
        </Field>
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">URL pública</h2>
        <p className="font-mono text-xs break-all">{preview.url}</p>
        {preview.disabled && (
          <p className="text-sm text-muted-foreground">
            Prévia desativada: esta URL e os arquivos respondem 404 até você reativar.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <CopyButton value={preview.url} label="Copiar URL" />
          <Button asChild variant="outline" size="sm">
            <a href={preview.url} target="_blank" rel="noopener noreferrer">
              Abrir
            </a>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Avisos</h2>
        {preview.warnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aviso.</p>
        ) : (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {preview.warnings.map((warning) => (
              <li key={warning.code}>
                {WARNING_MESSAGES[warning.code]}
                {warning.detail && (
                  <span className="block font-mono text-xs break-all text-muted-foreground">
                    {warning.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Arquivos</h2>
        {preview.source === 'repo' ? (
          <p className="text-sm text-muted-foreground">
            Os arquivos ficam versionados no repositório em{' '}
            <code className="font-mono text-xs">public/client-previews/{preview.slug}/</code>.
          </p>
        ) : preview.files.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum arquivo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {preview.files.map((file) => (
              <li key={file.path} className="flex flex-col">
                {preview.disabled ? (
                  <span className="font-mono text-xs break-all">{file.path}</span>
                ) : (
                  <a
                    href={previewAssetHref(preview.slug, file.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs break-all underline-offset-4 hover:underline"
                  >
                    {file.path}
                  </a>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {formatDateTime(file.uploadedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview.hasIndex && !preview.disabled && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Prévia</h2>
          <iframe
            src={`/client-previews/${encodeURIComponent(preview.slug)}/index.html`}
            title={`Prévia de ${preview.client}`}
            sandbox={PREVIEW_FRAME_SANDBOX}
            className="block h-[70dvh] w-full rounded-md border border-border bg-white"
          />
        </section>
      )}

      {preview.source === 'blob' && (
        <div className="flex flex-wrap gap-2">
          {preview.disabled ? (
            <form action={enablePreview.bind(null, preview.slug)}>
              <Button type="submit" size="sm">
                Reativar prévia
              </Button>
            </form>
          ) : (
            <>
              <form action={disablePreview.bind(null, preview.slug)}>
                <Button type="submit" variant="destructive" size="sm">
                  Desativar prévia
                </Button>
              </form>
              <form action={purgePreview.bind(null, preview.slug)}>
                <Button type="submit" variant="destructive" size="sm">
                  Limpar cache deste site
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </main>
  );
}
