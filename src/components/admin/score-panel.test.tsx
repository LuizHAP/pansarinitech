import type { LeadScore } from '@/lib/crm/contract';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScoreBadge, ScorePanel } from './score-panel';

vi.mock('@/lib/admin/score-actions', () => ({
  scoreLeadAction: vi.fn(),
  scoreLeadsAction: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const SCORE: LeadScore = {
  value: 82,
  priority: 'alta',
  signals: { semSite: true, whatsappContato: true },
  reasons: ['Sem site: alta chance de fechar.'],
  suggestedMessage: 'Oi, vi a Oficina.',
  analyzedAt: '2026-11-18T12:00:00.000Z',
  engine: 'local',
};

describe('ScoreBadge', () => {
  it('renders nothing without a score', () => {
    const { container } = render(<ScoreBadge score={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows value and priority', () => {
    render(<ScoreBadge score={SCORE} />);
    expect(screen.getByTestId('score-badge')).toHaveTextContent('82 · Alta');
  });
});

describe('ScorePanel', () => {
  it('invites an analysis when there is no score', () => {
    render(<ScorePanel leadId="x" score={undefined} />);
    expect(screen.getByText('Este lead ainda não foi analisado.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analisar' })).toBeInTheDocument();
  });

  it('shows signals, reasons, message and the actions', () => {
    render(<ScorePanel leadId="x" score={SCORE} />);
    expect(screen.getByText('Sem site')).toBeInTheDocument();
    expect(screen.getByText('Sem site: alta chance de fechar.')).toBeInTheDocument();
    expect(screen.getByText('Oi, vi a Oficina.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar mensagem/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reanalisar' })).toBeInTheDocument();
  });
});
