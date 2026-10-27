import { describe, expect, it } from 'vitest';
import { FULL_PROPOSAL_INPUT, MINIMAL_PROPOSAL_INPUT } from './fixtures';
import { type Proposal, parseProposal, proposalSections } from './schema';
import { proposalSummary } from './summary';

const NOW = new Date('2026-10-26T15:00:00Z');

function parsed(raw: unknown): Proposal {
  const result = parseProposal(raw, NOW);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.proposal;
}

function errorsFor(raw: unknown) {
  const result = parseProposal(raw, NOW);
  if (result.ok) throw new Error('expected the input to be rejected');
  return result.errors;
}

describe('parseProposal', () => {
  it('fills the defaults for a minimal input', () => {
    const proposal = parsed(MINIMAL_PROPOSAL_INPUT);

    expect(proposal.date).toBe('2026-10-26');
    expect(proposal.validUntil).toBe('2026-11-02');
    expect(proposal.projectLabel).toBe('Site');
    expect(proposal.contact).toEqual({
      name: 'Luiz Pansarini',
      site: 'pansarini.dev',
      email: 'lpansarini@gmail.com',
    });
    expect(proposal.nextSteps.map((step) => step.title)).toEqual([
      'Vocês escolhem a opção',
      'Pagamento',
      'Vocês me mandam o material',
      'Site no ar',
      'Revisão com vocês',
    ]);
    expect(proposal.idea.flow.map((box) => box.label)).toEqual(['Instagram', 'Site', 'WhatsApp']);
    expect(proposal.conversation).toEqual([]);
    expect(proposal.scope).toEqual([]);
    expect(proposal.exclusions).toEqual([]);
    expect(proposal.materials).toEqual([]);
    expect(proposal.previewUrl).toBeUndefined();
    expect(proposal.title).toBeUndefined();
  });

  it.each(['', '   '])('treats a blank previewUrl %j as absent', (previewUrl) => {
    const result = parseProposal({ ...MINIMAL_PROPOSAL_INPUT, previewUrl }, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.proposal.previewUrl).toBeUndefined();
  });

  it('uses the Sao Paulo calendar day for the default date', () => {
    const result = parseProposal(MINIMAL_PROPOSAL_INPUT, new Date('2026-10-27T02:00:00Z'));
    expect(result.ok && result.proposal.date).toBe('2026-10-26');
  });

  it('derives validUntil from an explicit date', () => {
    const proposal = parsed({ ...MINIMAL_PROPOSAL_INPUT, date: '2026-11-10' });
    expect(proposal.date).toBe('2026-11-10');
    expect(proposal.validUntil).toBe('2026-11-17');
  });

  it('keeps the full fixture as given, trimmed', () => {
    const proposal = parsed({ ...FULL_PROPOSAL_INPUT, clientName: '  Estúdio Exemplo  ' });
    expect(proposal.clientName).toBe('Estúdio Exemplo');
    expect(proposal.validUntil).toBe('2026-11-02');
    expect(proposal.options).toHaveLength(2);
    expect(proposal.idea.flow[1].title).toBe('O estúdio completo');
  });

  it('rejects a validUntil before the date', () => {
    expect(
      errorsFor({ ...MINIMAL_PROPOSAL_INPUT, date: '2026-11-10', validUntil: '2026-11-09' }),
    ).toEqual([{ path: 'validUntil', message: 'A validade não pode ser anterior à data.' }]);
  });

  it.each([
    ['no options', { options: [] }, 'options', 'Inclua de 1 a 3 opções.'],
    [
      'four options',
      { options: Array(4).fill(MINIMAL_PROPOSAL_INPUT.options[0]) },
      'options',
      'Inclua de 1 a 3 opções.',
    ],
    [
      '9 conversation items',
      { conversation: Array(9).fill('x') },
      'conversation',
      'Use no máximo 8 itens.',
    ],
    [
      '9 scope items',
      { scope: Array(9).fill({ title: 'x', description: 'y' }) },
      'scope',
      'Use no máximo 8 itens.',
    ],
    [
      'a 121-char clientName',
      { clientName: 'a'.repeat(121) },
      'clientName',
      'Use no máximo 120 caracteres.',
    ],
    ['an unknown key', { budget: 10 }, '', 'Campo desconhecido: budget.'],
    [
      'a javascript: previewUrl',
      { previewUrl: 'javascript:alert(1)' },
      'previewUrl',
      'Informe um endereço http ou https.',
    ],
    [
      'an ftp previewUrl',
      { previewUrl: 'ftp://x.y' },
      'previewUrl',
      'Informe um endereço http ou https.',
    ],
    ['a bad date', { date: '26/10/2026' }, 'date', 'Informe uma data no formato AAAA-MM-DD.'],
    ['an empty recipients', { recipients: '  ' }, 'recipients', 'Preencha este campo.'],
    [
      'a flow of two boxes',
      { idea: { text: 'x', flow: FULL_PROPOSAL_INPUT.idea.flow.slice(0, 2) } },
      'idea.flow',
      'O fluxo precisa de exatamente 3 etapas.',
    ],
    [
      'a bad contact email',
      { contact: { name: 'Luiz', site: 'pansarini.dev', email: 'nope' } },
      'contact.email',
      'Informe um e-mail válido.',
    ],
  ])('rejects %s', (_case, override, path, message) => {
    expect(errorsFor({ ...MINIMAL_PROPOSAL_INPUT, ...override })).toContainEqual({ path, message });
  });

  it('joins nested error paths with dots', () => {
    const options = [{ ...MINIMAL_PROPOSAL_INPUT.options[0], price: 'R$'.repeat(30) }];
    expect(errorsFor({ ...MINIMAL_PROPOSAL_INPUT, options })).toEqual([
      { path: 'options.0.price', message: 'Use no máximo 40 caracteres.' },
    ]);
  });

  it('names missing and mistyped fields in pt-BR', () => {
    const { clientName: _omitted, ...rest } = MINIMAL_PROPOSAL_INPUT;
    expect(errorsFor({ ...rest, tagline: 42, options: [{}] })).toEqual(
      expect.arrayContaining([
        { path: 'clientName', message: 'Campo obrigatório.' },
        { path: 'tagline', message: 'Valor inválido: esperado texto.' },
        { path: 'options.0.label', message: 'Campo obrigatório.' },
      ]),
    );
    expect(errorsFor(null)).toEqual([{ path: '', message: 'Valor inválido: esperado objeto.' }]);
    expect(errorsFor({ ...MINIMAL_PROPOSAL_INPUT, conversation: 'x' })).toEqual([
      { path: 'conversation', message: 'Valor inválido: esperado lista.' },
    ]);
  });
});

describe('proposalSections', () => {
  it('numbers every section of the full fixture in order', () => {
    expect(proposalSections(parsed(FULL_PROPOSAL_INPUT))).toEqual([
      { key: 'conversation', number: '01' },
      { key: 'idea', number: '02' },
      { key: 'scope', number: '03' },
      { key: 'investment', number: '04' },
      { key: 'nextSteps', number: '05' },
      { key: 'materials', number: '06' },
      { key: 'preview', number: '07' },
    ]);
  });

  it('skips empty sections without leaving gaps', () => {
    const { previewUrl: _omitted, ...rest } = FULL_PROPOSAL_INPUT;
    const sections = proposalSections(parsed({ ...rest, conversation: [] }));
    expect(sections).toEqual([
      { key: 'idea', number: '01' },
      { key: 'scope', number: '02' },
      { key: 'investment', number: '03' },
      { key: 'nextSteps', number: '04' },
      { key: 'materials', number: '05' },
    ]);
  });

  it('keeps only idea, investment and the default next steps for the minimal fixture', () => {
    expect(proposalSections(parsed({ ...MINIMAL_PROPOSAL_INPUT, nextSteps: [] }))).toEqual([
      { key: 'idea', number: '01' },
      { key: 'investment', number: '02' },
    ]);
  });
});

describe('proposalSummary', () => {
  it('lists options, scope, exclusions, validity and the preview', () => {
    const proposal = parsed(FULL_PROPOSAL_INPUT);
    const summary = proposalSummary(proposal);

    for (const option of proposal.options) {
      expect(summary).toContain(option.label);
      expect(summary).toContain(option.title);
      expect(summary).toContain(`${option.price}, ${option.priceNote}`);
    }
    expect(summary).toContain(proposal.options[0].addon);
    expect(summary).toContain(proposal.options[1].terms);
    for (const item of proposal.scope) expect(summary).toContain(`- ${item.title}`);
    expect(summary).toContain('Não está incluso:');
    for (const item of proposal.exclusions) expect(summary).toContain(`- ${item}`);
    expect(summary).toContain('Data: 26/10/2026 · válida até 02/11/2026');
    expect(summary).toContain('Prévia: https://pansarini.dev/preview/exemplo');
    expect(summary.startsWith('Proposta para Estúdio Exemplo de Pilates\nPara: Ana e Bruno')).toBe(
      true,
    );
  });

  it('leaves out the blocks that have no content', () => {
    const summary = proposalSummary(parsed(MINIMAL_PROPOSAL_INPUT));
    expect(summary).not.toContain('Não está incluso');
    expect(summary).not.toContain('Escopo:');
    expect(summary).not.toContain('Prévia:');
    expect(summary).toBe(
      [
        'Proposta para Estúdio Exemplo de Pilates',
        'Para: Ana e Bruno',
        'Data: 26/10/2026 · válida até 02/11/2026',
        '',
        'Opções:',
        'Opção única: Site + Google',
        'R$ 1.500, à vista, ou 10x de R$ 150',
      ].join('\n'),
    );
  });
});
