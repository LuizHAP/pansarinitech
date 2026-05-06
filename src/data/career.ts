// src/data/career.ts — CAREER-01, CAREER-02, CAREER-03
// 5 roles in reverse chronological order. UAUBox 2019 carries `pivot: true` so the
// timeline component renders a saber-color dot + Tooltip ("Pivot: IT → Engineering").
//
// Approximate dates per .planning/PROJECT.md. Luiz can refine month boundaries in
// a follow-up commit; YYYY-MM granularity is the schema's minimum unit.
import { type Role, RoleSchema } from './schemas';

export const career: Role[] = [
  {
    id: 'machinery-partner',
    company: 'Machinery Partner',
    role: {
      en: 'Principal Software Engineer',
      pt: 'Principal Software Engineer',
    },
    period: { start: '2023-01', end: '2026-04' },
    bullets: {
      en: [
        'Leading the no-code → Next.js + headless CMS migration powering the first US heavy-machinery e-commerce.',
        'Owning the full stack: Next.js App Router on the web, React Native for the field-rep app, and the TypeScript backend that ties them together.',
        'Setting the engineering bar — code review, accessibility (WCAG 2.1 AA), performance budgets, and the hiring loop for new engineers.',
      ],
      pt: [
        'Liderando a migração de no-code para Next.js + headless CMS que sustenta o primeiro e-commerce de máquinas pesadas dos EUA.',
        'Responsável pela stack completa: Next.js App Router no web, React Native no app dos representantes de campo, e o backend TypeScript que conecta tudo.',
        'Definindo o padrão de engenharia — code review, acessibilidade (WCAG 2.1 AA), budgets de performance e o loop de contratação de novos engenheiros.',
      ],
    },
  },
  {
    id: 'luizalabs',
    company: 'Luizalabs (Magazine Luiza)',
    role: {
      en: 'Senior Software Engineer',
      pt: 'Senior Software Engineer',
    },
    period: { start: '2021-04', end: '2023-01' },
    bullets: {
      en: [
        "Shipped React Native features inside the Magazine Luiza Superapp — one of Brazil's most-installed retail apps, serving tens of millions of monthly users.",
        'Worked on payment, checkout, and personalization surfaces; raised test coverage and shipped behind feature flags so launches were boring.',
        'Collaborated across iOS, Android, web, and native teams to keep parity across platforms at retail scale.',
      ],
      pt: [
        'Entreguei features em React Native dentro do Superapp Magazine Luiza — um dos apps de varejo mais instalados do Brasil, com dezenas de milhões de usuários mensais.',
        'Trabalhei nas superfícies de pagamento, checkout e personalização; aumentei cobertura de testes e usei feature flags para que os lançamentos fossem entediantes (no bom sentido).',
        'Colaborei com times de iOS, Android, web e nativo para manter paridade entre plataformas em escala de varejo.',
      ],
    },
  },
  {
    id: 'corebiz',
    company: 'Corebiz (VTEX)',
    role: {
      en: 'Software Engineer',
      pt: 'Software Engineer',
    },
    period: { start: '2020-03', end: '2021-04' },
    bullets: {
      en: [
        'Delivered VTEX e-commerce storefronts and integrations for retail clients across Latin America.',
        'Built React + TypeScript surfaces backed by VTEX IO, focused on conversion-critical pages (PDP, checkout, cart).',
        'Bridged design hand-off, accessibility, and SEO requirements with the realities of an e-commerce platform on tight retail deadlines.',
      ],
      pt: [
        'Entreguei storefronts e integrações VTEX para clientes de varejo na América Latina.',
        'Construí superfícies React + TypeScript sobre VTEX IO, focado em páginas críticas para conversão (PDP, checkout, carrinho).',
        'Fiz a ponte entre o hand-off de design, acessibilidade e SEO com a realidade de uma plataforma de e-commerce em prazos apertados de varejo.',
      ],
    },
  },
  {
    id: 'uaubox',
    company: 'UAUBox',
    role: {
      en: 'Full Stack Developer',
      pt: 'Full Stack Developer',
    },
    period: { start: '2019-03', end: '2020-03' },
    bullets: {
      en: [
        'Pivoted from IT support into engineering — first paid role writing production code.',
        'Shipped customer-facing features across the React frontend and the Node.js backend of a subscription-box e-commerce.',
        'Learned the full software-delivery loop on the job: code review, deploy, on-call, customer feedback.',
      ],
      pt: [
        'Virei de suporte de TI para engenharia — primeira função paga escrevendo código em produção.',
        'Entreguei features voltadas ao usuário no frontend React e no backend Node.js de um e-commerce de assinatura de box.',
        'Aprendi o ciclo completo de entrega de software no dia a dia: code review, deploy, plantão, feedback do cliente.',
      ],
    },
    pivot: true,
  },
  {
    id: 'klabin',
    company: 'Klabin S/A',
    role: {
      en: 'IT Support Analyst',
      pt: 'Analista de Suporte de TI',
    },
    period: { start: '2012-02', end: '2019-02' },
    bullets: {
      en: [
        "Seven years on the IT helpdesk for one of Brazil's largest pulp & paper manufacturers — production lines, factory floor, corporate users.",
        'Diagnosed everything from broken PLCs to ERP timeouts; learned how real businesses actually use software (and why they hate it).',
        'Started teaching myself JavaScript on nights and weekends; that habit is what made the UAUBox pivot in 2019 possible.',
      ],
      pt: [
        'Sete anos no helpdesk de TI de uma das maiores fabricantes de papel e celulose do Brasil — linhas de produção, chão de fábrica, usuários corporativos.',
        'Diagnostiquei de tudo, de PLCs quebrados a timeouts de ERP; aprendi como empresas de verdade usam software (e por que detestam).',
        'Comecei a estudar JavaScript em noites e finais de semana — esse hábito foi o que tornou possível a virada para a UAUBox em 2019.',
      ],
    },
  },
];

RoleSchema.array().parse(career);
