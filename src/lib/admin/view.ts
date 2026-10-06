import { type ClientPreview, clientPreviews } from '@/data/client-previews';
import {
  type PreviewFile,
  type PreviewIndex,
  type PreviewWarning,
  type PreviewWarningCode,
  isPreviewSlug,
} from '@/lib/client-preview-source';

export type AdminPreview = ClientPreview & {
  source: 'repo' | 'blob';
  url: string;
  hasIndex: boolean;
  files: PreviewFile[];
  fileCount: number | null;
  totalSize: number | null;
  updatedAt: string | null;
  warnings: PreviewWarning[];
};

const KB = 1024;
const MB = KB * 1024;
const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const WARNING_MESSAGES: Record<PreviewWarningCode, string> = {
  'invalid-slug': 'O nome da pasta tem caracteres fora de [a-z0-9-], então a URL pública não abre.',
  'missing-index': 'Não há index.html na raiz da pasta, então a URL pública dá 404.',
  'missing-title': 'O index.html não tem <title>, então o nome do cliente virou o slug.',
  'absolute-asset-refs':
    'O index.html tem caminhos começando com "/", que não carregam dentro da prévia.',
  'shadowed-by-repo':
    'Existe uma prévia no repositório com o mesmo slug, e a URL pública mostra a versão do repositório.',
};

export function previewUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pansarini.dev'}/preview/${slug}`;
}

export function previewAssetHref(slug: string, path: string): string {
  return `/client-previews/${slug}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < KB) return `${numberFormat.format(bytes)} B`;
  if (bytes < MB) return `${numberFormat.format(bytes / KB)} KB`;
  return `${numberFormat.format(bytes / MB)} MB`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

export function listAdminPreviews(index: PreviewIndex): AdminPreview[] {
  const repoRows = clientPreviews.map(
    (preview): AdminPreview => ({
      ...preview,
      source: 'repo',
      url: previewUrl(preview.slug),
      hasIndex: true,
      files: [],
      fileCount: null,
      totalSize: null,
      updatedAt: null,
      warnings: [],
    }),
  );
  const blobRows = index.previews.map(
    (preview): AdminPreview => ({ ...preview, source: 'blob', url: previewUrl(preview.slug) }),
  );
  return [...repoRows, ...blobRows];
}

export function findAdminPreview(index: PreviewIndex, slug: string): AdminPreview | undefined {
  const rows = listAdminPreviews(index).filter((row) => row.slug === slug);
  return rows.find((row) => row.source === 'blob') ?? rows[0];
}

export function publicUrls(previews: readonly AdminPreview[]): string[] {
  const resolving = previews.filter((preview) => preview.hasIndex && isPreviewSlug(preview.slug));
  return [...new Set(resolving.map((preview) => preview.url))];
}
