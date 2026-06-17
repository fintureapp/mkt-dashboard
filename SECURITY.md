# Política de segurança

## Dados sensíveis

Este repositório **não** deve conter dados reais de clientes, leads, usuários,
credenciais ou exports internos. Apenas dados sintéticos ou amostras pequenas em
`data/sample/` são permitidos.

## Secrets

Secrets devem ficar **fora do Git** e ser configurados em ferramentas próprias:

- Local: `.env.local` (não versionado).
- CI: GitHub Actions repository/environment secrets.
- Produção: Vercel env vars / GitHub Environment secrets (com aprovação manual
  quando aplicável).

Os secrets necessários estão documentados (apenas por nome) em
[`docs/SECRETS.md`](docs/SECRETS.md).

## Vazamento acidental

Se um secret for commitado:

1. **Não** reutilizar o secret.
2. Remover do código.
3. **Rotacionar** a credencial no provedor.
4. Avaliar o histórico do Git (o valor pode persistir em commits antigos).
5. Registrar o incidente internamente.
6. Abrir PR de correção **sem expor o valor** do secret.

## Pull Requests

Toda alteração deve passar por **PR e revisão humana**. Não há push direto na
`main` (ver [`docs/GITHUB_SETTINGS.md`](docs/GITHUB_SETTINGS.md)).

## Reporte de vulnerabilidades

Para reportar uma vulnerabilidade, abra uma issue privada ou contate o owner
técnico do repositório (ver `README.md` > Responsáveis). Não divulgue detalhes
publicamente antes da correção.
