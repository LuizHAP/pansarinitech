import type { Redis } from '@upstash/redis';
import type { Inflight } from './campaign-step';
import { CAMPAIGN_KEYS, type Campaign, type CampaignTarget } from './contract';

const inflightKey = (id: string) => `campaigns:inflight:${id}`;

export async function listCampaigns(redis: Redis): Promise<Campaign[]> {
  const ids = await redis.zrange<string[]>(CAMPAIGN_KEYS.index, 0, -1, { rev: true });
  if (ids.length === 0) return [];
  const records = await redis.mget<(Campaign | null)[]>(...ids.map(CAMPAIGN_KEYS.campaign));
  return records.filter((campaign): campaign is Campaign => campaign !== null);
}

export async function getCampaign(redis: Redis, id: string): Promise<Campaign | null> {
  return redis.get<Campaign>(CAMPAIGN_KEYS.campaign(id));
}

export async function saveCampaign(redis: Redis, campaign: Campaign): Promise<void> {
  const transaction = redis.multi();
  transaction.set(CAMPAIGN_KEYS.campaign(campaign.id), campaign);
  transaction.zadd(CAMPAIGN_KEYS.index, { score: campaign.createdAt, member: campaign.id });
  await transaction.exec();
}

export async function removeCampaign(redis: Redis, id: string): Promise<void> {
  const transaction = redis.multi();
  transaction.zrem(CAMPAIGN_KEYS.index, id);
  transaction.del(CAMPAIGN_KEYS.campaign(id), CAMPAIGN_KEYS.targets(id), inflightKey(id));
  await transaction.exec();
}

export async function getTargets(
  redis: Redis,
  campaign: Pick<Campaign, 'id' | 'leadIds'>,
): Promise<CampaignTarget[]> {
  const hash = await redis.hgetall<Record<string, CampaignTarget>>(
    CAMPAIGN_KEYS.targets(campaign.id),
  );
  return campaign.leadIds.flatMap((leadId) => {
    const target = hash?.[leadId];
    return target ? [target] : [];
  });
}

export async function setTarget(redis: Redis, id: string, target: CampaignTarget): Promise<void> {
  await redis.hset(CAMPAIGN_KEYS.targets(id), { [target.leadId]: target });
}

export async function replaceTargets(
  redis: Redis,
  id: string,
  targets: readonly CampaignTarget[],
): Promise<void> {
  const transaction = redis.multi();
  transaction.del(CAMPAIGN_KEYS.targets(id));
  if (targets.length > 0) {
    transaction.hset(
      CAMPAIGN_KEYS.targets(id),
      Object.fromEntries(targets.map((target) => [target.leadId, target])),
    );
  }
  await transaction.exec();
}

export async function getInflight(redis: Redis, id: string): Promise<Inflight | null> {
  return redis.get<Inflight>(inflightKey(id));
}

export async function setInflight(redis: Redis, id: string, value: Inflight): Promise<void> {
  await redis.set(inflightKey(id), value);
}

export async function clearInflight(redis: Redis, id: string): Promise<void> {
  await redis.del(inflightKey(id));
}
