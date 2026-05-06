// src/data/now.ts — NOW-01, NOW-02
// Three subsections (workingOn / reading / side) + machine-readable lastUpdated.
// First-person, casual voice. Quarterly cadence committed in About.cadence.
import { type NowContent, NowSchema } from './schemas';

export const now: NowContent = {
  lastUpdated: '2026-05-06',
  workingOn: {
    en: 'Wrapped up my time at Machinery Partner in April 2026 after leading the no-code → Next.js migration that became the first US heavy-machinery e-commerce. Currently open to work — looking for principal or senior full-stack roles in web, mobile, or product-focused teams. Writing the occasional engineering post on /blog in the meantime.',
    pt: 'Encerrei minha jornada na Machinery Partner em abril de 2026 após liderar a migração de no-code para Next.js que se tornou o primeiro e-commerce de máquinas pesadas dos EUA. Atualmente open to work — procurando oportunidades de nível principal ou sênior em times focados em web, mobile ou produto. Escrevendo posts ocasionais sobre engenharia em /blog no intervalo.',
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
