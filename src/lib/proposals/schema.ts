import { todayInSaoPaulo } from '@/lib/admin/leads';
import { z } from 'zod';

const ISO_DATE = z.iso.date();
const EMAIL = z.email();
const VALIDITY_DAYS = 7;

const DEFAULT_FLOW = [
  {
    label: 'Instagram',
    title: 'Quem já segue',
    text: 'vê o resultado e clica no link da bio',
  },
  {
    label: 'Site',
    title: 'O negócio completo',
    text: 'serviços, equipe, endereço e horários',
  },
  {
    label: 'WhatsApp',
    title: 'Conversa e agenda',
    text: 'com uma mensagem já pronta para começar',
  },
];

const DEFAULT_NEXT_STEPS = [
  { title: 'Vocês escolhem a opção', description: 'e me avisam pelo WhatsApp.' },
  { title: 'Pagamento', description: 'Pix ou parcelado no cartão, conforme a opção.' },
  {
    title: 'Vocês me mandam o material',
    description: 'a lista está logo abaixo. Se faltar alguma foto, eu ajudo a resolver.',
  },
  { title: 'Site no ar', description: 'já configurado no Google, no domínio de vocês.' },
  {
    title: 'Revisão com vocês',
    description: 'ajustamos juntos o que for preciso antes de divulgar.',
  },
];

const DEFAULT_CONTACT = {
  name: 'Luiz Pansarini',
  site: 'pansarini.dev',
  email: 'lpansarini@gmail.com',
};

function required(max: number) {
  return z.string().trim().min(1).max(max);
}

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);
}

function list<T extends z.ZodType>(item: T, max: number) {
  return z
    .array(item)
    .max(max)
    .default(() => []);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname !== '';
  } catch {
    return false;
  }
}

const isoDate = z
  .string()
  .trim()
  .refine((value) => ISO_DATE.safeParse(value).success, {
    error: 'Informe uma data no formato AAAA-MM-DD.',
  });

const flowBoxSchema = z.strictObject({
  label: required(24),
  title: required(60),
  text: required(160),
});

const optionSchema = z.strictObject({
  label: required(60),
  title: required(60),
  price: required(40),
  priceNote: required(120),
  items: z.array(required(200)).max(8),
  addon: optionalText(300),
  terms: optionalText(300),
});

export const proposalInputSchema = z.strictObject({
  clientName: required(120),
  recipients: required(160),
  title: optionalText(160),
  projectLabel: optionalText(60).transform((value) => value ?? 'Site'),
  date: isoDate.optional(),
  validUntil: isoDate.optional(),
  tagline: required(240),
  conversation: list(required(240), 8),
  idea: z.strictObject({
    text: required(1200),
    flow: z
      .array(flowBoxSchema)
      .length(3, { error: 'O fluxo precisa de exatamente 3 etapas.' })
      .default(() => DEFAULT_FLOW.map((box) => ({ ...box }))),
    note: optionalText(300),
  }),
  scope: list(z.strictObject({ title: required(60), description: required(240) }), 8),
  options: z
    .array(optionSchema)
    .min(1, { error: 'Inclua de 1 a 3 opções.' })
    .max(3, { error: 'Inclua de 1 a 3 opções.' }),
  monthlyReport: optionalText(600),
  exclusions: list(required(240), 8),
  brandNote: optionalText(600),
  nextSteps: z
    .array(z.strictObject({ title: required(80), description: required(200) }))
    .max(8)
    .default(() => DEFAULT_NEXT_STEPS.map((step) => ({ ...step }))),
  materials: list(required(160), 12),
  previewUrl: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .trim()
      .max(500)
      .refine(isHttpUrl, { error: 'Informe um endereço http ou https.' })
      .optional(),
  ),
  contact: z
    .strictObject({
      name: required(80),
      site: required(80),
      email: z
        .string()
        .trim()
        .max(254)
        .refine((value) => EMAIL.safeParse(value).success, { error: 'Informe um e-mail válido.' }),
    })
    .default(() => ({ ...DEFAULT_CONTACT })),
});

export type ProposalInput = z.input<typeof proposalInputSchema>;
export type Proposal = Omit<z.output<typeof proposalInputSchema>, 'date' | 'validUntil'> & {
  date: string;
  validUntil: string;
};
export type ProposalError = { path: string; message: string };

export type ProposalSectionKey =
  | 'conversation'
  | 'idea'
  | 'scope'
  | 'investment'
  | 'nextSteps'
  | 'materials'
  | 'preview';
export type ProposalSection = { key: ProposalSectionKey; number: string };

const EXPECTED_LABELS: Record<string, string> = {
  string: 'texto',
  array: 'lista',
  object: 'objeto',
};

// Zod's default messages are English; the bot relays these to a pt-BR conversation.
function ptBrMessage(issue: z.core.$ZodRawIssue): string {
  switch (issue.code) {
    case 'too_big':
      return issue.origin === 'array'
        ? `Use no máximo ${issue.maximum} itens.`
        : `Use no máximo ${issue.maximum} caracteres.`;
    case 'too_small':
      return issue.origin === 'array'
        ? `Inclua pelo menos ${issue.minimum} item.`
        : 'Preencha este campo.';
    case 'invalid_type':
      return issue.input === undefined
        ? 'Campo obrigatório.'
        : `Valor inválido: esperado ${EXPECTED_LABELS[issue.expected] ?? issue.expected}.`;
    case 'unrecognized_keys':
      return `Campo desconhecido: ${issue.keys.join(', ')}.`;
    default:
      return 'Valor inválido.';
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function parseProposal(
  raw: unknown,
  now: Date = new Date(),
): { ok: true; proposal: Proposal } | { ok: false; errors: ProposalError[] } {
  const result = proposalInputSchema.safeParse(raw, { error: ptBrMessage });
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      })),
    };
  }
  const date = result.data.date ?? todayInSaoPaulo(now);
  const validUntil = result.data.validUntil ?? addDays(date, VALIDITY_DAYS);
  if (validUntil < date) {
    return {
      ok: false,
      errors: [{ path: 'validUntil', message: 'A validade não pode ser anterior à data.' }],
    };
  }
  return { ok: true, proposal: { ...result.data, date, validUntil } };
}

export function proposalSections(proposal: Proposal): ProposalSection[] {
  const present: [ProposalSectionKey, boolean][] = [
    ['conversation', proposal.conversation.length > 0],
    ['idea', true],
    ['scope', proposal.scope.length > 0],
    ['investment', true],
    ['nextSteps', proposal.nextSteps.length > 0],
    ['materials', proposal.materials.length > 0],
    ['preview', proposal.previewUrl !== undefined],
  ];
  return present
    .filter(([, shown]) => shown)
    .map(([key], index) => ({ key, number: String(index + 1).padStart(2, '0') }));
}
