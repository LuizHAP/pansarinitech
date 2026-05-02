// src/data/skills.ts — SKILLS-01, SKILLS-02
// 7 categories: frontend, mobile, backend, testing, cloud, databases, tools.
// Daily-use stack flagged with `daily: true`: Next.js, TypeScript, Tailwind CSS,
// Shadcn/UI, React Native, Vercel — exactly 6 items per CONTEXT D-criteria.
// No skill bars / no percentages (REQUIREMENTS out-of-scope).
import { type SkillCategory, SkillCategorySchema } from './schemas';

export const skills: SkillCategory[] = [
  {
    id: 'frontend',
    label: { en: 'Frontend', pt: 'Frontend' },
    items: [
      { name: 'Next.js', daily: true },
      { name: 'React' },
      { name: 'TypeScript', daily: true },
      { name: 'Tailwind CSS', daily: true },
      { name: 'Shadcn/UI', daily: true },
      { name: 'Radix UI' },
      { name: 'HTML/CSS' },
    ],
  },
  {
    id: 'mobile',
    label: { en: 'Mobile', pt: 'Mobile' },
    items: [{ name: 'React Native', daily: true }, { name: 'Expo' }, { name: 'iOS / Android' }],
  },
  {
    id: 'backend',
    label: { en: 'Backend', pt: 'Backend' },
    items: [
      { name: 'Node.js' },
      { name: 'TypeScript (server)' },
      { name: 'REST APIs' },
      { name: 'GraphQL' },
      { name: 'Server Actions' },
    ],
  },
  {
    id: 'testing',
    label: { en: 'Testing', pt: 'Testes' },
    items: [
      { name: 'Playwright' },
      { name: 'Jest' },
      { name: 'React Testing Library' },
      { name: 'Vitest' },
      { name: 'axe-core' },
    ],
  },
  {
    id: 'cloud',
    label: { en: 'Cloud / DevOps', pt: 'Cloud / DevOps' },
    items: [
      { name: 'Vercel', daily: true },
      { name: 'AWS' },
      { name: 'GitHub Actions' },
      { name: 'Docker' },
    ],
  },
  {
    id: 'databases',
    label: { en: 'Databases', pt: 'Bancos de Dados' },
    items: [{ name: 'PostgreSQL' }, { name: 'MongoDB' }, { name: 'Redis' }, { name: 'Prisma' }],
  },
  {
    id: 'tools',
    label: { en: 'Tools', pt: 'Ferramentas' },
    items: [
      { name: 'Git' },
      { name: 'GitHub' },
      { name: 'VS Code' },
      { name: 'Figma' },
      { name: 'Biome' },
      { name: 'pnpm' },
    ],
  },
];

SkillCategorySchema.array().parse(skills);
