import { randomUUID } from 'node:crypto';
import { deleteRecordFile, uploadRecordPdf } from '@/lib/admin/lead-files';
import { findLead, insertLeadRecord, listLeads, removeLeadRecord } from '@/lib/admin/lead-store';
import { type Lead, type LeadRecordAttachment, isLeadId } from '@/lib/admin/leads';
import { proposalPdfFileName, renderProposalPdf } from '@/lib/proposals/render';
import { parseProposal } from '@/lib/proposals/schema';
import { proposalSummary } from '@/lib/proposals/summary';
import { authorizeLeadsApi, jsonResponse, pdfResponse, readJsonBody } from './http';

export const MAX_SEARCH_RESULTS = 50;

export type LeadSearchResult = Pick<Lead, 'id' | 'name' | 'stage' | 'previewSlug' | 'instagram'>;

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function searchLeads(leads: readonly Lead[], q: string): LeadSearchResult[] {
  const query = fold(q.trim());
  return leads
    .filter((lead) => fold(lead.name).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, MAX_SEARCH_RESULTS)
    .map(({ id, name, stage, previewSlug, instagram }) => ({
      id,
      name,
      stage,
      previewSlug,
      instagram,
    }));
}

const unavailable = () => jsonResponse({ error: 'unavailable' }, 503);
const leadNotFound = () => jsonResponse({ error: 'lead_not_found' }, 404);

export async function listLeadsApi(request: Request): Promise<Response> {
  const denied = authorizeLeadsApi(request);
  if (denied) return denied;
  const { available, leads } = await listLeads();
  if (!available) return unavailable();
  const q = new URL(request.url).searchParams.get('q') ?? '';
  return jsonResponse({ leads: searchLeads(leads, q) }, 200);
}

export async function createProposalApi(
  request: Request,
  leadId: string,
  now: Date = new Date(),
): Promise<Response> {
  const denied = authorizeLeadsApi(request);
  if (denied) return denied;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = parseProposal(body.value, now);
  if (!parsed.ok) return jsonResponse({ errors: parsed.errors }, 400);
  if (!isLeadId(leadId)) return leadNotFound();
  const { available, lead } = await findLead(leadId);
  if (!available) return unavailable();
  if (!lead) return leadNotFound();

  const { proposal } = parsed;
  const pdf = await renderProposalPdf(proposal);
  const fileName = proposalPdfFileName(proposal);
  const url = new URL(request.url);
  if (url.searchParams.get('dryRun') === '1') return pdfResponse(pdf, fileName);

  const recordId = randomUUID();
  let attachment: LeadRecordAttachment;
  try {
    attachment = await uploadRecordPdf(leadId, recordId, {
      bytes: pdf,
      name: fileName,
      size: pdf.length,
    });
  } catch {
    return jsonResponse({ error: 'upload_failed' }, 502);
  }

  const title = proposal.title ?? `Proposta: ${proposal.clientName}`;
  try {
    await insertLeadRecord(leadId, {
      id: recordId,
      kind: 'proposta',
      date: proposal.date,
      title,
      body: proposalSummary(proposal),
      link: proposal.previewUrl ?? null,
      attachment,
      createdAt: now.toISOString(),
    });
  } catch {
    await deleteRecordFile(attachment.pathname);
    return unavailable();
  }

  // A lead deleted while the PDF rendered would leave this record and file behind;
  // a delete after this check removes both on its own.
  const after = await findLead(leadId);
  if (after.available && !after.lead) {
    await removeLeadRecord(leadId, recordId);
    await deleteRecordFile(attachment.pathname);
    return leadNotFound();
  }

  return jsonResponse(
    {
      record: { id: recordId, title },
      pdfUrl: `${url.origin}/admin/leads/${leadId}/records/${recordId}/file`,
      leadUrl: `${url.origin}/admin/leads/${leadId}`,
    },
    201,
  );
}
