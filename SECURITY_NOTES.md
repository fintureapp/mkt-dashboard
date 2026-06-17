# Notas de segurança — setup inicial

> Este arquivo registra achados de segurança da preparação do repositório.
> **Nenhum valor de secret é copiado aqui.**

## Achados

### 1. `plano-saude-snapshot.json` — dados reais de CRM (PII)

- **O que é:** snapshot do funil "Criteria PME" com cards de leads. O campo
  `name` de vários cards contém **números de telefone reais** de leads (PII).
- **Decisão:** o arquivo **NÃO** foi versionado. Foi adicionado ao `.gitignore`.
- **Status:** o app lê o snapshot em runtime via `PLANO_SAUDE_SNAPSHOT_URL`
  (ver `src/lib/plano-saude.ts`), então não precisa estar no repositório.
- **Recomendação:** manter o snapshot fora do Git permanentemente; servir via URL
  protegida. Se ele já tiver sido compartilhado em algum lugar versionado,
  tratar como vazamento de PII.

### 2. `.env.local` — secrets reais

- **O que é:** contém valores reais de `META_ACCESS_TOKEN`, `BASIC_AUTH_*` e
  tokens do Chatwoot (`CHATWOOT_API_TOKEN`).
- **Decisão:** **NÃO** versionado (coberto por `.env*` no `.gitignore`). Apenas os
  **nomes** das variáveis foram propagados para `.env.example` e `docs/SECRETS.md`.
- **Recomendação:** se qualquer um desses valores já tiver sido exposto (chat,
  e-mail, commit antigo), **rotacionar** a credencial no provedor.

## Verificações executadas

- Busca por padrões de secret (`API_KEY`, `SECRET`, `TOKEN`, `PRIVATE_KEY`,
  `CLIENT_SECRET`, `DATABASE_URL`, tokens Meta `EAA...`, `Bearer ...`) em todo o
  código versionado: **somente referências a nomes de variáveis**, nenhum valor
  real hardcoded.
- Arquivos excluídos do push inicial: `.env.local`, `plano-saude-snapshot.json`,
  `tsconfig.tsbuildinfo`, `next-env.d.ts` (artefatos/segredos/PII).
