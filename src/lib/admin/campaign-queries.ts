import { getLeadsRedis, listLeads } from '@/lib/admin/lead-store';
import type { Lead } from '@/lib/admin/leads';
import { type CampaignMetrics, computeMetrics, hasReplied } from '@/lib/crm/campaign';
import { getCampaign, getTargets, listCampaigns } from '@/lib/crm/campaign-store';
import type { Campaign, CampaignTarget } from '@/lib/crm/contract';
import type { Redis } from '@upstash/redis';

export type CampaignSummary = { campaign: Campaign; metrics: CampaignMetrics };

export type TargetRow = CampaignTarget & { name: string; phone: string | null };

export type CampaignSnapshot = {
  campaign: Campaign;
  metrics: CampaignMetrics;
  rows: TargetRow[];
};

const ACTIVE = new Set<Campaign['status']>(['running', 'scheduled', 'paused']);

export async function busyLeadIds(redis: Redis, exceptId: string | null): Promise<Set<string>> {
  const campaigns = await listCampaigns(redis);
  const busy = new Set<string>();
  for (const campaign of campaigns) {
    if (campaign.id === exceptId || !ACTIVE.has(campaign.status)) continue;
    for (const leadId of campaign.leadIds) busy.add(leadId);
  }
  return busy;
}

function overlayReplies(targets: CampaignTarget[], leadsById: Map<string, Lead>): CampaignTarget[] {
  return targets.map((target) => {
    const lead = leadsById.get(target.leadId);
    const repliedAt = target.status === 'sent' && lead ? hasReplied(lead, target) : null;
    return repliedAt === null ? target : { ...target, status: 'replied', repliedAt };
  });
}

export async function loadCampaignList(): Promise<{
  available: boolean;
  items: CampaignSummary[];
}> {
  const redis = getLeadsRedis();
  if (!redis) return { available: false, items: [] };
  try {
    const [campaigns, { leads }] = await Promise.all([listCampaigns(redis), listLeads()]);
    const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
    const items = await Promise.all(
      campaigns.map(async (campaign) => ({
        campaign,
        metrics: computeMetrics(overlayReplies(await getTargets(redis, campaign), leadsById)),
      })),
    );
    return { available: true, items };
  } catch {
    return { available: false, items: [] };
  }
}

export async function loadCampaignSnapshot(id: string): Promise<CampaignSnapshot | null> {
  const redis = getLeadsRedis();
  if (!redis) return null;
  const campaign = await getCampaign(redis, id);
  if (!campaign) return null;
  const { leads } = await listLeads();
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  const targets = overlayReplies(await getTargets(redis, campaign), leadsById);
  return {
    campaign,
    metrics: computeMetrics(targets),
    rows: targets.map((target) => ({
      ...target,
      name: leadsById.get(target.leadId)?.name ?? 'Lead removido',
      phone: leadsById.get(target.leadId)?.whatsapp ?? null,
    })),
  };
}
