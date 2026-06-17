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
- **`.env.example`:** ampliado com as variáveis faltantes detectadas no código e em
  `.env.local` (Chatwoot, plano-saúde), todas com placeholder `replace_me`.
- **CLAUDE.md:** preserva o import `@AGENTS.md` original e adiciona as instruções
  específicas para Claude Code.
- **CODEOWNERS:** a org `fintureapp` não tem times definidos (consulta retornou
  vazio). Usado placeholder comentado; nenhum usuário/time inventado.
- **Branch protection / secret scanning / push protection / Dependabot:** não
  aplicáveis via MCP disponível → documentados como pendentes em
  `docs/GITHUB_SETTINGS.md` com comandos `gh` prontos.
