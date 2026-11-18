import { describe, expect, it } from 'vitest';
import type { WebsiteAudit } from './audit';
import { type ScorableLead, buildMessage, hasOwnWebsite, priorityFor, scoreLead } from './score';

const NOW = () => new Date('2026-11-18T12:00:00.000Z');

function lead(overrides: Partial<ScorableLead> = {}): ScorableLead {
  return {
    name: 'Padaria Boa',
    website: null,
    whatsapp: '5511912345678',
    phone: null,
    email: null,
    instagram: null,
    extras: { category: 'Padaria', rating: 4.7, reviews: 120 },
    ...overrides,
  };
}

function audit(overrides: Partial<WebsiteAudit> = {}): WebsiteAudit {
  return {
    url: 'https://padaria.com.br',
    finalUrl: 'https://padaria.com.br/',
    reachable: true,
    error: null,
    statusCode: 200,
    https: true,
    loadTimeMs: 900,
    responsive: true,
    hasTitle: true,
    hasDescription: true,
    hasH1: true,
    hasWhatsapp: true,
    hasForm: true,
    hasAnalytics: true,
    hasPixel: true,
    instagram: true,
    ...overrides,
  };
}

describe('hasOwnWebsite', () => {
  it.each([
    ['https://padaria.com.br', true],
    ['padaria.com.br', true],
    [null, false],
    ['', false],
    ['https://instagram.com/padaria', false],
    ['https://linktr.ee/padaria', false],
    ['https://www.facebook.com/padaria', false],
    ['http://', false],
    ['semponto', false],
  ])('%s -> %s', (website, expected) => {
    expect(hasOwnWebsite(website)).toBe(expected);
  });
});

describe('priorityFor', () => {
  it('maps thresholds', () => {
    expect([priorityFor(70), priorityFor(69), priorityFor(45), priorityFor(44)]).toEqual([
      'alta',
      'media',
      'media',
      'baixa',
    ]);
  });
});

describe('scoreLead', () => {
  it('rates an established business without a site as high priority', () => {
    const score = scoreLead(lead(), null, NOW);
    expect(score.priority).toBe('alta');
    expect(score.signals.semSite).toBe(true);
    expect(score.reasons[0]).toMatch(/^Sem site/);
    expect(score.suggestedMessage).toContain('ainda não têm um site');
    expect(score.suggestedMessage).toContain('Padaria Boa');
    expect(score.suggestedMessage).toContain('padaria');
    expect(score.analyzedAt).toBe('2026-11-18T12:00:00.000Z');
    expect(score.engine).toBe('local');
  });

  it('treats a social profile as no site', () => {
    const score = scoreLead(lead({ website: 'https://instagram.com/padaria' }), null, NOW);
    expect(score.signals.semSite).toBe(true);
    expect(score.reasons[0]).toMatch(/rede social/);
  });

  it('scores a weak site above a healthy one', () => {
    const weak = scoreLead(
      lead({ website: 'http://padaria.com.br' }),
      audit({
        https: false,
        responsive: false,
        hasWhatsapp: false,
        hasForm: false,
        hasAnalytics: false,
        hasPixel: false,
        loadTimeMs: 5000,
        hasTitle: false,
      }),
      NOW,
    );
    const healthy = scoreLead(lead({ website: 'https://padaria.com.br' }), audit(), NOW);
    expect(weak.value).toBeGreaterThan(healthy.value);
    expect(weak.signals).toMatchObject({ https: false, responsivo: false, whatsappNoSite: false });
    expect(weak.suggestedMessage).toMatch(/notei que/);
    expect(healthy.reasons).toContain('Site em bom estado, pouca margem pra oferecer melhoria.');
    expect(healthy.suggestedMessage).toContain('ficou bom');
  });

  it('treats an unreachable site as an opportunity', () => {
    const score = scoreLead(
      lead({ website: 'https://padaria.com.br' }),
      audit({ reachable: false, error: 'Tempo esgotado.' }),
      NOW,
    );
    expect(score.signals.siteAcessivel).toBe(false);
    expect(score.reasons[0]).toContain('fora do ar');
    expect(score.suggestedMessage).toContain('ainda não têm um site');
  });

  it('notes a site that has not been audited yet', () => {
    const score = scoreLead(lead({ website: 'https://padaria.com.br' }), null, NOW);
    expect(score.reasons[0]).toBe('O site ainda não foi auditado.');
    expect(score.signals.siteAcessivel).toBeNull();
  });

  it('weighs reachability: WhatsApp beats phone beats nothing', () => {
    const withWa = scoreLead(lead(), null, NOW).value;
    const withPhone = scoreLead(lead({ whatsapp: null, phone: '1133334444' }), null, NOW).value;
    const none = scoreLead(lead({ whatsapp: null }), null, NOW).value;
    expect(withWa).toBeGreaterThan(withPhone);
    expect(withPhone).toBeGreaterThan(none);
  });

  it('weighs rating and reviews', () => {
    const strong = scoreLead(
      lead({ extras: { category: 'Clínica', rating: 4.8, reviews: 400 } }),
      null,
      NOW,
    );
    const weak = scoreLead(lead({ extras: { rating: 3, reviews: 2 } }), null, NOW);
    expect(strong.value).toBeGreaterThan(weak.value);
    expect(strong.reasons.join(' ')).toContain('Negócio estabelecido');
  });

  it('handles a lead with no extras and mid reviews', () => {
    expect(scoreLead(lead({ extras: undefined, whatsapp: null }), null, NOW).value).toBeLessThan(
      60,
    );
    const mid = scoreLead(lead({ extras: { rating: 4.1, reviews: 12 } }), null, NOW);
    expect(mid.reasons.join(' ')).toContain('12 avaliações');
    expect(
      scoreLead(lead({ extras: { reviews: 60, rating: 3.6 } }), null, NOW).value,
    ).toBeGreaterThan(0);
  });

  it('keeps the value in 0..100 and caps reasons', () => {
    const score = scoreLead(
      lead({
        instagram: 'padaria',
        email: 'a@b.co',
        extras: { category: 'Clínica', rating: 5, reviews: 900 },
      }),
      null,
      NOW,
    );
    expect(score.value).toBeLessThanOrEqual(100);
    expect(score.reasons.length).toBeLessThanOrEqual(8);
  });

  it('uses a generic intro without a category', () => {
    expect(buildMessage(lead({ extras: undefined }), false, [])).not.toContain(
      'Trabalho com sites',
    );
  });
});
