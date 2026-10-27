'use server';

import { randomUUID } from 'node:crypto';
import { requireAdminAction } from '@/lib/admin/auth';
import {
  deleteLeadFiles,
  deleteRecordFile,
  readPdfUpload,
  uploadRecordPdf,
} from '@/lib/admin/lead-files';
import {
  findLead,
  findLeadRecord,
  insertLead,
  insertLeadRecord,
  removeLead,
  removeLeadRecord,
  saveLead,
} from '@/lib/admin/lead-store';
import {
  type LeadFormErrors,
  type LeadFormValues,
  type LeadRecordAttachment,
  type LeadRecordFormErrors,
  type LeadRecordFormValues,
  isLeadId,
  isLeadStage,
  parseInitialStage,
  parseLeadInput,
  parseLeadRecordInput,
  readLeadForm,
  readLeadRecordForm,
} from '@/lib/admin/leads';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

export type LeadFormState = {
  errors: LeadFormErrors;
  message: string | null;
  values: LeadFormValues | null;
  attempt: number;
};

export type LeadRecordFormState = {
  errors: LeadRecordFormErrors;
  message: string | null;
  values: LeadRecordFormValues | null;
  attempt: number;
};

const UNAVAILABLE_MESSAGE = 'Não foi possível salvar: o Redis está indisponível.';
const MISSING_MESSAGE = 'Este lead não existe mais.';
const UPLOAD_FAILED_MESSAGE = 'Não foi possível enviar o PDF. Tente de novo.';
// A rejected submit remounts the form, and a file input can't be refilled from state.
const RESELECT_FILE_MESSAGE = 'Escolha o PDF de novo antes de salvar.';

function rejected(
  previous: LeadFormState,
  values: LeadFormValues,
  errors: LeadFormErrors,
  message: string | null = null,
): LeadFormState {
  return { errors, message, values, attempt: previous.attempt + 1 };
}

function recordRejected(
  previous: LeadRecordFormState,
  values: LeadRecordFormValues,
  errors: LeadRecordFormErrors,
  message: string | null = null,
): LeadRecordFormState {
  return { errors, message, values, attempt: previous.attempt + 1 };
}

export async function createLead(
  previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  await requireAdminAction();
  const values = readLeadForm(formData);
  const parsed = parseLeadInput(values);
  const stage = parseInitialStage(values.stage);
  const errors: LeadFormErrors = parsed.ok ? {} : { ...parsed.errors };
  if (stage === null) errors.stage = 'Escolha uma etapa da lista.';
  if (!parsed.ok || stage === null) return rejected(previous, values, errors);

  const now = new Date().toISOString();
  try {
    await insertLead({
      id: randomUUID(),
      ...parsed.input,
      stage,
      history: [{ stage, at: now }],
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    return rejected(previous, values, {}, UNAVAILABLE_MESSAGE);
  }
  redirect('/admin/leads');
}

export async function updateLead(
  id: string,
  previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  await requireAdminAction();
  const values = readLeadForm(formData);
  if (!isLeadId(id)) return rejected(previous, values, {}, MISSING_MESSAGE);
  const parsed = parseLeadInput(values);
  if (!parsed.ok) return rejected(previous, values, parsed.errors);

  const { available, lead } = await findLead(id);
  if (!available) return rejected(previous, values, {}, UNAVAILABLE_MESSAGE);
  if (!lead) return rejected(previous, values, {}, MISSING_MESSAGE);
  try {
    await saveLead({ ...lead, ...parsed.input, updatedAt: new Date().toISOString() });
  } catch {
    return rejected(previous, values, {}, UNAVAILABLE_MESSAGE);
  }
  redirect('/admin/leads');
}

export async function moveLead(id: string, formData: FormData): Promise<void> {
  await requireAdminAction();
  const stage = formData.get('stage');
  if (!isLeadId(id) || !isLeadStage(stage)) return;
  const { lead } = await findLead(id);
  if (!lead || lead.stage === stage) return;

  const now = new Date().toISOString();
  await saveLead({
    ...lead,
    stage,
    history: [...lead.history, { stage, at: now }],
    updatedAt: now,
  });
  refresh();
}

export async function deleteLead(id: string): Promise<void> {
  await requireAdminAction();
  if (!isLeadId(id)) return;
  await removeLead(id);
  await deleteLeadFiles(id);
  redirect('/admin/leads');
}

export async function createLeadRecord(
  leadId: string,
  previous: LeadRecordFormState,
  formData: FormData,
): Promise<LeadRecordFormState> {
  await requireAdminAction();
  const values = readLeadRecordForm(formData);
  if (!isLeadId(leadId)) return recordRejected(previous, values, {}, MISSING_MESSAGE);
  const parsed = parseLeadRecordInput(values);
  const file = await readPdfUpload(formData.get('file'));
  const reselect: LeadRecordFormErrors =
    file.ok && file.upload ? { file: RESELECT_FILE_MESSAGE } : {};
  const errors: LeadRecordFormErrors = parsed.ok ? {} : { ...reselect, ...parsed.errors };
  if (!file.ok) errors.file = file.error;
  if (!parsed.ok || !file.ok) return recordRejected(previous, values, errors);

  const { available, lead } = await findLead(leadId);
  if (!available) return recordRejected(previous, values, reselect, UNAVAILABLE_MESSAGE);
  if (!lead) return recordRejected(previous, values, {}, MISSING_MESSAGE);

  const id = randomUUID();
  let attachment: LeadRecordAttachment | null = null;
  if (file.upload) {
    try {
      attachment = await uploadRecordPdf(leadId, id, file.upload);
    } catch {
      return recordRejected(previous, values, reselect, UPLOAD_FAILED_MESSAGE);
    }
  }
  try {
    await insertLeadRecord(leadId, {
      id,
      ...parsed.input,
      attachment,
      createdAt: new Date().toISOString(),
    });
  } catch {
    if (attachment) await deleteRecordFile(attachment.pathname);
    return recordRejected(previous, values, reselect, UNAVAILABLE_MESSAGE);
  }
  // A lead deleted while the PDF uploaded would leave this record and file behind;
  // a delete after this check removes both on its own.
  const after = await findLead(leadId);
  if (after.available && !after.lead) {
    await removeLeadRecord(leadId, id);
    if (attachment) await deleteRecordFile(attachment.pathname);
    return recordRejected(previous, values, {}, MISSING_MESSAGE);
  }
  refresh();
  return { errors: {}, message: null, values: null, attempt: previous.attempt + 1 };
}

export async function deleteLeadRecord(leadId: string, recordId: string): Promise<void> {
  await requireAdminAction();
  if (!isLeadId(leadId) || !isLeadId(recordId)) return;
  const { record } = await findLeadRecord(leadId, recordId);
  await removeLeadRecord(leadId, recordId);
  if (record?.attachment) await deleteRecordFile(record.attachment.pathname);
  refresh();
}
