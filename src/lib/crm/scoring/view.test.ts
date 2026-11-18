import type { Lead } from '@/lib/admin/leads';
import type { LeadScore } from '@/lib/crm/contract';
import { describe, expect, it } from 'vitest';
import {
  describeSignals,
  filterByPriority,
  leadViewHref,
  parseLeadView,
  sortByScore,
  unscoredLeadIds,
} from './view';

function scored(id: string, value: number | null, priority: LeadScore['priority'] = 'media'): Lead {
  return {
    id,
    extras: value === null ? undefined : { score: { value, priority } as LeadScore },
  } as Lead;
}

describe('parseLeadView / leadViewHref', () => {
  it('parses valid params and ignores junk', () => {
    expect(parseLeadView({ prioridade: 'alta', ordem: 'score' })).toEqual({
      priority: 'alta',
      sort: 'score',
      job: null,
    });
    expect(parseLeadView({ prioridade: ['sem', 'alta'] })).toEqual({
      priority: 'sem',
      sort: null,
      job: null,
    });
    expect(parseLeadView({ prioridade: 'x', ordem: 'y' })).toEqual({
      priority: null,
      sort: null,
      job: null,
    });
    expect(parseLeadView({})).toEqual({ priority: null, sort: null, job: null });
  });

  it('keeps a valid scrape job id and drops a malformed one', () => {
    expect(parseLeadView({ job: 'abc-123' }).job).toBe('abc-123');
    expect(parseLeadView({ job: '../x' }).job).toBeNull();
  });

  it('builds hrefs', () => {
    expect(leadViewHref({ priority: null, sort: null, job: null })).toBe('/admin/leads');
    expect(leadViewHref({ priority: 'alta', sort: 'score', job: null })).toBe(
      '/admin/leads?prioridade=alta&ordem=score',
    );
  });
});

describe('lead list helpers', () => {
  const leads = [scored('a', 40, 'baixa'), scored('b', null), scored('c', 90, 'alta')];

  it('filters by priority and by missing score', () => {
    expect(filterByPriority(leads, null)).toHaveLength(3);
    expect(filterByPriority(leads, 'alta').map((l) => l.id)).toEqual(['c']);
    expect(filterByPriority(leads, 'sem').map((l) => l.id)).toEqual(['b']);
  });

  it('sorts by score with unscored last, without mutating', () => {
    expect(sortByScore(leads).map((l) => l.id)).toEqual(['c', 'a', 'b']);
    expect(leads.map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('lists unscored ids', () => {
    expect(unscoredLeadIds(leads)).toEqual(['b']);
  });
});

describe('describeSignals', () => {
  it('highlights no site as a gap', () => {
    expect(describeSignals({ semSite: true, whatsappContato: true, instagram: false })).toEqual([
      { label: 'Sem site', tone: 'gap' },
      { label: 'WhatsApp do lead', tone: 'ok' },
      { label: 'Sem Instagram', tone: 'neutral' },
    ]);
  });

  it('describes site audit signals and load time', () => {
    const views = describeSignals({
      semSite: false,
      https: false,
      responsivo: true,
      carregamentoMs: 4200,
    });
    expect(views).toEqual([
      { label: 'Sem HTTPS', tone: 'gap' },
      { label: 'Adaptado ao celular', tone: 'ok' },
      { label: 'Carrega em 4.2s', tone: 'gap' },
    ]);
    expect(describeSignals({ carregamentoMs: 1000 })[0]?.tone).toBe('ok');
  });
});
