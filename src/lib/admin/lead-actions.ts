'use server';

import { randomUUID } from 'node:crypto';
import { requireAdmin } from '@/lib/admin/auth';
import { findLead, insertLead, removeLead, saveLead } from '@/lib/admin/lead-store';
import {
  type LeadFormErrors,
  type LeadFormValues,
  isLeadId,
  isLeadStage,
  parseInitialStage,
  parseLeadInput,
  readLeadForm,
} from '@/lib/admin/leads';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

export type LeadFormState = {
  errors: LeadFormErrors;
  message: string | null;
  values: LeadFormValues | null;
  attempt: number;
};

const UNAVAILABLE_MESSAGE = 'Não foi possível salvar: o Redis está indisponível.';
const MISSING_MESSAGE = 'Este lead não existe mais.';

function rejected(
  previous: LeadFormState,
  values: LeadFormValues,
  errors: LeadFormErrors,
  message: string | null = null,
): LeadFormState {
  return { errors, message, values, attempt: previous.attempt + 1 };
}

export async function createLead(
  previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  if (!isLeadId(id)) return;
  await removeLead(id);
  redirect('/admin/leads');
}
