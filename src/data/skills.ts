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
      { name: 'Next.js', daily: true, icon: 'logos:nextjs-icon' },
      { name: 'React', icon: 'logos:react' },
      { name: 'TypeScript', daily: true, icon: 'logos:typescript-icon' },
      { name: 'Tailwind CSS', daily: true, icon: 'logos:tailwindcss-icon' },
      { name: 'Shadcn/UI', daily: true, mono: 'ui', textBadge: true },
      { name: 'Radix UI', icon: 'logos:radix-ui' },
      { name: 'HTML/CSS', icon: 'logos:html-5' },
    ],
  },
  {
    id: 'mobile',
    label: { en: 'Mobile', pt: 'Mobile' },
    items: [
      { name: 'React Native', daily: true, icon: 'logos:react' },
      { name: 'Expo', icon: 'logos:expo-icon' },
      { name: 'iOS / Android', icon: 'logos:android-icon' },
    ],
  },
  {
    id: 'backend',
    label: { en: 'Backend', pt: 'Backend' },
    items: [
      { name: 'Node.js', icon: 'logos:nodejs-icon' },
      { name: 'TypeScript (server)', icon: 'logos:typescript-icon' },
      { name: 'REST APIs', mono: '{ }', textBadge: true },
      { name: 'GraphQL', icon: 'logos:graphql' },
      { name: 'Server Actions', mono: 'RSC', textBadge: true },
    ],
  },
  {
    id: 'testing',
    label: { en: 'Testing', pt: 'Testes' },
    items: [
      { name: 'Playwright', icon: 'logos:playwright' },
      { name: 'Jest', icon: 'logos:jest' },
      { name: 'React Testing Library', icon: 'logos:testing-library' },
      { name: 'Vitest', icon: 'logos:vitest' },
      { name: 'axe-core', mono: 'axe', textBadge: true },
    ],
  },
  {
    id: 'cloud',
    label: { en: 'Cloud / DevOps', pt: 'Cloud / DevOps' },
    items: [
      { name: 'Vercel', daily: true, icon: 'logos:vercel-icon' },
      { name: 'AWS', icon: 'logos:aws' },
      { name: 'GitHub Actions', icon: 'logos:github-actions' },
      { name: 'Docker', icon: 'logos:docker-icon' },
    ],
  },
  {
    id: 'databases',
    label: { en: 'Databases', pt: 'Bancos de Dados' },
    items: [
      { name: 'PostgreSQL', icon: 'logos:postgresql' },
      { name: 'MongoDB', icon: 'logos:mongodb-icon' },
      { name: 'Redis', icon: 'logos:redis' },
      { name: 'Prisma', icon: 'logos:prisma' },
    ],
  },
  {
    id: 'tools',
    label: { en: 'Tools', pt: 'Ferramentas' },
    items: [
      { name: 'Git', icon: 'logos:git-icon' },
      { name: 'GitHub', icon: 'logos:github-icon' },
      { name: 'VS Code', icon: 'logos:visual-studio-code' },
      { name: 'Figma', icon: 'logos:figma' },
      { name: 'Biome', icon: 'logos:biome' },
      { name: 'pnpm', icon: 'logos:pnpm' },
    ],
  },
];

SkillCategorySchema.array().parse(skills);
