import { describe, expect, it } from 'vitest';
import { FULL_PROPOSAL_INPUT, MINIMAL_PROPOSAL_INPUT } from './fixtures';
import { proposalPdfFileName, renderProposalPdf } from './render';
import { type Proposal, parseProposal } from './schema';

function parsed(raw: unknown): Proposal {
  const result = parseProposal(raw, new Date('2026-10-26T15:00:00Z'));
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.proposal;
}

function pageCount(pdf: Buffer): number {
  return pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
}

describe('renderProposalPdf', () => {
  it('renders the full fixture as a 4-page PDF', { timeout: 60_000 }, async () => {
    const pdf = await renderProposalPdf(parsed(FULL_PROPOSAL_INPUT));
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(4);
  });

  it('renders the minimal fixture as a 4-page PDF', { timeout: 60_000 }, async () => {
    const pdf = await renderProposalPdf(parsed(MINIMAL_PROPOSAL_INPUT));
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(4);
  });

  it('links a contact site sent with a scheme only once', { timeout: 60_000 }, async () => {
    const pdf = await renderProposalPdf(
      parsed({
        ...MINIMAL_PROPOSAL_INPUT,
        contact: { name: 'Luiz', site: 'https://exemplo.dev/', email: 'luiz@exemplo.dev' },
      }),
    );
    const text = pdf.toString('latin1');
    expect(text).toContain('/URI (https://exemplo.dev)');
    expect(text).not.toContain('https://https');
  });
});

describe('renderProposalPdf with every field at its cap', () => {
  it('flows the overflow onto extra pages', { timeout: 60_000 }, async () => {
    const words = (length: number) => 'palavra '.repeat(length).slice(0, length).trim();
    const option = {
      label: words(60),
      title: words(60),
      price: words(40),
      priceNote: words(120),
      items: Array(8).fill(words(200)),
      addon: words(300),
      terms: words(300),
    };
    const pdf = await renderProposalPdf(
      parsed({
        ...FULL_PROPOSAL_INPUT,
        clientName: words(120),
        tagline: words(240),
        conversation: Array(8).fill(words(240)),
        idea: { text: words(1200), note: words(300) },
        scope: Array(8).fill({ title: words(60), description: words(240) }),
        options: [option, option, option],
        monthlyReport: words(600),
        exclusions: Array(8).fill(words(240)),
        brandNote: words(600),
        nextSteps: Array(8).fill({ title: words(80), description: words(200) }),
        materials: Array(12).fill(words(160)),
      }),
    );
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pageCount(pdf)).toBeGreaterThan(4);
  });
});

describe('proposalPdfFileName', () => {
  it('slugs the client name in ASCII and appends the date', () => {
    expect(proposalPdfFileName(parsed(FULL_PROPOSAL_INPUT))).toBe(
      'proposta-estudio-exemplo-de-pilates-2026-10-26.pdf',
    );
  });

  it('caps the slug at 60 characters and falls back for names without letters', () => {
    const long = proposalPdfFileName(
      parsed({ ...MINIMAL_PROPOSAL_INPUT, clientName: 'Á'.repeat(90) }),
    );
    expect(long).toBe(`proposta-${'a'.repeat(60)}-2026-10-26.pdf`);
    expect(proposalPdfFileName(parsed({ ...MINIMAL_PROPOSAL_INPUT, clientName: '!!!' }))).toBe(
      'proposta-cliente-2026-10-26.pdf',
    );
  });
});
