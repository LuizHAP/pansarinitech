import { QUEUED_STALE_MS, nextDelayMs, remainingToday } from './campaign';
import type { Campaign, CampaignTarget, WaSendResult } from './contract';

export type Inflight = { leadId: string; outboxId: string; queuedAt: number };

export type StepState = {
  campaign: Campaign;
  targets: readonly CampaignTarget[];
  inflight: Inflight | null;
  sendResult: WaSendResult | null;
  outboxHasItem: boolean;
  waReady: boolean;
};

export type StepAction =
  | { type: 'idle' }
  | { type: 'activate' }
  | { type: 'finish' }
  | { type: 'resolve'; leadId: string; result: WaSendResult }
  | { type: 'requeue'; leadId: string }
  | { type: 'enqueue'; leadId: string; delayMs: number };

export function nextAction(state: StepState, now: number, rng: () => number): StepAction {
  const { campaign, targets, inflight } = state;
  if (campaign.status === 'scheduled') {
    return campaign.startAt !== null && campaign.startAt <= now
      ? { type: 'activate' }
      : { type: 'idle' };
  }
  if (campaign.status !== 'running') return { type: 'idle' };

  if (inflight) {
    if (state.sendResult) {
      return { type: 'resolve', leadId: inflight.leadId, result: state.sendResult };
    }
    if (!state.outboxHasItem && now - inflight.queuedAt > QUEUED_STALE_MS) {
      return { type: 'requeue', leadId: inflight.leadId };
    }
    return { type: 'idle' };
  }

  const orphan = targets.find((target) => target.status === 'queued');
  if (orphan) return { type: 'requeue', leadId: orphan.leadId };

  const next = targets.find((target) => target.status === 'pending');
  if (!next) return { type: 'finish' };

  if (!state.waReady || remainingToday(campaign, targets, now) <= 0) return { type: 'idle' };
  return {
    type: 'enqueue',
    leadId: next.leadId,
    delayMs: nextDelayMs(campaign.minDelaySec, campaign.maxDelaySec, rng),
  };
}
