// src/data/personal-projects.ts — personal side-project portfolio entries.
// Static bilingual data; descriptions translated inline (no MDX needed for these).
export type ProjectStatus = 'live' | 'in-development';

export interface PersonalProject {
  id: string;
  name: string;
  description: { en: string; pt: string };
  stack: string[];
  status: ProjectStatus;
  screenshot?: string; // relative path under /personal-projects/
  liveUrl?: string;
  githubUrl?: string;
  accentColor: string; // Tailwind bg- class for placeholder gradient
}

export const personalProjects: PersonalProject[] = [
  {
    id: 'starlimp',
    name: 'Starlimp Jundiaí',
    description: {
      en: 'E-commerce website for a cleaning supplies company serving Jundiaí, Várzea Paulista, and Campo Limpo Paulista. WhatsApp-first ordering with category browsing.',
      pt: 'Site de e-commerce para empresa de produtos de limpeza atendendo Jundiaí, Várzea Paulista e Campo Limpo Paulista. Pedidos via WhatsApp com navegação por categorias.',
    },
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    status: 'live',
    screenshot: '/personal-projects/starlimp.png',
    liveUrl: 'https://starlimp-jundiai.vercel.app',
    githubUrl: 'https://github.com/LuizHAP/starlimpwebsite',
    accentColor: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'doacao',
    name: 'DoAção',
    description: {
      en: 'Platform connecting volunteers with local businesses in Jundiaí. Volunteers earn points for verified social actions (blood donation, clothing drives) and redeem rewards from partner companies.',
      pt: 'Plataforma que conecta voluntários com empresas locais em Jundiaí. Voluntários acumulam pontos por ações sociais verificadas (doação de sangue, roupas) e resgatam recompensas de parceiros.',
    },
    stack: ['Next.js', 'Supabase', 'Drizzle ORM', 'Tailwind CSS', 'Shadcn/UI', 'Zod'],
    status: 'in-development',
    githubUrl: 'https://github.com/LuizHAP/doacao',
    accentColor: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'notificame',
    name: 'NotificaMe',
    description: {
      en: 'Smart queue management system with geolocation-based automatic entry. Customers receive SMS/WhatsApp notifications and join queues remotely via location proximity.',
      pt: 'Sistema de gerenciamento de filas com entrada automática por geolocalização. Clientes recebem notificações SMS/WhatsApp e entram em filas remotamente pela proximidade.',
    },
    stack: ['NestJS', 'Prisma', 'PostgreSQL', 'Redis', 'Twilio'],
    status: 'in-development',
    githubUrl: 'https://github.com/LuizHAP/notificame',
    accentColor: 'from-violet-500/20 to-purple-500/20',
  },
  {
    id: 'mtgprice',
    name: 'MTG Price Monitor',
    description: {
      en: 'Magic: The Gathering card price tracker with Discord bot integration. Monitors price changes across multiple marketplaces and sends alerts when target prices are hit.',
      pt: 'Monitor de preços de cartas de Magic: The Gathering com bot para Discord. Monitora variações de preço em múltiplos marketplaces e alerta quando preços-alvo são atingidos.',
    },
    stack: ['Next.js', 'Drizzle ORM', 'TypeScript', 'Discord.js'],
    status: 'in-development',
    githubUrl: 'https://github.com/LuizHAP/mtgprice',
    accentColor: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: 'redzone-boss',
    name: 'Redzone Boss',
    description: {
      en: 'Landing page for an American football strategy simulator. Bilingual (PT/EN) with automatic language detection and early-access email capture.',
      pt: 'Landing page para um simulador de estratégia de futebol americano. Bilíngue (PT/EN) com detecção automática de idioma e captura de e-mail de acesso antecipado.',
    },
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    status: 'in-development',
    githubUrl: 'https://github.com/endzone-manager/website',
    accentColor: 'from-red-500/20 to-rose-500/20',
  },
];
