import { getAdminCredentials, verifySession } from '@/lib/admin/auth';
import { findLeadRecord } from '@/lib/admin/lead-store';
import { type LeadRecordAttachment, isLeadId } from '@/lib/admin/leads';
import { del, get, list, put } from '@vercel/blob';

export const LEAD_FILES_ROOT = '_leads';
export const MAX_RECORD_PDF_BYTES = 4 * 1024 * 1024;

const PDF_MAGIC = '%PDF-';
const MAX_NAME_LENGTH = 120;
const DELETE_BATCH_SIZE = 100;
const TOO_BIG_MESSAGE = 'O PDF pode ter no máximo 4 MB.';
const NOT_PDF_MESSAGE = 'Envie um arquivo PDF.';

export type PdfUpload = { bytes: Buffer; name: string; size: number };

export function leadFilesPrefix(leadId: string): string {
  return `${LEAD_FILES_ROOT}/${leadId}/`;
}

export function recordFilePath(leadId: string, recordId: string): string {
  return `${leadFilesPrefix(leadId)}${recordId}.pdf`;
}

export function isPdfBytes(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.subarray(0, PDF_MAGIC.length)).toString('latin1') === PDF_MAGIC;
}

export function safeAttachmentName(raw: string, fallback: string): string {
  const name = (raw.split(/[\\/]/).pop() ?? '')
    .replace(/[\p{Cc}"\\]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const base = (name || fallback)
    .replace(/\.pdf$/i, '')
    .slice(0, MAX_NAME_LENGTH - '.pdf'.length)
    .trim();
  return `${base || fallback.replace(/\.pdf$/i, '')}.pdf`;
}

export function contentDisposition(name: string): string {
  const clean = name.replace(/[\p{Cc}"\\]/gu, '');
  const ascii = clean
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x20-\x7e]/g, '_');
  const encoded = encodeURIComponent(clean).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function readPdfUpload(
  value: FormDataEntryValue | null,
): Promise<{ ok: true; upload: PdfUpload | null } | { ok: false; error: string }> {
  if (!(value instanceof File) || (value.size === 0 && value.name === '')) {
    return { ok: true, upload: null };
  }
  if (value.size > MAX_RECORD_PDF_BYTES) return { ok: false, error: TOO_BIG_MESSAGE };
  const head = new Uint8Array(await value.slice(0, PDF_MAGIC.length).arrayBuffer());
  if (!isPdfBytes(head)) return { ok: false, error: NOT_PDF_MESSAGE };
  return {
    ok: true,
    upload: {
      bytes: Buffer.from(await value.arrayBuffer()),
      name: safeAttachmentName(value.name, 'documento.pdf'),
      size: value.size,
    },
  };
}

export async function uploadRecordPdf(
  leadId: string,
  recordId: string,
  upload: PdfUpload,
): Promise<LeadRecordAttachment> {
  const result = await put(recordFilePath(leadId, recordId), upload.bytes, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: 'application/pdf',
  });
  return {
    pathname: result.pathname,
    name: upload.name,
    contentType: 'application/pdf',
    size: upload.size,
  };
}

export async function deleteRecordFile(pathname: string): Promise<void> {
  try {
    await del(pathname);
  } catch {
    // Best effort: the Redis record is already gone, and an orphan blob is only storage.
  }
}

export async function deleteLeadFiles(leadId: string): Promise<void> {
  const pathnames: string[] = [];
  try {
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
      const page = await list({ mode: 'expanded', prefix: leadFilesPrefix(leadId), cursor });
      for (const blob of page.blobs) pathnames.push(blob.pathname);
      cursor = page.cursor;
      hasMore = page.hasMore;
    }
  } catch {
    return;
  }
  for (let start = 0; start < pathnames.length; start += DELETE_BATCH_SIZE) {
    try {
      await del(pathnames.slice(start, start + DELETE_BATCH_SIZE));
    } catch {
      // Keep going: one failed batch should not keep the others around.
    }
  }
}

function notFoundResponse(): Response {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export async function serveRecordFile(
  leadId: string,
  recordId: string,
  sessionToken: string | undefined,
): Promise<Response> {
  const credentials = getAdminCredentials();
  if (!credentials || !verifySession(sessionToken, credentials)) return notFoundResponse();
  if (!isLeadId(leadId) || !isLeadId(recordId)) return notFoundResponse();

  const { available, record } = await findLeadRecord(leadId, recordId);
  if (!available) {
    return new Response('Service unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  const attachment = record?.attachment;
  if (!attachment?.pathname.startsWith(leadFilesPrefix(leadId))) return notFoundResponse();

  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(attachment.pathname, { access: 'private' });
  } catch {
    return notFoundResponse();
  }
  if (result?.statusCode !== 200) return notFoundResponse();

  return new Response(result.stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition(attachment.name),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
