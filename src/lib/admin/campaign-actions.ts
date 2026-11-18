'use server';

import { randomUUID } from 'node:crypto';
import { requireAdminAction } from '@/lib/admin/auth';
import { busyLeadIds } from '@/lib/admin/campaign-queries';
import { getLeadsRedis, listLeads } from '@/lib/admin/lead-store';
import {
  type CampaignSettingsInput,
  type SelectionFilters,
  normalizeSettings,
  previewTemplate,
  selectLeads,
  validateTemplate,
} from '@/lib/crm/campaign';
import {
  getCampaign,
  getTargets,
  removeCampaign,
  replaceTargets,
  saveCampaign,
  setTarget,
} from '@/lib/crm/campaign-store';
import type { Campaign, CampaignTarget } from '@/lib/crm/contract';
import type { Redis } from '@upstash/redis';

export type CampaignDraftInput = {
  id?: string | null;
  name: string;
  template: string;
  filters: SelectionFilters;
  settings: CampaignSettingsInput;
  startAt: string | null;
};

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export type SelectionPreview = {
  error: string | null;
  count: number;
  noWhatsapp: number;
  inOtherCampaign: number;
  truncated: boolean;
  firstMessage: string | null;
  firstLeadName: string | null;
};

function redisOrNull(): Redis | null {
  return getLeadsRedis();
}

export async function previewSelection(
  template: string,
  filters: SelectionFilters,
  exceptId: string | null = null,
): Promise<SelectionPreview> {
  await requireAdminAction();
  const redis = redisOrNull();
  const empty = { count: 0, noWhatsapp: 0, inOtherCampaign: 0, truncated: false };
  if (!redis) {
    return { ...empty, error: 'Redis indisponível.', firstMessage: null, firstLeadName: null };
  }
  const [{ leads }, busy] = await Promise.all([listLeads(), busyLeadIds(redis, exceptId)]);
  const selection = selectLeads(leads, filters, busy);
  const first = selection.leads[0] ?? null;
  const error = validateTemplate(template);
  return {
    error,
    count: selection.matching,
    noWhatsapp: selection.noWhatsapp,
    inOtherCampaign: selection.inOtherCampaign,
    truncated: selection.truncated,
    firstMessage: error || !first ? null : previewTemplate(template, first),
    firstLeadName: first?.name ?? null,
  };
}

export async function saveDraft(input: CampaignDraftInput): Promise<ActionResult> {
  await requireAdminAction();
  const redis = redisOrNull();
  if (!redis) return { ok: false, error: 'Redis indisponível.' };

  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Dê um nome à campanha.' };
  if (name.length > 120) return { ok: false, error: 'O nome passa de 120 caracteres.' };
  const templateError = validateTemplate(input.template);
  if (templateError) return { ok: false, error: templateError };
  const settings = normalizeSettings(input.settings);
  if (!settings.ok) return settings;
  const startAt = input.startAt ? Date.parse(input.startAt) : null;
  if (input.startAt && !Number.isFinite(startAt)) {
    return { ok: false, error: 'Horário de início inválido.' };
  }

  const existing = input.id ? await getCampaign(redis, input.id) : null;
  if (input.id && !existing) return { ok: false, error: 'Campanha não encontrada.' };
  if (existing && existing.status !== 'draft') {
    return { ok: false, error: 'Só é possível editar campanhas em rascunho.' };
  }

  const { leads } = await listLeads();
  const selection = selectLeads(
    leads,
    input.filters,
    await busyLeadIds(redis, existing?.id ?? null),
  );
  if (selection.leads.length === 0) {
    return { ok: false, error: 'Nenhum lead com WhatsApp corresponde aos filtros.' };
  }

  const now = Date.now();
  const campaign: Campaign = {
    id: existing?.id ?? randomUUID(),
    name,
    template: input.template,
    status: 'draft',
    leadIds: selection.leads.map((lead) => lead.id),
    startAt,
    ...settings.settings,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await replaceTargets(
    redis,
    campaign.id,
    campaign.leadIds.map((leadId) => ({
      leadId,
      status: 'pending',
      sentAt: null,
      repliedAt: null,
      error: null,
    })),
  );
  await saveCampaign(redis, campaign);
  return { ok: true, id: campaign.id };
}

export async function startCampaign(id: string): Promise<ActionResult> {
  await requireAdminAction();
  const redis = redisOrNull();
  if (!redis) return { ok: false, error: 'Redis indisponível.' };
  const campaign = await getCampaign(redis, id);
  if (!campaign) return { ok: false, error: 'Campanha não encontrada.' };
  if (campaign.status !== 'draft') return { ok: false, error: 'A campanha já foi iniciada.' };
  const templateError = validateTemplate(campaign.template);
  if (templateError) return { ok: false, error: templateError };

  const busy = await busyLeadIds(redis, id);
  const targets = await getTargets(redis, campaign);
  let remaining = 0;
  for (const target of targets) {
    if (target.status !== 'pending') continue;
    if (busy.has(target.leadId)) {
      await setTarget(redis, id, {
        ...target,
        status: 'skipped',
        error: 'Já está em outra campanha ativa',
      });
    } else {
      remaining++;
    }
  }
  if (remaining === 0) {
    return { ok: false, error: 'Todos os leads já estão em outras campanhas ativas.' };
  }

  const now = Date.now();
  const scheduled = campaign.startAt !== null && campaign.startAt > now;
  await saveCampaign(redis, {
    ...campaign,
    status: scheduled ? 'scheduled' : 'running',
    updatedAt: now,
  });
  return { ok: true, id };
}

async function transition(
  id: string,
  from: Campaign['status'][],
  to: Campaign['status'],
  error: string,
): Promise<ActionResult> {
  await requireAdminAction();
  const redis = redisOrNull();
  if (!redis) return { ok: false, error: 'Redis indisponível.' };
  const campaign = await getCampaign(redis, id);
  if (!campaign) return { ok: false, error: 'Campanha não encontrada.' };
  if (!from.includes(campaign.status)) return { ok: false, error };
  await saveCampaign(redis, { ...campaign, status: to, updatedAt: Date.now() });
  return { ok: true, id };
}

export async function pauseCampaign(id: string): Promise<ActionResult> {
  return transition(id, ['running', 'scheduled'], 'paused', 'A campanha não está em andamento.');
}

export async function resumeCampaign(id: string): Promise<ActionResult> {
  return transition(id, ['paused'], 'running', 'A campanha não está pausada.');
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  await requireAdminAction();
  const redis = redisOrNull();
  if (!redis) return { ok: false, error: 'Redis indisponível.' };
  const campaign = await getCampaign(redis, id);
  if (!campaign) return { ok: false, error: 'Campanha não encontrada.' };
  if (campaign.status === 'running') {
    return { ok: false, error: 'Pause a campanha antes de excluir.' };
  }
  await removeCampaign(redis, id);
  return { ok: true, id };
}
