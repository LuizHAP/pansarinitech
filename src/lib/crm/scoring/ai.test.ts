import type { LeadScore } from '@/lib/crm/contract';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_MODEL, refineWithAi } from './ai';
import { scoreLead } from './score';

const lead = {
  name: 'Padaria Boa',
  website: null,
  whatsapp: '5511912345678',
  phone: '1133334444',
  email: 'dono@padaria.com',
  instagram: null,
  extras: { category: 'Padaria', city: 'Campinas', rating: 4.5, reviews: 80 },
};
const local: LeadScore = scoreLead(lead, null);
const env = { OPENROUTER_API_KEY: 'k' };

function reply(content: unknown, ok = true) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status: ok ? 200 : 500,
      }),
  );
}

const VALID = JSON.stringify({
  adjustment: 5,
  reasons: ['Sem site e bem avaliada.'],
  suggestedMessage: 'Oi, vi a Padaria Boa.',
});

describe('refineWithAi', () => {
  it('returns the local result without a key and never calls the network', async () => {
    const fetchMock = vi.fn();
    await expect(refineWithAi(lead, local, { fetch: fetchMock as never, env: {} })).resolves.toBe(
      local,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies a validated refinement', async () => {
    const fetchMock = reply(VALID);
    const refined = await refineWithAi(lead, local, { fetch: fetchMock as never, env });
    expect(refined.engine).toBe('ai');
    expect(refined.value).toBe(Math.min(100, local.value + 5));
    expect(refined.reasons).toEqual(['Sem site e bem avaliada.']);
    expect(refined.suggestedMessage).toBe('Oi, vi a Padaria Boa.');
    expect(refined.signals).toBe(local.signals);
  });

  it('sends the configured model, a json schema, and no contact details', async () => {
    const fetchMock = reply(VALID);
    await refineWithAi(lead, local, {
      fetch: fetchMock as never,
      env: { ...env, OPENROUTER_MODEL: 'x/y' },
    });
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    const [url, init] = calls[0] as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('x/y');
    expect(body.response_format.type).toBe('json_schema');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer k');
    expect(init.body).not.toContain('5511912345678');
    expect(init.body).not.toContain('dono@padaria.com');
    expect(init.body).not.toContain('1133334444');
  });

  it('defaults the model', async () => {
    const fetchMock = reply(VALID);
    await refineWithAi(lead, local, { fetch: fetchMock as never, env });
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(JSON.parse((calls[0] as [string, RequestInit])[1].body as string).model).toBe(
      DEFAULT_AI_MODEL,
    );
  });

  it('clamps the value and keeps local reasons when the model sends none', async () => {
    const content = JSON.stringify({ adjustment: -15, reasons: [], suggestedMessage: 'Oi' });
    const refined = await refineWithAi(
      { ...lead },
      { ...local, value: 5 },
      { fetch: reply(content) as never, env },
    );
    expect(refined.value).toBe(0);
    expect(refined.priority).toBe('baixa');
    expect(refined.reasons).toEqual(local.reasons);
  });

  it.each([
    ['http error', reply(VALID, false)],
    ['non-string content', reply(null)],
    ['invalid json', reply('not json')],
    [
      'out of range adjustment',
      reply(JSON.stringify({ adjustment: 50, reasons: [], suggestedMessage: 'x' })),
    ],
    ['missing fields', reply(JSON.stringify({ adjustment: 1 }))],
    ['no choices', vi.fn(async () => new Response('{}', { status: 200 }))],
    [
      'network error',
      vi.fn(async () => {
        throw new Error('boom');
      }),
    ],
  ])('falls back to local on %s', async (_name, fetchMock) => {
    await expect(refineWithAi(lead, local, { fetch: fetchMock as never, env })).resolves.toBe(
      local,
    );
  });
});
