# Configurações recomendadas do GitHub

Checklist das configurações de segurança que devem estar ativas em
`fintureapp/mkt-dashboard`. Itens marcados `[x]` foram aplicados durante o setup;
os demais ficam **pendentes** (ferramenta/MCP não permitiu aplicar automaticamente)
e devem ser configurados manualmente na UI do GitHub ou via `gh`.

## Repositório

- [x] Repositório privado
- [x] Default branch: `main`
- [ ] Issues habilitadas (validar — padrão é habilitado)
- [ ] Pull Requests habilitados (padrão habilitado)
- [ ] Wiki desabilitada se não for usada
- [ ] Projects habilitado apenas se necessário
- [ ] Topics configurados: `marketing`, `data`, `automation`, `analytics`,
      `pipeline`, `dashboard`, `internal`
      ```bash
      gh repo edit fintureapp/mkt-dashboard \
        --add-topic marketing --add-topic data --add-topic automation \
        --add-topic analytics --add-topic pipeline --add-topic dashboard \
        --add-topic internal
      ```

## Branch protection / ruleset para `main`

> Pendente — não aplicável via MCP disponível. Configurar em
> Settings → Rules → Rulesets (ou Branch protection rules).

- [ ] Bloquear push direto na `main`
- [ ] Exigir Pull Request antes do merge
- [ ] Exigir pelo menos 1 aprovação
- [ ] Exigir status checks passando (após o CI `ci.yml` rodar pela 1ª vez,
      selecionar os checks: `lint-typecheck-build`)
- [ ] Exigir branch atualizada antes do merge
- [ ] Bloquear force push
- [ ] Bloquear deleção da branch
- [ ] Exigir revisão de CODEOWNERS quando aplicável

Exemplo via `gh` (ajuste conforme a política):

```bash
gh api -X PUT repos/fintureapp/mkt-dashboard/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "enforce_admins=true" \
  -F "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=lint-typecheck-build" \
  -F "restrictions=null" \
  -F "allow_force_pushes=false" \
  -F "allow_deletions=false"
```

## Secret scanning e push protection

> Pendente — habilitar em Settings → Code security.

- [ ] Secret scanning habilitado
- [ ] Push protection habilitado
- [ ] Dependabot alerts habilitado
- [ ] Dependabot security updates habilitado

```bash
gh api -X PATCH repos/fintureapp/mkt-dashboard \
  -F "security_and_analysis[secret_scanning][status]=enabled" \
  -F "security_and_analysis[secret_scanning_push_protection][status]=enabled"
```

## GitHub Actions

- [ ] Secrets configurados como repository/environment secrets (ver `docs/SECRETS.md`)
- [ ] Ambientes `staging` / `production` criados quando necessário
- [ ] Produção exige aprovação manual quando aplicável
- [x] Workflows usam permissões mínimas (`permissions: contents: read`)
