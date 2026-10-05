// src/data/about.ts — D-11
// 2-paragraph bilingual bio sitting below the Hero on the home page. Covers career arc
// and what I do today (web + mobile + backend). Condensed for work-first hero layout.
import { type About, AboutSchema } from './schemas';

export const about: About = {
  paragraphs: {
    en: [
      'Started in IT support at Klabin in 2012, pivoted into engineering at UAUBox in 2019. Went deep on e-commerce at scale through Corebiz/VTEX, React Native at Luizalabs (Magazine Luiza Superapp), and led the first US heavy-machinery e-commerce at Machinery Partner — from no-code to Next.js + headless CMS.',
      "Web, mobile, and the backend that ties them together. TypeScript every day, WCAG 2.1 AA, and phones first — because that's where the people I'm building for actually open the link.",
    ],
    pt: [
      'Comecei em suporte de TI na Klabin em 2012, virei engenheiro na UAUBox em 2019. Mergulhei em e-commerce via Corebiz/VTEX, React Native na Luizalabs (Superapp Magalu), e liderei o primeiro e-commerce de máquinas pesadas dos EUA na Machinery Partner — de no-code para Next.js + headless CMS.',
      'Web, mobile e o backend que conecta tudo. TypeScript todos os dias, WCAG 2.1 AA e mobile first — porque é onde as pessoas para quem construo realmente abrem o link.',
    ],
  },
  cadence: {
    en: 'I update /now when something changes, and post on /blog when something is worth saying.',
    pt: 'Atualizo /now quando algo muda e posto em /blog quando há algo que valha a pena dizer.',
  },
};

AboutSchema.parse(about);
