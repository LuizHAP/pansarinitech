import type { LeadScore } from '@/lib/crm/contract';
import { z } from 'zod';
import { type ScorableLead, priorityFor } from './score';

export const DEFAULT_AI_MODEL = 'openai/gpt-4o-mini';
export const AI_TIMEOUT_MS = 20_000;
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const refinementSchema = z.object({
  adjustment: z.number().int().min(-15).max(15),
  reasons: z.array(z.string().trim().min(1).max(200)).max(5),
  suggestedMessage: z.string().trim().min(1).max(600),
});

export type AiDeps = { fetch?: typeof fetch; env?: Record<string, string | undefined> };

const JSON_SCHEMA = {
  name: 'lead_refinement',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['adjustment', 'reasons', 'suggestedMessage'],
    properties: {
      adjustment: { type: 'integer', minimum: -15, maximum: 15 },
      reasons: { type: 'array', maxItems: 5, items: { type: 'string' } },
      suggestedMessage: { type: 'string' },
    },
  },
} as const;

const SYSTEM_PROMPT = [
  'Você ajuda um desenvolvedor web freelancer a priorizar negócios locais para vender sites e landing pages.',
  'Receba os dados de um lead e a pontuação local (0 a 100). Devolva um ajuste inteiro de -15 a 15, até 5 motivos curtos em português do Brasil e uma mensagem de WhatsApp em português do Brasil.',
  'A mensagem tem no máximo 3 frases, tom natural e direto, sem emoji, sem prometer preço, citando o nome do negócio e um problema real do site (ou a ausência dele).',
  'Use apenas os dados recebidos. Não invente fatos.',
].join(' ');

function payload(lead: ScorableLead, local: LeadScore) {
  return {
    name: lead.name,
    category: lead.extras?.category ?? null,
    city: lead.extras?.city ?? null,
    rating: lead.extras?.rating ?? null,
    reviews: lead.extras?.reviews ?? null,
    hasWebsite: local.signals.semSite === false,
    signals: local.signals,
    localScore: local.value,
    localReasons: local.reasons,
  };
}

export async function refineWithAi(
  lead: ScorableLead,
  local: LeadScore,
  deps: AiDeps = {},
): Promise<LeadScore> {
  const env = deps.env ?? process.env;
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) return local;
  const fetchImpl = deps.fetch ?? fetch;
  const model = env.OPENROUTER_MODEL || DEFAULT_AI_MODEL;

  try {
    const response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: 'json_schema', json_schema: JSON_SCHEMA },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(payload(lead, local)) },
        ],
      }),
    });
    if (!response.ok) return local;
    const body = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return local;
    const parsed = refinementSchema.safeParse(JSON.parse(content));
    if (!parsed.success) return local;

    const value = Math.min(100, Math.max(0, local.value + parsed.data.adjustment));
    return {
      ...local,
      value,
      priority: priorityFor(value),
      reasons: parsed.data.reasons.length > 0 ? parsed.data.reasons : local.reasons,
      suggestedMessage: parsed.data.suggestedMessage,
      engine: 'ai',
    };
  } catch {
    return local;
  }
}
