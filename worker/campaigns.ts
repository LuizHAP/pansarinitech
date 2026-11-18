import { randomUUID } from 'node:crypto';
import { leadKey } from '@/lib/admin/lead-store';
import type { Lead } from '@/lib/admin/leads';
import { hasReplied, renderTemplate } from '@/lib/crm/campaign';
import { type StepState, nextAction } from '@/lib/crm/campaign-step';
import {
  clearInflight,
  getCampaign,
  getInflight,
  getTargets,
  listCampaigns,
  saveCampaign,
  setInflight,
  setTarget,
} from '@/lib/crm/campaign-store';
import {
  type Campaign,
  type CampaignTarget,
  WA_HEARTBEAT_MAX_AGE_MS,
  WA_KEYS,
  type WaOutboxItem,
  type WaSendResult,
  type WaStatus,
} from '@/lib/crm/contract';
import { type WorkerContext, sleep } from './context';

const LOOP_MS = 5000;

async function isWaReady(ctx: WorkerContext): Promise<boolean> {
  const status = await ctx.redis.get<WaStatus>(WA_KEYS.status);
  return (
    status?.status === 'connected' && Date.now() - status.heartbeatAt <= WA_HEARTBEAT_MAX_AGE_MS
  );
}

async function refreshReplies(
  ctx: WorkerContext,
  campaign: Campaign,
  targets: CampaignTarget[],
): Promise<CampaignTarget[]> {
  const candidates = targets.filter((target) => target.status === 'sent');
  if (candidates.length === 0) return targets;
  const leads = await ctx.redis.mget<(Lead | null)[]>(...candidates.map((t) => leadKey(t.leadId)));
  const updated = new Map<string, CampaignTarget>();
  candidates.forEach((target, index) => {
    const lead = leads[index];
    const repliedAt = lead ? hasReplied(lead, target) : null;
    if (repliedAt !== null) updated.set(target.leadId, { ...target, status: 'replied', repliedAt });
  });
  for (const target of updated.values()) await setTarget(ctx.redis, campaign.id, target);
  return targets.map((target) => updated.get(target.leadId) ?? target);
}

async function enqueue(
  ctx: WorkerContext,
  campaign: Campaign,
  target: CampaignTarget,
  delayMs: number,
): Promise<void> {
  const { redis } = ctx;
  const lead = await redis.get<Lead>(leadKey(target.leadId));
  const phone = lead?.whatsapp;
  if (!lead || !phone) {
    await setTarget(redis, campaign.id, {
      ...target,
      status: 'skipped',
      error: lead ? 'Lead sem WhatsApp' : 'Lead removido',
    });
    return;
  }
  const now = Date.now();
  const item: WaOutboxItem = {
    id: randomUUID(),
    phone,
    text: renderTemplate(campaign.template, lead),
    leadId: lead.id,
    campaignId: campaign.id,
    notBefore: now + delayMs,
    createdAt: now,
  };
  await setInflight(redis, campaign.id, { leadId: lead.id, outboxId: item.id, queuedAt: now });
  await redis.rpush(WA_KEYS.outbox, item);
  await setTarget(redis, campaign.id, { ...target, status: 'queued', error: null });
}

async function processCampaign(ctx: WorkerContext, campaignId: string, waReady: boolean) {
  const { redis } = ctx;
  let campaign = await getCampaign(redis, campaignId);
  if (!campaign) return;
  let targets = await getTargets(redis, campaign);
  if (campaign.status === 'running') targets = await refreshReplies(ctx, campaign, targets);

  const inflight = await getInflight(redis, campaign.id);
  const sendResult = inflight
    ? await redis.get<WaSendResult>(WA_KEYS.sent(inflight.outboxId))
    : null;
  let outboxHasItem = false;
  if (inflight && !sendResult) {
    const items = await redis.lrange<WaOutboxItem>(WA_KEYS.outbox, 0, -1);
    outboxHasItem = items.some((item) => item.id === inflight.outboxId);
  }

  const state: StepState = {
    campaign,
    targets,
    inflight,
    sendResult,
    outboxHasItem,
    waReady,
  };
  const action = nextAction(state, Date.now(), Math.random);
  const find = (leadId: string) => targets.find((target) => target.leadId === leadId);

  switch (action.type) {
    case 'activate':
      campaign = { ...campaign, status: 'running', updatedAt: Date.now() };
      await saveCampaign(redis, campaign);
      return;
    case 'finish':
      await saveCampaign(redis, { ...campaign, status: 'done', updatedAt: Date.now() });
      ctx.log.info({ campaignId: campaign.id }, 'campanha concluída');
      return;
    case 'resolve': {
      const target = find(action.leadId);
      if (target) {
        await setTarget(
          redis,
          campaign.id,
          action.result.ok
            ? { ...target, status: 'sent', sentAt: action.result.ts, error: null }
            : { ...target, status: 'failed', error: action.result.error ?? 'Falha no envio' },
        );
      }
      await clearInflight(redis, campaign.id);
      return;
    }
    case 'requeue': {
      const target = find(action.leadId);
      if (target) await setTarget(redis, campaign.id, { ...target, status: 'pending' });
      await clearInflight(redis, campaign.id);
      return;
    }
    case 'enqueue': {
      const target = find(action.leadId);
      if (target) await enqueue(ctx, campaign, target, action.delayMs);
      return;
    }
    case 'idle':
      return;
  }
}

export async function start(ctx: WorkerContext): Promise<void> {
  for (;;) {
    try {
      const active = (await listCampaigns(ctx.redis)).filter(
        (campaign) => campaign.status === 'running' || campaign.status === 'scheduled',
      );
      if (active.length > 0) {
        const waReady = await isWaReady(ctx);
        for (const campaign of active) {
          try {
            await processCampaign(ctx, campaign.id, waReady);
          } catch (error) {
            ctx.log.error({ err: error, campaignId: campaign.id }, 'erro ao processar campanha');
          }
        }
      }
    } catch (error) {
      ctx.log.error({ err: error }, 'erro no laço de campanhas');
    }
    await sleep(LOOP_MS);
  }
}
