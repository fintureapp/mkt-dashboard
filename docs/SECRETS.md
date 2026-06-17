# Secrets necessários

> Apenas **nomes** e descrições. Nunca commitar valores reais. Veja `.env.example`.

| Secret | Onde é usado | Ambiente sugerido | Obrigatório | Observações |
|---|---|---|---|---|
| `META_ACCESS_TOKEN` | `src/lib/env.ts`, `src/lib/meta-api.ts`, `scripts/discover-actions.ts` | local, staging, production | Sim | Token Meta Marketing API (`ads_read`). Preferir system-user token (não expira). |
| `META_AD_ACCOUNT_ID` | `src/lib/env.ts`, `src/lib/meta-api.ts` | local, staging, production | Sim | ID numérico da conta, sem prefixo `act_`. Identificador de config (não é credencial). |
| `META_GRAPH_API_VERSION` | `src/lib/env.ts` | local, staging, production | Não | Default `v21.0`. |
| `BASIC_AUTH_USER` | `src/middleware.ts` | local, staging, production | Sim | Usuário do basic auth do app. |
| `BASIC_AUTH_PASS` | `src/middleware.ts` | local, staging, production | Sim | Senha forte (mín. 8 chars). |
| `PLANO_SAUDE_SNAPSHOT_URL` | `src/lib/plano-saude.ts` | local, staging, production | Não | URL do snapshot do funil de plano de saúde. |
| `CHATWOOT_BASE_URL` | integração Chatwoot | local, staging, production | Não | Base URL da instância Chatwoot. |
| `CHATWOOT_ACCOUNT_ID` | integração Chatwoot | local, staging, production | Não | ID da conta Chatwoot. |
| `CHATWOOT_API_TOKEN` | integração Chatwoot | local, staging, production | Não | Token de API do Chatwoot (secret). |
| `NEXT_PUBLIC_APP_URL` | front-end (público) | local, staging, production | Não | Exposto ao client (`NEXT_PUBLIC_`). Não usar para secrets. |

## Como configurar

- **Local:** copie `.env.example` para `.env.local` (não versionado) e preencha.
- **GitHub Actions:** use repository secrets ou environment secrets.
- **Produção:** preferir **environment secrets** com aprovação manual quando aplicável
  (ou as env vars do Vercel para o deploy).

### Comandos modelo (não executar com valores reais sem confirmação)

```bash
# Repository secret
gh secret set NOME_DO_SECRET --repo fintureapp/mkt-dashboard

# Environment secret (ex.: production)
gh secret set NOME_DO_SECRET --env production --repo fintureapp/mkt-dashboard
```

> Secrets reais **nunca** devem ser commitados. Para ambiente local, usar `.env.local`
> não versionado. Não executar comandos que solicitem/armazenem secrets reais sem
> confirmação explícita do usuário.
