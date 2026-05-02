// src/data/now.ts — NOW-01, NOW-02
// Three subsections (workingOn / reading / side) + machine-readable lastUpdated.
// First-person, casual voice. Quarterly cadence committed in About.cadence.
import { type NowContent, NowSchema } from './schemas';

export const now: NowContent = {
  lastUpdated: '2026-05-02',
  workingOn: {
    en: 'Leading the no-code → Next.js + headless CMS migration at Machinery Partner. Day-to-day means React Server Components, app-router edges, payment integrations, and a lot of phone calls about heavy machinery I never knew had model numbers.',
    pt: 'Liderando a migração de no-code para Next.js + headless CMS na Machinery Partner. No dia a dia: React Server Components, bordas do app router, integrações de pagamento, e muitas ligações sobre máquinas pesadas que eu nunca soube que tinham número de modelo.',
  },
  reading: {
    en: 'Re-reading Designing Data-Intensive Applications between sprints. Catching up on the React 19 + Next 16 changelog (especially the React Compiler GA notes and Turbopack default). Threading through the new Tailwind v4 OKLCH model in real projects.',
    pt: 'Relendo Designing Data-Intensive Applications entre sprints. Pondo em dia o changelog do React 19 + Next 16 (especialmente as notas de GA do React Compiler e do Turbopack como default). Aplicando o novo modelo OKLCH do Tailwind v4 em projetos reais.',
  },
  side: {
    en: 'Building this portfolio in my spare time — bilingual PT/EN, mobile-first, Lighthouse-101 friendly. Source is open at github.com/LuizHAP/pansarinitech in case anyone wants to steal the patterns.',
    pt: 'Construindo este portfolio nas horas vagas — bilíngue PT/EN, mobile-first, amigável ao Lighthouse 101. O código está aberto em github.com/LuizHAP/pansarinitech caso alguém queira surrupiar os padrões.',
  },
};

NowSchema.parse(now);
