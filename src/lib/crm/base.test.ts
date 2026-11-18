import type { Lead } from '@/lib/admin/leads';
import { describe, expect, it } from 'vitest';
import { filterBase, leadsToCsv, parseBaseFilter } from './base';

function lead(overrides: Partial<Lead>): Lead {
  return {
    id: 'a',
    name: 'Clínica Sorriso',
    website: null,
    source: 'google-maps',
    sourceUrl: null,
    whatsapp: null,
    email: null,
    phone: null,
    instagram: null,
    previewSlug: null,
    nextStep: null,
    dueDate: null,
    notes: null,
    stage: 'prospectado',
    history: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('base de leads', () => {
  it('parses the stage and trims the query', () => {
    expect(parseBaseFilter({ q: '  oi ', etapa: 'fechado' })).toEqual({
      q: 'oi',
      stage: 'fechado',
    });
    expect(parseBaseFilter({ etapa: 'nada' })).toEqual({ q: '', stage: null });
  });

  it('searches ignoring case and accents, and filters by stage', () => {
    const leads = [
      lead({ id: '1' }),
      lead({ id: '2', name: 'Barbearia', stage: 'fechado', extras: { city: 'Jundiaí' } }),
    ];
    expect(filterBase(leads, { q: 'clinica', stage: null }).map((l) => l.id)).toEqual(['1']);
    expect(filterBase(leads, { q: 'jundiai', stage: null }).map((l) => l.id)).toEqual(['2']);
    expect(filterBase(leads, { q: '', stage: 'fechado' }).map((l) => l.id)).toEqual(['2']);
  });

  it('escapes CSV cells', () => {
    const csv = leadsToCsv([lead({ name: 'A, "B"' })]);
    expect(csv.split('\n')[1]).toContain('"A, ""B"""');
  });
});
