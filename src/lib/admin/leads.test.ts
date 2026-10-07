import { randomUUID } from 'node:crypto';
import type { IndexedPreview, PreviewIndex } from '@/lib/client-preview-source';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BOARD_STAGES,
  LEAD_SOURCES,
  LEAD_STAGES,
  type Lead,
  type LeadFormValues,
  PREVIEW_STATUS_LABELS,
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  STAGE_LABELS,
  STAGE_OPTIONS,
  formatDueDate,
  groupLeadsByStage,
  instagramHref,
  isLeadId,
  isLeadStage,
  isOverdue,
  leadFormValues,
  leadPreviewOptions,
  mailtoHref,
  parseInitialStage,
  parseLeadInput,
  previewStatus,
  readLeadForm,
  telHref,
  todayInSaoPaulo,
  whatsappHref,
} from './leads';

const BLANK: LeadFormValues = {
  name: 'Padaria',
  website: '',
  source: 'google-maps',
  sourceUrl: '',
  whatsapp: '',
  email: '',
  phone: '',
  instagram: '',
  previewSlug: '',
  nextStep: '',
  dueDate: '',
  notes: '',
  stage: '',
};

function values(overrides: Partial<LeadFormValues> = {}): LeadFormValues {
  return { ...BLANK, ...overrides };
}

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: randomUUID(),
    name: 'Padaria',
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
    history: [{ stage: 'prospectado', at: '2026-10-01T12:00:00.000Z' }],
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

function indexed(slug: string, overrides: Partial<IndexedPreview> = {}): IndexedPreview {
  return {
    slug,
    client: slug,
    locale: 'pt',
    hasIndex: true,
    disabled: false,
    files: [{ path: 'index.html', size: 10, uploadedAt: '2026-10-01T00:00:00.000Z' }],
    fileCount: 1,
    totalSize: 10,
    updatedAt: '2026-10-01T00:00:00.000Z',
    warnings: [],
    ...overrides,
  };
}

function index(available: boolean, ...previews: IndexedPreview[]): PreviewIndex {
  return { generatedAt: '2026-10-05T00:00:00.000Z', available, previews };
}

function errorsFor(input: LeadFormValues) {
  const result = parseLeadInput(input);
  if (result.ok) throw new Error('expected validation errors');
  return result.errors;
}

function inputFor(input: LeadFormValues) {
  const result = parseLeadInput(input);
  if (!result.ok) throw new Error(`unexpected errors: ${JSON.stringify(result.errors)}`);
  return result.input;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('constants', () => {
  it('orders the stages and keeps Perdido off the board columns', () => {
    expect(LEAD_STAGES).toEqual([
      'prospectado',
      'previa-pronta',
      'contatado',
      'em-conversa',
      'proposta',
      'fechado',
      'perdido',
    ]);
    expect(BOARD_STAGES).toEqual(LEAD_STAGES.slice(0, 6));
  });

  it('labels stages and sources in pt-BR, in order', () => {
    expect(STAGE_LABELS).toEqual({
      prospectado: 'Prospectado',
      'previa-pronta': 'Prévia pronta',
      contatado: 'Contatado',
      'em-conversa': 'Em conversa',
      proposta: 'Proposta',
      fechado: 'Fechado',
      perdido: 'Perdido',
    });
    expect(LEAD_SOURCES).toEqual(['google-maps', 'instagram', 'facebook', 'indicacao', 'outro']);
    expect(SOURCE_LABELS).toEqual({
      'google-maps': 'Google Maps',
      instagram: 'Instagram',
      facebook: 'Facebook',
      indicacao: 'Indicação',
      outro: 'Outro',
    });
    expect(STAGE_OPTIONS).toEqual(
      LEAD_STAGES.map((value) => ({ value, label: STAGE_LABELS[value] })),
    );
    expect(SOURCE_OPTIONS).toEqual(
      LEAD_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value] })),
    );
  });
});

describe('isLeadId', () => {
  it('accepts a lowercase UUID v4 only', () => {
    const id = randomUUID();
    expect(isLeadId(id)).toBe(true);
    expect(isLeadId(id.toUpperCase())).toBe(false);
    expect(isLeadId('abc')).toBe(false);
    expect(isLeadId('../x')).toBe(false);
    expect(isLeadId('')).toBe(false);
  });
});

describe('isLeadStage', () => {
  it('accepts every stage and nothing else', () => {
    for (const stage of LEAD_STAGES) expect(isLeadStage(stage)).toBe(true);
    expect(isLeadStage('ganho')).toBe(false);
    expect(isLeadStage(1)).toBe(false);
  });
});

describe('readLeadForm', () => {
  it('reads every field untrimmed, with missing fields and files as empty strings', () => {
    const data = new FormData();
    data.set('name', ' Padaria ');
    data.set('notes', new File(['x'], 'notes.txt'));
    data.set('stage', 'contatado');

    expect(readLeadForm(data)).toEqual({
      name: ' Padaria ',
      website: '',
      source: '',
      sourceUrl: '',
      whatsapp: '',
      email: '',
      phone: '',
      instagram: '',
      previewSlug: '',
      nextStep: '',
      dueDate: '',
      notes: '',
      stage: 'contatado',
    });
  });
});

describe('parseLeadInput', () => {
  it('trims and normalizes a full valid form', () => {
    expect(
      parseLeadInput(
        values({
          name: ' Padaria ',
          website: 'padaria.com.br',
          source: 'instagram',
          sourceUrl: '',
          whatsapp: '(11) 91234-5678',
          email: ' a@b.co ',
          phone: '(11) 3333-4444',
          instagram: '@padaria',
          previewSlug: 'acme',
          nextStep: ' Mandar a prévia ',
          dueDate: ' 2026-10-07 ',
          notes: ' Gosta de azul ',
        }),
      ),
    ).toEqual({
      ok: true,
      input: {
        name: 'Padaria',
        website: 'https://padaria.com.br',
        source: 'instagram',
        sourceUrl: null,
        whatsapp: '5511912345678',
        email: 'a@b.co',
        phone: '(11) 3333-4444',
        instagram: 'padaria',
        previewSlug: 'acme',
        nextStep: 'Mandar a prévia',
        dueDate: '2026-10-07',
        notes: 'Gosta de azul',
      },
    });
  });

  it('turns every empty optional field into null', () => {
    expect(inputFor(values({ website: ' ', notes: '  ' }))).toEqual({
      name: 'Padaria',
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
    });
  });

  it.each([
    ['padaria.com.br', 'https://padaria.com.br'],
    ['http://x.com/a', 'http://x.com/a'],
    ['https://www.padaria.com.br/cardapio?x=1', 'https://www.padaria.com.br/cardapio?x=1'],
  ])('keeps the website %s as %s', (website, expected) => {
    expect(inputFor(values({ website })).website).toBe(expected);
    expect(inputFor(values({ sourceUrl: website })).sourceUrl).toBe(expected);
  });

  it.each([
    ['(11) 91234-5678', '5511912345678'],
    ['+55 11 91234-5678', '5511912345678'],
    ['011 91234-5678', '5511912345678'],
    ['(11) 3333-4444', '551133334444'],
    ['+1 415 555 0100', '14155550100'],
  ])('stores the WhatsApp %s as %s', (whatsapp, expected) => {
    expect(inputFor(values({ whatsapp })).whatsapp).toBe(expected);
  });

  it.each([
    '@padaria',
    'padaria',
    'https://www.instagram.com/padaria/',
    'instagram.com/padaria?igsh=1',
  ])('stores the Instagram %s as the bare handle', (instagram) => {
    expect(inputFor(values({ instagram })).instagram).toBe('padaria');
  });

  it('keeps the phone as typed', () => {
    expect(inputFor(values({ phone: ' +55 (11) 3333-4444 ' })).phone).toBe('+55 (11) 3333-4444');
  });

  it.each<[keyof LeadFormValues, string, string]>([
    ['name', '   ', 'Informe o nome do negócio.'],
    ['name', 'x'.repeat(121), 'Use no máximo 120 caracteres.'],
    ['notes', 'x'.repeat(5001), 'Use no máximo 5000 caracteres.'],
    ['nextStep', 'x'.repeat(201), 'Use no máximo 200 caracteres.'],
    ['website', `https://x.com/${'a'.repeat(490)}`, 'Use no máximo 500 caracteres.'],
    ['email', `${'a'.repeat(250)}@b.co`, 'Use no máximo 254 caracteres.'],
    ['phone', '1'.repeat(31), 'Use no máximo 30 caracteres.'],
    ['whatsapp', '1'.repeat(31), 'Use no máximo 30 caracteres.'],
    ['instagram', 'x'.repeat(101), 'Use no máximo 100 caracteres.'],
    ['website', 'javascript:alert(1)', 'Informe um endereço válido, como exemplo.com.br.'],
    ['website', 'ftp://x.com', 'Informe um endereço válido, como exemplo.com.br.'],
    ['website', 'localhost', 'Informe um endereço válido, como exemplo.com.br.'],
    ['website', 'padaria .com', 'Informe um endereço válido, como exemplo.com.br.'],
    ['sourceUrl', 'javascript:alert(1)', 'Informe um endereço válido, como exemplo.com.br.'],
    ['source', 'tiktok', 'Escolha de onde veio o lead.'],
    ['whatsapp', '91234-5678', 'Informe o WhatsApp com DDD, como (11) 91234-5678.'],
    ['whatsapp', '+55 11 91234-5678 1234', 'Informe o WhatsApp com DDD, como (11) 91234-5678.'],
    ['email', 'x', 'Informe um e-mail válido.'],
    ['email', 'a@b', 'Informe um e-mail válido.'],
    ['phone', '123', 'Informe o telefone com DDD.'],
    ['instagram', 'pada ria', 'Informe o @ ou o link do perfil.'],
    ['instagram', 'instagram.com/p/abc', 'Informe o @ ou o link do perfil.'],
    ['previewSlug', 'Bad_Slug', 'Escolha uma prévia da lista.'],
    ['dueDate', '2026-02-30', 'Informe uma data válida.'],
    ['dueDate', '07/10/2026', 'Informe uma data válida.'],
  ])('rejects %s %j with its pt-BR message', (field, value, message) => {
    expect(errorsFor(values({ [field]: value }))).toEqual({ [field]: message });
  });

  it('reports every bad field at once', () => {
    expect(
      errorsFor(
        values({
          name: '',
          website: 'localhost',
          email: 'x',
          whatsapp: '123',
          dueDate: '2026-13-01',
        }),
      ),
    ).toEqual({
      name: 'Informe o nome do negócio.',
      website: 'Informe um endereço válido, como exemplo.com.br.',
      email: 'Informe um e-mail válido.',
      whatsapp: 'Informe o WhatsApp com DDD, como (11) 91234-5678.',
      dueDate: 'Informe uma data válida.',
    });
  });
});

describe('parseInitialStage', () => {
  it('defaults to Prospectado and rejects unknown stages', () => {
    expect(parseInitialStage('')).toBe('prospectado');
    expect(parseInitialStage('contatado')).toBe('contatado');
    expect(parseInitialStage('ganho')).toBeNull();
  });
});

describe('leadFormValues', () => {
  it('starts a new lead blank on Google Maps and Prospectado', () => {
    expect(leadFormValues()).toEqual({
      name: '',
      website: '',
      source: 'google-maps',
      sourceUrl: '',
      whatsapp: '',
      email: '',
      phone: '',
      instagram: '',
      previewSlug: '',
      nextStep: '',
      dueDate: '',
      notes: '',
      stage: 'prospectado',
    });
  });

  it('maps nulls to empty strings', () => {
    const blank = lead({ stage: 'contatado' });
    expect(leadFormValues(blank)).toEqual({
      ...leadFormValues(),
      name: 'Padaria',
      stage: 'contatado',
    });
  });

  it('round-trips a stored lead through the form unchanged', () => {
    const stored = lead({
      website: 'https://padaria.com.br',
      source: 'facebook',
      sourceUrl: 'https://facebook.com/padaria',
      whatsapp: '14155550100',
      email: 'a@b.co',
      phone: '(11) 3333-4444',
      instagram: 'padaria',
      previewSlug: 'acme',
      nextStep: 'Ligar',
      dueDate: '2026-10-07',
      notes: 'Gosta de azul',
    });
    const formValues = leadFormValues(stored);

    expect(formValues.instagram).toBe('@padaria');
    expect(formValues.whatsapp).toBe('+14155550100');
    const { id, stage, history, createdAt, updatedAt, ...input } = stored;
    expect(parseLeadInput(formValues)).toEqual({ ok: true, input });
  });
});

describe('hrefs', () => {
  it('builds WhatsApp, phone, e-mail and Instagram links', () => {
    expect(whatsappHref('5511912345678')).toBe('https://wa.me/5511912345678');
    expect(telHref('(11) 3333-4444')).toBe('tel:1133334444');
    expect(telHref('+55 11 3333-4444')).toBe('tel:+551133334444');
    expect(mailtoHref('a@b.co')).toBe('mailto:a@b.co');
    expect(instagramHref('padaria')).toBe('https://www.instagram.com/padaria/');
  });
});

describe('todayInSaoPaulo', () => {
  it('uses the São Paulo calendar day whatever the server time zone', () => {
    vi.stubEnv('TZ', 'UTC');
    expect(todayInSaoPaulo(new Date('2026-10-08T02:30:00Z'))).toBe('2026-10-07');
    expect(todayInSaoPaulo(new Date('2026-10-08T03:30:00Z'))).toBe('2026-10-08');
    expect(todayInSaoPaulo()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isOverdue', () => {
  it('is late only before today', () => {
    expect(isOverdue('2026-10-06', '2026-10-07')).toBe(true);
    expect(isOverdue('2026-10-07', '2026-10-07')).toBe(false);
    expect(isOverdue(null, '2026-10-07')).toBe(false);
  });
});

describe('formatDueDate', () => {
  it('formats the calendar date without shifting a day', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(formatDueDate('2026-10-07')).toBe('07/10/2026');
  });
});

describe('groupLeadsByStage', () => {
  it('returns every stage, empty ones as []', () => {
    expect(groupLeadsByStage([])).toEqual(Object.fromEntries(LEAD_STAGES.map((s) => [s, []])));
  });

  it('sorts by due date, then undated leads newest first, and keeps Perdido apart', () => {
    const dueLater = lead({ name: 'due 10-10', dueDate: '2026-10-10' });
    const undatedOlder = lead({ name: 'undated 10-02', updatedAt: '2026-10-02T00:00:00.000Z' });
    const dueSooner = lead({ name: 'due 10-01', dueDate: '2026-10-01' });
    const undatedNewer = lead({ name: 'undated 10-05', updatedAt: '2026-10-05T00:00:00.000Z' });
    const lost = lead({ name: 'lost', stage: 'perdido' });

    const grouped = groupLeadsByStage([dueLater, undatedOlder, dueSooner, undatedNewer, lost]);

    expect(grouped.prospectado.map((item) => item.name)).toEqual([
      'due 10-01',
      'due 10-10',
      'undated 10-05',
      'undated 10-02',
    ]);
    expect(grouped.perdido).toEqual([lost]);
    expect(grouped.contatado).toEqual([]);
  });
});

describe('previewStatus', () => {
  const previews = [
    indexed('on'),
    indexed('off', { disabled: true }),
    indexed('no-index', { hasIndex: false }),
  ];

  it('reads the status from the Blob index', () => {
    const available = index(true, ...previews);
    expect(previewStatus(available, 'on')).toBe('active');
    expect(previewStatus(available, 'off')).toBe('disabled');
    expect(previewStatus(available, 'no-index')).toBe('missing');
    expect(previewStatus(available, 'gone')).toBe('missing');
  });

  it('is unknown when the index is unavailable', () => {
    expect(previewStatus(index(false), 'gone')).toBe('unknown');
  });

  it('labels each status in pt-BR', () => {
    expect(PREVIEW_STATUS_LABELS).toEqual({
      active: 'Prévia ativa',
      disabled: 'Prévia desativada',
      missing: 'Prévia não encontrada',
      unknown: 'Status da prévia indisponível',
    });
  });
});

describe('leadPreviewOptions', () => {
  const available = index(
    true,
    indexed('zeta', { client: 'Zeta' }),
    indexed('bad', { slug: 'Bad_Slug', client: 'Bad' }),
    indexed('heris', { client: 'Héris Clínica', disabled: true }),
    indexed('acme', { client: 'Acme' }),
  );

  it('lists valid Blob previews by client name after "Nenhuma"', () => {
    expect(leadPreviewOptions(available, null)).toEqual([
      { value: '', label: 'Nenhuma' },
      { value: 'acme', label: 'Acme (acme)' },
      { value: 'heris', label: 'Héris Clínica (heris) · desativada' },
      { value: 'zeta', label: 'Zeta (zeta)' },
    ]);
  });

  it('keeps a linked slug that dropped out of the index, once', () => {
    expect(leadPreviewOptions(available, 'acme')).toHaveLength(4);
    expect(leadPreviewOptions(index(false), 'old-site')).toEqual([
      { value: '', label: 'Nenhuma' },
      { value: 'old-site', label: 'old-site (fora do índice)' },
    ]);
  });
});
