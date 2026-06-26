# pansarinitech — Contexto de Design para Redesign

## Sobre o Projeto

Portfolio pessoal bilíngue (PT/EN) de **Luiz Pansarini**, Principal Software Engineer. Site pessoal para atrair recrutadores (BR + internacional), clientes freelance e comunidade dev.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (OKLCH), Shadcn/UI, TypeScript strict, next-intl (i18n), Motion (framer-motion), Geist Sans/Mono fonts.

**URL:** https://pansarinitech.vercel.app

---

## Identidade Visual Atual

### Tema Star Wars (Jedi / Sith)

O tema é a âncora visual do site. O toggle claro/escuro troca entre:
- **Modo Jedi (claro):** paleta azul de sabre de luz (oklch ~55% 0.18 250)
- **Modo Sith (escuro):** paleta vermelha de sabre de luz (oklch ~54% 0.21 28)

As cores primárias seguem as cores dos sabres. O resto da paleta (background, card, muted, border) usa uma matiz neutra (250° ~blue-ish gray). A única manifestação explícita do tema é o toggle no header — o resto do design é profissional, não temático.

### Paleta de Cores Atual

**Jedi (Claro):**
| Token | OKLCH |
|---|---|
| Background | oklch(98% 0.005 250) |
| Foreground | oklch(12% 0.01 250) |
| Card | oklch(94% 0.008 250) |
| Primary (saber blue) | oklch(55% 0.18 250) |
| Muted | oklch(90% 0.012 250) |
| Muted-foreground | oklch(38% 0.01 250) |

**Sith (Escuro):**
| Token | OKLCH |
|---|---|
| Background | oklch(10% 0.01 250) |
| Foreground | oklch(94% 0.008 250) |
| Card | oklch(15% 0.012 250) |
| Primary (saber red) | oklch(54% 0.21 28) |
| Muted | oklch(18% 0.015 250) |

### Tipografia

- **Geist Sans** — font-family principal (textos, headings)
- **Geist Mono** — código, emails, dados
- **FT Aurebesh** — decorativo, usado APENAS na página 404

### Ícones

- **Lucide React** — ícones de UI (Mail, Download, ExternalLink, TrendingUp, etc.)
- **@iconify/react** — logos de tecnologias (Next.js, React, TypeScript, etc.), pré-bundlados via script de build

---

## Páginas e Seções

### 1. Home Page (`/`)

A página principal em rolagem única com seções na ordem:

#### Hero
- Foto de perfil (redonda, 256px desktop / 160px mobile)
- Nome: "Luiz Pansarini"
- Role: "Principal Software Engineer · Brazil" / "Principal Software Engineer · Brasil"
- Value prop: ~30 palavras sobre a trajetória (IT helpdesk → Principal Engineer em 14 anos, Next.js, React Native, aberto a oportunidades)
- 2 CTAs: "Contact" (âncora #contact) + "Resume" (download PDF)
- Layout: mobile empilhado (foto acima do texto), desktop lado a lado (foto à direita)

#### About
- Stats row: 4 cards (14 years in tech · 5 companies · BR+US markets · 100M+ users reached)
- 4 bullet highlights com ícones Lucide (TrendingUp, Code2, Smartphone, Globe)
- Cadence text (itálico): sobre frequência de atualização
- Animações RevealGroup/RevealItem (stagger)

#### Featured Projects
- Grid 1-3 cards dos projetos em destaque
- Cada card: imagem hero (16:10), título, role · year, blurb (2 linhas)
- Links: "View all projects →" + "Read the blog →"
- 3 colunas desktop, 2 tablet, 1 mobile

#### Personal Projects
- Grid de side-projects pessoais
- Cada card: screenshot ou gradient placeholder, nome, status badge (live/in-development), descrição (3 linhas), stack badges, links (live site + GitHub)
- 3 colunas desktop, 2 tablet, 1 mobile

#### Career Timeline
- Timeline vertical com rail (border-l) à esquerda
- 5 cargos em ordem cronológica reversa
- 2019 UAUBox marcado como "pivot" (IT → Engineering) com dot colorido + tooltip
- Cada entry: empresa, cargo, período, 3 bullet points

#### Skills
- Grid de badges com filtro por categoria (All, Frontend, Mobile, Backend, Testing, Cloud, Databases, Tools)
- Cada badge: logo SVG ou monograma + nome
- Itens "daily use" com underline decorativo
- Mobile: filter chips com scroll horizontal

#### Now Preview
- Trecho da página /now na home
- Timestamp "Last updated: [data]"
- Parágrafo + link "Ver mais na página /now →"

#### Blog Preview
- Últimos 3 posts
- Cada post: PostCard component (título, data, reading time, tags, blurb)
- Link "View all posts →"

#### Contact
- Email com mailto + botão copiar
- LinkedIn + GitHub links
- Download currículo
- Layout: flex-wrap row de botões

### 2. Blog Listing (`/blog`)

- Título + intro text
- Lista vertical de PostCards
- Primeiro post sem animation (LCP optimization)
- RSS feed links no head

### 3. Blog Post (`/blog/[slug]`)

- MDX renderizado via next-mdx-remote
- rehype-pretty-code para syntax highlighting (Shiki dual-theme light/dark)
- TOC sidebar (desktop) + TOC mobile (sheet)
- Reading time, published date, tags
- Callout components (info, warn, error)
- Copy code button

### 4. Projects Listing (`/projects`)

- Grid 3 colunas de cards de projetos
- Cada card: hero image (16:10), título, role · year, stack badges (max 5), blurb, "Read more →"
- 5 projects no total

### 5. Project Detail (`/projects/[slug]`)

- Case study em MDX
- CaseStudyHero section (imagem full-width, título, role, year, stack)
- Conteúdo MDX completo

### 6. Now Page (`/now`)

- 3 seções em cards: "Working on", "Reading / Learning", "Side / Personal"
- Timestamp de última atualização

### 7. 404

- Título "404" em Aurebesh (fonte decorativa)
- Referência Star Wars: "Estas não são as páginas que você procura."
- CTA "Voltar para o início"

---

## Conteúdo Bilíngue

**Locales:** en (Inglês) / pt (Português Brasileiro)

Tudo é bilíngue:
- Dados estáticos tipados com `{ en: string; pt: string }`
- Traduções via next-intl (arquivos JSON: `messages/en.json`, `messages/pt.json`)
- MDX posts: arquivos separados por locale (`*.en.mdx` / `*.pt.mdx`)
- Currículo: PDF separado por locale

---

## Público-Alvo

1. **Recrutadores** (BR e EUA) — precisam entender "Principal Engineer" em 5 segundos no celular
2. **Hiring managers** — buscam evidência técnica (case studies, blog, career timeline)
3. **Clientes freelance** — querem ver projetos reais e contato direto
4. **Comunidade dev** — consumo de blog e patterns técnicos

## Objetivo do Redesign

**"Mais impacto visual"** — o site é funcional e acessível mas visualmente sóbrio demais. Queremos:
- Layouts mais marcantes e memoráveis
- Melhor hierarquia visual entre seções
- Transições e micro-interações que encantem sem sacrificar performance
- Mais personalidade (sem perder o profissionalismo)
- Aproveitar melhor o tema Star Wars de forma sutil

---

## Restrições Técnicas

### Performance (não negociável)
- SSG (Static Site Generation) — todas as rotas devem ser ● (static), não ƒ (dynamic)
- Lighthouse ≥ 95 em Performance no mobile
- LCP < 2.5s, TBT < 200ms, CLS < 0.1
- Nenhuma lib de animação pode bloquear LCP (primeiro card sem animation)

### Acessibilidade (não negociável)
- WCAG 2.1 AA em todas as páginas, temas e locales
- axe-core score 1.0
- prefers-reduced-motion respeitado
- Skip-to-content, focus ring, contraste 4.5:1+

### Layout
- Mobile-first: testado em iPhone SE (375px) até desktop largo
- Layouts responsivos com grid
- Sem scroll horizontal

### Tema
- Toggle claro/escuro com View Transitions API (efeito radial reveal)
- Paleta CSS variables (não usar Tailwind arbitrary values para cor)
- OKLCH para todas as cores

---

## Como o Design Se Relaciona com o Código

- Cada seção da home é um componente independente em `src/components/sections/`
- Dados estáticos em `src/data/` (tipados com Zod)
- Tema via CSS variables em `globals.css`
- Animações via `motion` (framer-motion) — RevealGroup, RevealItem, childVariant
- Não há CSS modules — tudo é Tailwind utility classes
- shadcn/ui components em `src/components/ui/`
- Ícones: Lucide (UI) + @iconify (logos tech)
