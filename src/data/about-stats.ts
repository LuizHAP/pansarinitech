// src/data/about-stats.ts — v1.1 redesign
// Stats row + bullet highlights for the About section.
// Kept separate from about.ts to avoid schema churn.

export interface Stat {
  num: string;
  label: { en: string; pt: string };
  accent: boolean;
  small?: boolean;
}

export interface Bullet {
  icon: 'TrendingUp' | 'Code2' | 'Smartphone' | 'Globe';
  text: { en: string; pt: string };
}

export const aboutStats: Stat[] = [
  { num: '14', label: { en: 'years in tech', pt: 'anos em tech' }, accent: true },
  { num: '5', label: { en: 'companies', pt: 'empresas' }, accent: true },
  { num: 'BR+US', label: { en: 'markets', pt: 'mercados' }, accent: false, small: true },
  { num: '100M+', label: { en: 'users reached', pt: 'usuários alcançados' }, accent: true },
];

export const aboutBullets: Bullet[] = [
  {
    icon: 'TrendingUp',
    text: {
      en: 'IT Support → Principal Engineer in 12 years',
      pt: 'IT Support → Principal Engineer em 12 anos',
    },
  },
  {
    icon: 'Code2',
    text: {
      en: 'Web · Mobile · Backend — TypeScript daily',
      pt: 'Web · Mobile · Backend — TypeScript todos os dias',
    },
  },
  {
    icon: 'Smartphone',
    text: {
      en: 'Mobile-first + WCAG 2.1 AA as standard, not an afterthought',
      pt: 'Mobile-first + WCAG 2.1 AA como padrão, não extra',
    },
  },
  {
    icon: 'Globe',
    text: {
      en: 'Built the first US heavy-machinery e-commerce',
      pt: 'Construí o 1° e-commerce US de máquinas pesadas',
    },
  },
];
