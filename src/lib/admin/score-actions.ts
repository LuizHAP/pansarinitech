'use server';

import { requireAdminAction } from '@/lib/admin/auth';
import { findLead, saveLead } from '@/lib/admin/lead-store';
import { isLeadId } from '@/lib/admin/leads';
import type { LeadScore } from '@/lib/crm/contract';
import { analyzeLead } from '@/lib/crm/scoring/analyze';
import { SCORE_BATCH_SIZE, SCORE_CONCURRENCY } from '@/lib/crm/scoring/view';

export type ScoreResult =
  | { id: string; ok: true; score: LeadScore }
  | { id: string; ok: false; error: string };

const MISSING_MESSAGE = 'Este lead não existe mais.';
const UNAVAILABLE_MESSAGE = 'O Redis está indisponível.';

async function scoreOne(id: string): Promise<ScoreResult> {
  if (!isLeadId(id)) return { id, ok: false, error: MISSING_MESSAGE };
  const first = await findLead(id);
  if (!first.available) return { id, ok: false, error: UNAVAILABLE_MESSAGE };
  if (!first.lead) return { id, ok: false, error: MISSING_MESSAGE };

  try {
    const score = await analyzeLead(first.lead);
    // The analysis takes seconds; re-read so edits made meanwhile are not overwritten.
    const { lead } = await findLead(id);
    if (!lead) return { id, ok: false, error: MISSING_MESSAGE };
    await saveLead({ ...lead, extras: { ...lead.extras, score } });
    return { id, ok: true, score };
  } catch {
    return { id, ok: false, error: 'Não foi possível analisar este lead.' };
  }
}

export async function scoreLeadAction(id: string): Promise<ScoreResult> {
  await requireAdminAction();
  return scoreOne(id);
}

export async function scoreLeadsAction(
  ids: string[],
): Promise<{ results: ScoreResult[]; remaining: string[] }> {
  await requireAdminAction();
  const unique = [...new Set(ids)];
  const batch = unique.slice(0, SCORE_BATCH_SIZE);
  const results: ScoreResult[] = new Array(batch.length);
  let next = 0;
  const worker = async () => {
    while (next < batch.length) {
      const index = next++;
      results[index] = await scoreOne(batch[index] as string);
    }
  };
  await Promise.all(Array.from({ length: Math.min(SCORE_CONCURRENCY, batch.length) }, worker));
  return { results, remaining: unique.slice(SCORE_BATCH_SIZE) };
}
