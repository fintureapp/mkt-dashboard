@AGENTS.md

# CLAUDE.md

> O import `@AGENTS.md` acima é obrigatório e contém avisos sobre esta versão do
> Next.js (breaking changes). Leia-o antes de escrever código.

## Papel do Claude neste projeto

Você é um agente de desenvolvimento assistido. Sua função é ajudar a manter,
documentar, testar e melhorar este projeto **sem comprometer segurança, dados
sensíveis ou estabilidade**.

## Regras obrigatórias

- Nunca commitar `.env`, `.env.*`, credenciais, tokens, cookies, chaves privadas,
  service accounts ou secrets.
- Nunca imprimir secrets em terminal, logs, commits, issues, PRs ou documentação.
- Nunca fazer push direto para `main`.
- Sempre trabalhar em branch.
- Sempre abrir Pull Request para revisão humana.
- Nunca fazer merge sem aprovação explícita.
- Nunca remover arquivos importantes sem explicar no PR.
- Nunca alterar configurações de produção sem aprovação explícita.
- Sempre preservar compatibilidade quando possível.
- Sempre atualizar `README.md` quando mudar comportamento, comandos ou estrutura.
- Sempre atualizar `.env.example` quando criar nova variável de ambiente.
- Sempre adicionar/atualizar testes quando alterar lógica relevante.

## Fluxo de trabalho

1. Entender a issue ou solicitação.
2. Inspecionar o projeto.
3. Criar branch descritiva.
4. Fazer alterações pequenas e revisáveis.
5. Rodar lint / typecheck / build (e testes quando existirem).
6. Atualizar documentação.
7. Criar commit com mensagem clara.
8. Abrir Pull Request com resumo, validações executadas e riscos.

## Segurança

- Tratar todos os dados reais como sensíveis.
- Usar somente dados sintéticos em exemplos (`data/sample/`).
- Não versionar exports de CRM/mídia (Meta Ads, Google Ads, GA4, BigQuery,
  HubSpot, RD Station, Chatwoot, planilhas internas ou bases de leads).
- Caso encontre um secret no diretório, **não commitar**.
- Caso encontre possível secret já versionado, **pausar**, registrar em
  `SECURITY_NOTES.md` e recomendar **rotação** da credencial.

## Antes de cada commit

- `git status` e revisar os arquivos staged.
- Verificar que não há `.env`, secrets, dados reais ou arquivos grandes.
- Rodar as validações disponíveis (`npm run lint`, `npm run typecheck`, `npm run build`).
- Atualizar documentação se necessário.

> Nota operacional: nesta máquina o binário `git` pode não estar no PATH do
> PowerShell. Quando esse for o caso, as operações de repositório (branch,
> commit, PR) são feitas via GitHub API/MCP — ver `docs/DECISIONS.md`.

## Critérios de aceite

Uma tarefa só está pronta quando:

- O código foi alterado na branch correta.
- Não há secrets ou dados sensíveis no commit.
- Lint / typecheck / build (e testes quando existirem) foram executados.
- `README.md` e `.env.example` estão atualizados quando necessário.
- O PR explica mudanças, riscos e validações.
