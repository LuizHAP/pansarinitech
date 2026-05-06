// src/data/hero.ts — D-06, D-07 (country-only deviation), D-09, D-10
// Career-arc value prop. Middle dot (·) separates role and country.
import { type Hero, HeroSchema } from './schemas';

export const hero: Hero = {
  name: 'Luiz Pansarini',
  role: {
    en: 'Principal Software Engineer · Brazil',
    pt: 'Principal Software Engineer · Brasil',
  },
  valueProp: {
    en: "From IT helpdesk at Klabin to Principal Engineer in 14 years. I build the products I'd want to use — Next.js, React Native, and the messy backend that ties them together. Open to new opportunities.",
    pt: 'Do helpdesk de TI na Klabin a Principal Engineer em 14 anos. Construo os produtos que eu mesmo gostaria de usar — Next.js, React Native, e o backend bagunçado que conecta tudo. Aberto a novas oportunidades.',
  },
  photoAlt: {
    en: 'Luiz Pansarini, Principal Software Engineer',
    pt: 'Luiz Pansarini, Principal Software Engineer',
  },
};

HeroSchema.parse(hero);
