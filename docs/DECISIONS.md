# Decisões (DECISIONS)

Registro de decisões tomadas durante a preparação do repositório, especialmente
onde havia ambiguidade.

## 2026-06-17 — Setup inicial do repositório GitHub

- **Repositório:** criado como `fintureapp/mkt-dashboard`, **privado**, default
  branch `main`, com `autoInit` (README inicial substituído pelo README do projeto).
- **Operações de Git via API/MCP:** o binário `git` não está disponível no PATH do
  PowerShell desta máquina. Para não bloquear o setup nem arriscar stage acidental
  de secrets, as operações de repositório (criação de branch, commit, push, PR)
  foram feitas via **GitHub API (MCP)**, não via git local. O `.git` local
  permanece na branch `master` intocado.
- **Escopo do 1º PR:** import completo do projeto (código + baseline de docs e
  segurança) na branch `chore/setup-github-repo`, exceto arquivos sensíveis.
- **Arquivos excluídos do versionamento:**
  - `.env.local` — secrets reais (Meta + Chatwoot + basic auth).
  - `plano-saude-snapshot.json` — dados reais de CRM com PII (telefones de leads).
  - `tsconfig.tsbuildinfo`, `next-env.d.ts` — artefatos de build (gerados).
  - `src/app/favicon.ico` — binário; a API de push usada lida com texto. Pode ser
    re-adicionado manualmente; não afeta build (Next gera fallback).
  - `package-lock.json` — **propositalmente adiado** deste import. São 4088 linhas
    de JSON gerado com hashes de integridade; transcrevê-lo via API arriscaria
    corromper um hash e quebrar `npm ci`. O arquivo existe no disco e deve ser
    commitado por um cliente Git real num PR de follow-up. Enquanto isso, o CI usa
    `npm install` em vez de `npm ci`. **TODO:** commitar o lockfile e voltar o CI
    para `npm ci`.
- **`.env.example`:** ampliado com as variáveis faltantes detectadas no código e em
  `.env.local` (Chatwoot, plano-saúde), todas com placeholder `replace_me`.
- **CLAUDE.md:** preserva o import `@AGENTS.md` original e adiciona as instruções
  específicas para Claude Code.
- **CODEOWNERS:** a org `fintureapp` não tem times definidos (consulta retornou
  vazio). Usado placeholder comentado; nenhum usuário/time inventado.
- **Branch protection / secret scanning / push protection / Dependabot:** não
  aplicáveis via MCP disponível → documentados como pendentes em
  `docs/GITHUB_SETTINGS.md` com comandos `gh` prontos.

## 2026-11-03 · Painel único do CEO, sem login

- **O que mudou:** o app virou uma página só (`/`), inspirada na estrutura do
  painel "Live Ortega": 3 destaques + funil em barras horizontais + faixa de
  indicadores + últimas movimentações. Identidade visual Finture mantida.
- **Por quê:** o leitor principal passou a ser o CEO, que precisa da leitura mais
  simples possível do Plano de Saúde. Pedido explícito: substituir o app inteiro.
- **Removido:** Visão Geral Meta, Campanhas, Conjuntos, Anúncios, abas do Plano
  de Saúde (Executivo/Visão Geral/Kanban), Consórcio (páginas + `POST
  /api/consorcio/ingest`), link público `/publico/[token]` e o basic auth
  (`src/middleware.ts`). Tudo recuperável no commit `chore: versiona WIP pendente`.
- **Sem login, sem dado pessoal:** a página é pública (noindex). Por isso só o
  primeiro nome do lead é exibido; nomes que parecem contato (dígitos ou `@`)
  viram "Sem nome". Nome completo, telefone e id de conversa não são enviados ao
  browser (`recentMoves` só devolve campos não identificáveis; coberto por teste).
- **Categorias:** 6 etapas de saúde agrupando as 11 colunas do CRM por palavra-chave
  (`ceoStageOf`). Perdidos fora do funil, como indicador.
- **Não reproduzido da referência:** "Por que perdemos" e "Responsável" — o
  snapshot do CRM não traz motivo de perda nem responsável.
- **Testes:** primeiro runner do projeto, `node --test` com type stripping nativo
  do Node (sem dependência nova). `tsconfig` ganhou `allowImportingTsExtensions`.
