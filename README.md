# mkt-dashboard

## Objetivo

Painel do **CEO** para o funil comercial do **Plano de Saúde** (Criteria PME),
com identidade visual Finture. Uma página só, pensada para ser lida em segundos:
quantos leads chegaram, quanto está em negociação, quanto virou venda, onde os
leads estão agora e quanto a mídia custou por venda. Next.js 16 + React 19, no Vercel.

## Contexto

Lê o snapshot do CRM (Kanban do Chatwoot, gravado por um coletor externo) e o
investimento da conta Meta Ads. **Não tem login**: a página é pública para quem
tiver a URL, não é indexada (noindex) e **não mostra dado pessoal** (só o
primeiro nome do lead; telefone, e-mail e sobrenome nunca saem do servidor).

### O que a página mostra

- **Período:** Tudo / Hoje / 7 dias / 30 dias (padrão) ou intervalo livre (de/até).
  Fica na URL (`?p=7d`, `?since=AAAA-MM-DD&until=AAAA-MM-DD`). O recorte é pela
  data de **entrada** do lead no CRM; a etapa é a de agora.
- **Destaques:** leads que chegaram · volume em negociação (R$ das propostas em
  cotação + negociação) · conversão em vendas.
- **Funil em 6 etapas** (agrupa as colunas do CRM por palavra-chave, ver
  `ceoStageOf` em `src/lib/plano-saude.ts`):

  | Etapa | Colunas do CRM |
  |---|---|
  | Novos leads | Novos Leads, Validação de Dados |
  | Leads frios | Leads Frios - Segunda Validação |
  | Em atendimento | Necessita Atendimento |
  | Em cotação | Enviado para Cotação, Atendimento Humano / Em Cotação |
  | Em negociação | Negociação, Negociações quentes |
  | Vendas | Fechado - Ganho, Boleto pago (valor ×3, regra do negócio) |

  "Fechado - Perdido" aparece à parte, no indicador **Perdidos**.
- **Funil de conversão** (`ceoFunnel`): Leads → Atendidos → Cotação → Negociação →
  Vendas. Cada etapa conta quem **chegou nela ou passou dela**, e a pílula mostra a
  conversão sobre a etapa anterior (ex.: dos que chegaram à cotação, quantos foram
  para negociação). Perdidos contam como tendo passado por atendimento e cotação (o
  CRM não registra onde o lead foi perdido). Leads frios e novos parados aparecem numa
  linha abaixo do funil. Horizontal no desktop, vertical no celular; animação
  desligada com "reduzir movimento".
- **Indicadores:** em andamento · vendas · perdidos · investimento em mídia
  (Meta, mesmo período) · custo por venda.
- **Criativos com melhor desempenho:** os 3 anúncios com mais leads no período
  (anúncios de mesmo nome em conjuntos diferentes são somados), com imagem, leads,
  CPL e investimento.
- **Últimas movimentações:** 12 cards mais recentes (primeiro nome, etapa, valor real do card, datas).

## Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx                # a página do CEO (única rota)
│   ├── actions/refresh.ts      # Server Action do botão Atualizar
│   ├── layout.tsx              # fontes + metadata (noindex)
│   └── globals.css             # tokens Finture (Tailwind v4)
├── components/
│   ├── ui/                     # primitivas shadcn/ui
│   ├── ui/funnel-chart.tsx     # funil SVG animado (motion), adaptado
│   └── ceo/                    # hero-funnel · stage-funnel · stat-strip · top-creatives · recent-table · period-pills · refresh-button
└── lib/
    ├── plano-saude.ts          # snapshot do CRM + ceoSummary / recentMoves / firstName
    ├── plano-saude.test.ts     # testes (node:test)
    ├── ceo-period.ts           # Tudo / Hoje / 7d / 30d / intervalo livre
    ├── ceo-data.ts             # dados da página (CRM + Meta + criativos) por recorte
    ├── creatives.ts            # top criativos da Meta (com imagem)
    ├── meta-api.ts             # cliente Graph com 'use cache'
    ├── kpi-calc.ts · meta-types.ts · conversion-mapping.ts · period.ts
    └── format.ts · env.ts · utils.ts

scripts/discover-actions.ts     # descobre action_types da conta
docs/                           # SECRETS.md, GITHUB_SETTINGS.md, DECISIONS.md
```

As telas antigas (Visão Geral Meta, Campanhas, Conjuntos, Anúncios, abas do
Plano de Saúde, Consórcio, link público e basic auth) foram removidas na
repaginação; continuam no histórico do Git (commit `chore: versiona WIP pendente`).

## Como rodar localmente

Pré-requisitos: Node 22.6+ (CI e Vercel usam 24), npm, e um token da Meta Marketing API (`ads_read`).
Detalhes da geração do token estão em **Pré-requisitos manuais** abaixo.

```bash
npm install
cp .env.example .env.local   # preencha os valores (NUNCA commite .env.local)
npm run dev
```

Abra http://localhost:3000 (sem login). Em dev, sem `PLANO_SAUDE_SNAPSHOT_URL`,
o CRM é lido de `plano-saude-snapshot.json` na raiz (ignorado pelo Git).

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
| Rodar testes | `npm test` (node:test, Node 22.6+) |
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
- Rodar lint / typecheck / test / build antes do PR.
- Atualizar a documentação quando mudar comportamento relevante.

Política completa em [`SECURITY.md`](SECURITY.md).

## Deploy ou execução em produção

Deploy no **Vercel** (App Router + Cache Components). O modelo de cache usa
`'use cache'` + `cacheTag('meta:insights')` + `cacheLife('hours')`; o botão
"Atualizar" dispara a Server Action `refreshInsights()` → `updateTag(...)`.
Configurar as env vars de Production/Preview no painel do Vercel:
`META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_GRAPH_API_VERSION`,
`PLANO_SAUDE_SNAPSHOT_URL`. `BASIC_AUTH_*`, `PUBLIC_SHARE_TOKEN`, `CONSORCIO_*` e `ANTHROPIC_API_KEY`
não são mais lidas e podem ser apagadas do Vercel.

Não há cron / job agendado identificado neste setup inicial.

## Manutenção

1. Criar issue.
2. Criar branch (`feat/...`, `fix/...`, `chore/...`).
3. Alterar código (mudanças pequenas e revisáveis).
4. Rodar lint / typecheck / test / build.
5. Abrir PR usando o template.
6. Revisar (humano).
7. Fazer merge.
8. Atualizar changelog / docs quando aplicável.

## Responsáveis

- Owner técnico: [PREENCHER]
- Owner de negócio: [PREENCHER]
