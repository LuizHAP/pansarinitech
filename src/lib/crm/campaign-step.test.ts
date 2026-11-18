import { describe, expect, it } from 'vitest';
import { QUEUED_STALE_MS } from './campaign';
import { type StepState, nextAction } from './campaign-step';
import type { Campaign, CampaignTarget } from './contract';

const NOW = Date.parse('2026-03-10T15:00:00Z');
const campaign = (over: Partial<Campaign> = {}): Campaign => ({
  id: 'c1',
  name: 'x',
  template: 'oi',
  status: 'running',
  leadIds: ['a', 'b'],
  startAt: null,
  minDelaySec: 30,
  maxDelaySec: 90,
  dailyLimit: 2,
  createdAt: 0,
  updatedAt: 0,
  ...over,
});
const target = (leadId: string, over: Partial<CampaignTarget> = {}): CampaignTarget => ({
  leadId,
  status: 'pending',
  sentAt: null,
  repliedAt: null,
  error: null,
  ...over,
});
const state = (over: Partial<StepState> = {}): StepState => ({
  campaign: campaign(),
  targets: [target('a'), target('b')],
  inflight: null,
  sendResult: null,
  outboxHasItem: false,
  waReady: true,
  ...over,
});
const rng = () => 0;

describe('nextAction', () => {
  it('enqueues the first pending target with a bounded delay', () => {
    expect(nextAction(state(), NOW, rng)).toEqual({
      type: 'enqueue',
      leadId: 'a',
      delayMs: 30_000,
    });
  });

  it('does nothing while WhatsApp is not ready', () => {
    expect(nextAction(state({ waReady: false }), NOW, rng)).toEqual({ type: 'idle' });
  });

  it('does nothing for draft, paused and done campaigns', () => {
    for (const status of ['draft', 'paused', 'done'] as const) {
      expect(nextAction(state({ campaign: campaign({ status }) }), NOW, rng)).toEqual({
        type: 'idle',
      });
    }
  });

  it('activates a scheduled campaign only after startAt', () => {
    const scheduled = (startAt: number) =>
      state({ campaign: campaign({ status: 'scheduled', startAt }) });
    expect(nextAction(scheduled(NOW + 1000), NOW, rng)).toEqual({ type: 'idle' });
    expect(nextAction(scheduled(NOW - 1), NOW, rng)).toEqual({ type: 'activate' });
  });

  it('waits for the outstanding item and resolves it once sent', () => {
    const inflight = { leadId: 'a', outboxId: 'o1', queuedAt: NOW - 1000 };
    const base = state({
      inflight,
      targets: [target('a', { status: 'queued' }), target('b')],
      outboxHasItem: true,
    });
    expect(nextAction(base, NOW, rng)).toEqual({ type: 'idle' });
    const result = { ok: true, ts: NOW, error: null };
    expect(nextAction({ ...base, sendResult: result }, NOW, rng)).toEqual({
      type: 'resolve',
      leadId: 'a',
      result,
    });
  });

  it('resolves a result even when WhatsApp dropped', () => {
    const inflight = { leadId: 'a', outboxId: 'o1', queuedAt: NOW - 1000 };
    const result = { ok: false, ts: NOW, error: 'x' };
    const action = nextAction(state({ inflight, sendResult: result, waReady: false }), NOW, rng);
    expect(action.type).toBe('resolve');
  });

  it('requeues a stale item that vanished from the outbox', () => {
    const inflight = { leadId: 'a', outboxId: 'o1', queuedAt: NOW - QUEUED_STALE_MS - 1 };
    const targets = [target('a', { status: 'queued' }), target('b')];
    expect(nextAction(state({ inflight, targets }), NOW, rng)).toEqual({
      type: 'requeue',
      leadId: 'a',
    });
    expect(nextAction(state({ inflight, targets, outboxHasItem: true }), NOW, rng)).toEqual({
      type: 'idle',
    });
  });

  it('requeues a queued target with no inflight record', () => {
    const targets = [target('a', { status: 'queued' })];
    expect(nextAction(state({ targets }), NOW, rng)).toEqual({ type: 'requeue', leadId: 'a' });
  });

  it('stops at the daily limit', () => {
    const sentAt = NOW - 60_000;
    const targets = [
      target('a', { status: 'sent', sentAt }),
      target('b', { status: 'replied', sentAt }),
      target('c'),
    ];
    expect(nextAction(state({ targets }), NOW, rng)).toEqual({ type: 'idle' });
    expect(nextAction(state({ targets }), NOW + 24 * 3600_000, rng).type).toBe('enqueue');
  });

  it('finishes when nothing is pending or queued', () => {
    const targets = [
      target('a', { status: 'sent', sentAt: NOW }),
      target('b', { status: 'failed' }),
    ];
    expect(nextAction(state({ targets }), NOW, rng)).toEqual({ type: 'finish' });
  });
});
