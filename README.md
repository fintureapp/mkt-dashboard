# mkt-dashboard

## Objetivo

Painel interno (BI) de KPIs de marketing de performance da **Meta Ads** para a
Criteria Seguros, com identidade visual Finture. Agrega investimento, leads,
CPL, conversões e tendência por campanha / conjunto / anúncio, além de um
recorte do funil de Plano de Saúde. Construído em Next.js 16 + React 19 e
deployado no Vercel.

## Contexto

Projeto de **marketing / dados / analytics interno**. Consome a Graph API da
Meta (Marketing API) para montar dashboards de mídia paga e tracking de funil.
Não é um produto público: fica atrás de basic auth e é usado pelo time interno
para acompanhar performance de campanhas e geração de leads.

## Estrutura do projeto

```
src/
├── app/
│   ├── (dashboard)/            # route group, layout compartilhado
│   │   ├── layout.tsx          # header + footer
│   │   ├── page.tsx            # / (overview)
│   │   ├── campanhas/page.tsx
│   │   ├── conjuntos/page.tsx
│   │   ├── anuncios/page.tsx
│   │   ├── plano-saude/page.tsx
│   │   ├── error.tsx           # error boundary
│   │   ├── loading.tsx         # skeleton
│   │   └── _lib/level-page.tsx # helper das páginas de nível
│   ├── publico/[token]/page.tsx # link público (sem login) da Visão Geral
│   ├── actions/refresh.ts      # Server Action: updateTag('meta:insights')
│   ├── layout.tsx
│   └── globals.css             # tokens Finture (Tailwind v4)
├── components/
│   ├── ui/                     # primitivas shadcn/ui
│   ├── kpi-card.tsx · insights-table.tsx · trend-chart.tsx · sparkline.tsx
│   ├── overview-report.tsx     # corpo da Visão Geral (usado por / e /publico)
│   ├── period-selector.tsx · refresh-button.tsx · header*.tsx · footer.tsx
└── lib/
    ├── meta-api.ts             # cliente Graph com 'use cache'
    ├── meta-types.ts           # schemas Zod
    ├── kpi-calc.ts             # derivações (CPL, ROAS, ROI, ConvRate)
    ├── period.ts               # período + comparação anterior
    ├── conversion-mapping.ts   # action_type -> KPI
    ├── plano-saude.ts          # snapshot do funil de plano de saúde
    ├── format.ts · env.ts · utils.ts

src/middleware.ts               # basic auth (Edge runtime)
scripts/discover-actions.ts     # descobre action_types da conta
docs/                           # SECRETS.md, GITHUB_SETTINGS.md, DECISIONS.md
.github/                        # CI, CODEOWNERS, PR template, dependabot
```

## Como rodar localmente

Pré-requisitos: Node 20+, npm, e um token da Meta Marketing API (`ads_read`).
Detalhes da geração do token estão em **Pré-requisitos manuais** abaixo.

```bash
npm install
cp .env.example .env.local   # preencha os valores (NUNCA commite .env.local)
npm run dev
```

Abra http://localhost:3000 → o browser pede basic auth → entre com
`BASIC_AUTH_USER` / `BASIC_AUTH_PASS` → o dashboard carrega.

### Link público da Visão Geral (sem login)

Para compartilhar **apenas a Visão Geral** com terceiros (ex.: agência de mídia)
sem exigir login, existe a rota `/publico/<token>`:

- O acesso é por um **token secreto na URL** (`PUBLIC_SHARE_TOKEN`). O link é a
  chave — quem tiver a URL vê os números (investimento, ROI, campanhas). A página
  é **read-only**, **não indexável** (noindex) e não dá acesso às outras abas.
- **Fail-closed:** sem `PUBLIC_SHARE_TOKEN` configurado (ou com token errado), a
  rota cai no basic auth normal. Nada é exposto por acidente.
- **Revogar:** troque o valor de `PUBLIC_SHARE_TOKEN` — o link antigo para de
  funcionar na hora.

Gerar um token forte:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Defina em `.env.local` (dev) e nas env vars do Vercel (produção). O link fica
`https://<seu-domínio>/publico/<token>`.

### Pré-requisitos manuais (token Meta)

**Recomendado (não expira):** System User token no Business Manager
1. Business Settings → System Users → Add → "Marketing BI Reader"
2. Assign Assets → a conta de anúncios → View
3. Generate New Token → app + escopo `ads_read` → "Never expires"

**Alternativa rápida (60d):** Graph API Explorer com escopo `ads_read`, depois
troque o token curto por um long-lived via `oauth/access_token` (`grant_type=fb_exchange_token`).

Para descobrir os `action_type` corretos da conta (afeta CPL/Conversões):

```bash
npx tsx scripts/discover-actions.ts
```

## Comandos úteis

| Tarefa | Comando |
|---|---|
| Instalar dependências | `npm install` |
| Rodar localmente | `npm run dev` |
| Rodar testes | Ainda não configurado |
| Rodar lint | `npm run lint` (Biome) |
| Formatar | `npm run format` |
| Lint + format autofix | `npm run check` |
| Type-check | `npm run typecheck` |
| Build de produção | `npm run build` |
| Servir build | `npm run start` |

## Variáveis de ambiente

Secrets reais **nunca** devem ser commitados. Use `.env.local` (ignorado pelo
Git) localmente e GitHub/Vercel Secrets em ambientes remotos. Todos os nomes de
variáveis estão em [`.env.example`](.env.example); a documentação de cada secret
está em [`docs/SECRETS.md`](docs/SECRETS.md).

## Dados e arquivos sensíveis

- **Não** versionar bases reais de clientes, leads ou usuários.
- **Não** versionar exports de CRM, plataformas de mídia, analytics ou planilhas
  internas (Meta Ads, Google Ads, GA4, BigQuery, HubSpot, RD Station, Chatwoot etc.).
- **Não** versionar arquivos `.env` / `.env.*`.
- **Não** versionar credenciais, tokens, chaves privadas ou service accounts.
- Usar apenas **dados sintéticos** ou exemplos pequenos em `data/sample/`.

> ⚠️ O arquivo `plano-saude-snapshot.json` contém dados reais de CRM (PII) e está
> ignorado de propósito. Ver [`SECURITY_NOTES.md`](SECURITY_NOTES.md).

## Segurança

- Trabalhar sempre em **branch**, nunca direto na `main`.
- Abrir **Pull Request** e exigir **revisão humana** antes do merge.
- **Sem push direto na `main`** (protegida por ruleset — ver [`docs/GITHUB_SETTINGS.md`](docs/GITHUB_SETTINGS.md)).
- Rodar lint / typecheck / build antes do PR (testes quando existirem).
- Atualizar a documentação quando mudar comportamento relevante.

Política completa em [`SECURITY.md`](SECURITY.md).

## Deploy ou execução em produção

Deploy no **Vercel** (App Router + Cache Components). O modelo de cache usa
`'use cache'` + `cacheTag('meta:insights')` + `cacheLife('hours')`; o botão
"Atualizar" dispara a Server Action `refreshInsights()` → `updateTag(...)`.
Configurar as env vars de Production/Preview no painel do Vercel:
`META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_GRAPH_API_VERSION`,
`BASIC_AUTH_USER`, `BASIC_AUTH_PASS` (+ Chatwoot / plano-saúde se usados,
+ `PUBLIC_SHARE_TOKEN` se o link público da Visão Geral estiver em uso).

Não há cron / job agendado identificado neste setup inicial.

## Manutenção

1. Criar issue.
2. Criar branch (`feat/...`, `fix/...`, `chore/...`).
3. Alterar código (mudanças pequenas e revisáveis).
4. Rodar lint / typecheck / build (e testes quando existirem).
5. Abrir PR usando o template.
6. Revisar (humano).
7. Fazer merge.
8. Atualizar changelog / docs quando aplicável.

## Responsáveis

- Owner técnico: [PREENCHER]
- Owner de negócio: [PREENCHER]
