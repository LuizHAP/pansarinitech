// src/data/about.ts — D-11
// 4-paragraph bilingual bio sitting below the Hero on the home page. Covers career arc
// detail (Klabin 7yr, UAUBox pivot, Corebiz/VTEX, Luizalabs/Magazine Luiza, Machinery
// Partner), what I do today (web + mobile + backend), 1 personal touch (Star Wars hint
// landing as personality, not fan service).
import { type About, AboutSchema } from './schemas';

export const about: About = {
  paragraphs: {
    en: [
      'I started in IT support at Klabin in 2012 and stayed seven years — long enough to learn that the people closest to the problem usually know the cheapest fix. In 2019 I pivoted into engineering at UAUBox, then went deep on e-commerce at scale through Corebiz/VTEX and React Native at scale through Luizalabs (Magazine Luiza Superapp).',
      'At Machinery Partner I led the no-code → Next.js + headless CMS migration powering the first US heavy-machinery e-commerce — from zero to the platform recruiters in Boston build their day around. Same engineer who used to reset printers. Now open to what comes next.',
      "Web, mobile, and the backend that ties them together. I write TypeScript every day, keep the bar at WCAG 2.1 AA, and ship things on phones first — because that's where the people I'm building for actually open the link.",
      "Star Wars fan — the Jedi/Sith toggle in the corner is the only place that hint shows up on the site. Don't worry, the rest is professional.",
    ],
    pt: [
      'Comecei em suporte de TI na Klabin em 2012 e fiquei sete anos — tempo suficiente para aprender que quem está mais perto do problema costuma saber a solução mais barata. Em 2019 virei desenvolvedor na UAUBox, depois mergulhei em e-commerce em escala via Corebiz/VTEX e em React Native em escala via Luizalabs (Superapp do Magazine Luiza).',
      'Na Machinery Partner liderei a migração de no-code para Next.js + headless CMS que sustenta o primeiro e-commerce de máquinas pesadas dos EUA — do zero à plataforma que pessoas em Boston abrem todo dia. Mesmo engenheiro que resetava impressoras. Agora aberto ao próximo desafio.',
      'Web, mobile e o backend que conecta tudo. Escrevo TypeScript todos os dias, mantenho a régua em WCAG 2.1 AA e entrego pensando em mobile primeiro — porque é onde as pessoas para quem estou construindo realmente abrem o link.',
      'Fã de Star Wars — o toggle Jedi/Sith no canto é a única pista disso no site. Pode relaxar, o resto é profissional.',
    ],
  },
  cadence: {
    en: 'I update /now when something changes, and post on /blog when something is worth saying.',
    pt: 'Atualizo /now quando algo muda e posto em /blog quando há algo que valha a pena dizer.',
  },
};

AboutSchema.parse(about);
