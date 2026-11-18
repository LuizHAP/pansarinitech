import type { Lead } from '@/lib/admin/leads';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DAILY_LIMIT,
  EMPTY_FILTERS,
  MAX_DAILY_LIMIT,
  MAX_TARGETS,
  SAMPLE_LEAD,
  computeMetrics,
  dayKey,
  hasReplied,
  nextDelayMs,
  normalizeSettings,
  previewTemplate,
  remainingToday,
  renderTemplate,
  selectLeads,
  sentToday,
  validateTemplate,
} from './campaign';
import type { Campaign, CampaignTarget } from './contract';

const lead = (over: Partial<Lead> = {}): Lead => ({ ...SAMPLE_LEAD, ...over });
const target = (over: Partial<CampaignTarget> = {}): CampaignTarget => ({
  leadId: 'a',
  status: 'pending',
  sentAt: null,
  repliedAt: null,
  error: null,
  ...over,
});

describe('template', () => {
  it('renders variables', () => {
    expect(
      renderTemplate('Oi {{primeiro_nome}} da {{empresa}} em {{cidade}} ({{categoria}})', lead()),
    ).toBe('Oi Padaria da Padaria Estrela do Sul em São Paulo (Padaria)');
  });

  it('picks spintax options with the injected rng', () => {
    expect(renderTemplate('{Oi|Olá|E aí}', lead(), () => 0)).toBe('Oi');
    expect(renderTemplate('{Oi|Olá|E aí}', lead(), () => 0.99)).toBe('E aí');
  });

  it('resolves nested spintax', () => {
    expect(renderTemplate('{a|{b|c}}', lead(), () => 0.99)).toBe('c');
  });

  it('does not let lead values inject spintax', () => {
    expect(renderTemplate('{{nome}}', lead({ name: 'A {x|y} B' }), () => 0)).toBe('A xy B');
  });

  it('leaves empty values out without double spaces', () => {
    expect(renderTemplate('Oi {{cidade}} amigo', lead({ extras: {} }))).toBe('Oi amigo');
  });

  it('rejects unknown variables in pt-BR', () => {
    expect(validateTemplate('Oi {{telefone}}')).toMatch(/Variável desconhecida: \{\{telefone\}\}/);
  });

  it('rejects empty, oversized, unbalanced and pipe-less groups', () => {
    expect(validateTemplate('  ')).not.toBeNull();
    expect(validateTemplate('x'.repeat(1001))).not.toBeNull();
    expect(validateTemplate('{Oi|Olá')).toMatch(/desbalanceadas/);
    expect(validateTemplate('Oi {Olá}')).toMatch(/precisa de opções/);
  });

  it('accepts a valid template and previews with the sample lead', () => {
    const template = '{Oi|Olá}, {{primeiro_nome}}!';
    expect(validateTemplate(template)).toBeNull();
    expect(previewTemplate(template)).toBe('Oi, Padaria!');
  });
});

describe('settings', () => {
  it('applies safe defaults', () => {
    const result = normalizeSettings({});
    expect(result).toEqual({
      ok: true,
      settings: { dailyLimit: DEFAULT_DAILY_LIMIT, minDelaySec: 30, maxDelaySec: 90 },
    });
  });

  it('caps the daily limit at the server maximum', () => {
    const result = normalizeSettings({ dailyLimit: 5000 });
    expect(result.ok && result.settings.dailyLimit).toBe(MAX_DAILY_LIMIT);
  });

  it('rejects delays below the floor and inverted ranges', () => {
    expect(normalizeSettings({ minDelaySec: 19 }).ok).toBe(false);
    expect(normalizeSettings({ minDelaySec: 60, maxDelaySec: 40 }).ok).toBe(false);
    expect(normalizeSettings({ dailyLimit: 0 }).ok).toBe(false);
  });
});

describe('delay', () => {
  it('stays inside the bounds', () => {
    expect(nextDelayMs(30, 90, () => 0)).toBe(30_000);
    expect(nextDelayMs(30, 90, () => 0.5)).toBe(60_000);
    expect(nextDelayMs(30, 90, () => 0.999999)).toBeLessThanOrEqual(90_000);
  });
});

describe('daily quota', () => {
  const campaign: Pick<Campaign, 'dailyLimit'> = { dailyLimit: 2 };

  it('uses the Sao Paulo day boundary', () => {
    const before = Date.parse('2026-03-10T02:59:00Z');
    const after = Date.parse('2026-03-10T03:01:00Z');
    expect(dayKey(before)).toBe('2026-03-09');
    expect(dayKey(after)).toBe('2026-03-10');
  });

  it('counts only today sends and stops at the limit', () => {
    const now = Date.parse('2026-03-10T15:00:00Z');
    const targets = [
      target({ leadId: '1', status: 'sent', sentAt: Date.parse('2026-03-10T12:00:00Z') }),
      target({ leadId: '2', status: 'replied', sentAt: Date.parse('2026-03-10T13:00:00Z') }),
      target({ leadId: '3', status: 'sent', sentAt: Date.parse('2026-03-09T20:00:00Z') }),
      target({ leadId: '4', status: 'failed', sentAt: null }),
    ];
    expect(sentToday(targets, now)).toBe(2);
    expect(remainingToday(campaign, targets, now)).toBe(0);
    expect(remainingToday(campaign, targets, Date.parse('2026-03-11T15:00:00Z'))).toBe(2);
  });

  it('never exceeds the server cap even with a tampered limit', () => {
    expect(remainingToday({ dailyLimit: 9999 }, [], Date.now())).toBe(MAX_DAILY_LIMIT);
  });
});

describe('eligibility', () => {
  const leads = [
    lead({
      id: '1',
      extras: { score: { value: 80 } as never, city: 'Santos', category: 'Padaria' },
    }),
    lead({ id: '2', whatsapp: null }),
    lead({ id: '3', stage: 'fechado' }),
    lead({ id: '4', stage: 'em-conversa' }),
    lead({ id: '5', source: 'instagram', extras: { score: { value: 20 } as never } }),
    lead({ id: '6' }),
  ];

  it('applies defaults, counts exclusions and sorts by score', () => {
    const result = selectLeads(leads, EMPTY_FILTERS, new Set(['6']));
    expect(result.leads.map((l) => l.id)).toEqual(['1', '5']);
    expect(result.noWhatsapp).toBe(1);
    expect(result.inOtherCampaign).toBe(1);
  });

  it('filters by score, source, category and city', () => {
    expect(selectLeads(leads, { ...EMPTY_FILTERS, minScore: 50 }).leads.map((l) => l.id)).toEqual([
      '1',
    ]);
    expect(
      selectLeads(leads, { ...EMPTY_FILTERS, sources: ['instagram'] }).leads.map((l) => l.id),
    ).toEqual(['5']);
    expect(
      selectLeads(leads, { ...EMPTY_FILTERS, category: 'padar', city: 'sant' }).leads.map(
        (l) => l.id,
      ),
    ).toEqual(['1']);
  });

  it('honors explicitly chosen stages', () => {
    const result = selectLeads(leads, { ...EMPTY_FILTERS, stages: ['fechado'] });
    expect(result.leads.map((l) => l.id)).toEqual(['3']);
  });

  it('caps the target count', () => {
    const many = Array.from({ length: MAX_TARGETS + 20 }, (_, i) => lead({ id: String(i) }));
    const result = selectLeads(many, EMPTY_FILTERS);
    expect(result.leads).toHaveLength(MAX_TARGETS);
    expect(result.truncated).toBe(true);
  });
});

describe('reply detection', () => {
  it('detects a reply after the send', () => {
    const sentAt = Date.parse('2026-03-10T12:00:00Z');
    const withReply = { extras: { lastReplyAt: '2026-03-10T13:00:00Z' } };
    expect(hasReplied(withReply, { sentAt })).toBe(Date.parse('2026-03-10T13:00:00Z'));
  });

  it('ignores earlier replies, missing data and unsent targets', () => {
    const sentAt = Date.parse('2026-03-10T12:00:00Z');
    expect(hasReplied({ extras: { lastReplyAt: '2026-03-10T11:00:00Z' } }, { sentAt })).toBeNull();
    expect(hasReplied({ extras: {} }, { sentAt })).toBeNull();
    expect(
      hasReplied({ extras: { lastReplyAt: '2026-03-10T13:00:00Z' } }, { sentAt: null }),
    ).toBeNull();
  });
});

describe('metrics', () => {
  it('summarizes the targets', () => {
    const metrics = computeMetrics([
      target({ status: 'sent' }),
      target({ status: 'sent' }),
      target({ status: 'replied' }),
      target({ status: 'failed' }),
      target({ status: 'pending' }),
      target({ status: 'skipped' }),
    ]);
    expect(metrics).toMatchObject({
      total: 6,
      sent: 3,
      replied: 1,
      failed: 1,
      pending: 1,
      skipped: 1,
    });
    expect(metrics.replyRate).toBeCloseTo(1 / 3);
    expect(metrics.progress).toBeCloseTo(5 / 6);
  });

  it('handles an empty campaign', () => {
    expect(computeMetrics([])).toMatchObject({ replyRate: 0, progress: 0 });
  });
});
