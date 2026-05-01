# pansarinitech

Bilingual (PT/EN) personal portfolio for **Luiz Pansarini**, Principal Software Engineer.
Subtle Star Wars aesthetic via a Jedi (light) / Sith (dark) theme toggle.

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind v4 · Shadcn/UI · next-intl · next-themes · motion · Vercel.

Locked technical decisions, library versions, and "what NOT to use" live in [`CLAUDE.md`](./CLAUDE.md).

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000 — auto-redirects / → /en or /pt (Accept-Language)
pnpm build        # production build (Turbopack)
pnpm start        # serve the production build
```

## Quality gates

```bash
pnpm exec biome check .                              # lint + format (D-16: replaces ESLint+Prettier)
pnpm exec tsc --noEmit                               # TypeScript strict
pnpm next build 2>&1 | tee /tmp/build.log            # build (single run)
pnpm verify:static /tmp/build.log                    # parse build log: all [locale] routes SSG (●), no unexpected ƒ
pnpm test:a11y                                       # axe-core matrix: en/pt × light/dark × home/404 — 0 violations
pnpm test:sith                                       # Sith-red contrast regression smoke (THEME-06)
```

Every PR runs all gates via [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). Lighthouse runs main-only via [`.github/workflows/lighthouse.yml`](./.github/workflows/lighthouse.yml) (failures open an issue; do not block deploys).

## Planning

Vision, phase plans, and decisions: [`.planning/PROJECT.md`](./.planning/PROJECT.md), [`.planning/ROADMAP.md`](./.planning/ROADMAP.md), [`.planning/phases/`](./.planning/phases/).

## Author

Luiz Pansarini · Principal Software Engineer · [linkedin.com/in/luizpansarini](https://linkedin.com/in/luizpansarini) · [github.com/LuizHAP](https://github.com/LuizHAP)

## License

MIT
