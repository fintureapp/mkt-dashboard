# Product

## Register

product

## Users

Três perfis acessam o mesmo painel, em contextos diferentes:

- **Gestor de mídia / BI (Finture)** — uso diário e semanal. Abre com a pergunta "estamos no caminho ou precisa intervir?". Faz drill-down de overview → campanha → conjunto → anúncio. Usa em monitor de trabalho.
- **Time de marketing Criteria Seguros** — acompanhamento de performance sem operar Meta Ads diretamente. Quer entender se a verba está rendendo, sem precisar ler documentação para decifrar a tela.
- **Liderança / diretoria Criteria** — vista de cima, foco em ROI/ROAS e tendência. Aparece em reuniões de status, frequentemente projetado em sala. Texto pequeno e cinza fraco morre nesse cenário.

Job-to-be-done unificado: **em até 2 segundos, saber se a operação Meta Ads está saudável; em mais 30 segundos, saber onde intervir.**

## Product Purpose

Painel próprio de KPIs Meta Ads (Criteria Seguros) com identidade Finture. Substitui Looker Studio / Ads Manager para a leitura recorrente de performance: investimento, leads, CPL, ROAS, tendência e ranking de campanhas/conjuntos/anúncios.

Sucesso é:
- Decisão de mídia mais rápida que abrir o Ads Manager.
- Reuniões de status que dispensam slide — projeta o dashboard.
- Cliente sente que está olhando para um produto Finture, não um template de BI.

## Brand Personality

**Confiante + editorial (híbrido).** Especialista que conhece o assunto e mostra isso na precisão dos números, não no exagero da forma. Densidade de produto profissional (Linear, Stripe) por baixo; respiro e ritmo editoriais (Are.na, Readymag) por cima.

Voz: direta, em pt-BR, sem jargão de SaaS. Rótulos curtos, números completos. Se um KPI precisa de explicação, a explicação é parte do KPI, não um ícone de ajuda.

Sensações desejadas: domínio tranquilo, confiança técnica, "alguém pensou nisso".

## Anti-references

- **Looker Studio / Power BI corporativo** — filtros genéricos no topo, tudo em caixinhas brancas com sombra, paleta categórica saturada, zero personalidade. É o que o cliente já tinha; o ponto de existir esse painel é não ser isso.
- **Material/Bootstrap padrão** — sombra elevada em tudo, cantos arredondados por reflexo, paleta Material. Assina "construído rápido com lib pronta", não "produto Finture".
- **Hero-metric template SaaS** — número gigante, label miúdo, gradiente de fundo, "+12% vs período anterior" em verde fluor. Clichê.
- **Identical card grid** — mesmos cards repetidos em grid 4xN. Se todos os KPIs têm o mesmo peso visual, nenhum tem peso.
- **Dashboard genérico shadcn** — dark + neutro cinza + accent azul, primitives sem opinião. Stack é shadcn, mas a identidade tem que cobrir o esqueleto.

## Design Principles

1. **Hierarquia primeiro, densidade depois.** O número que importa salta em 2s. Só depois o operador desce no detalhe. Nem todo KPI tem o mesmo peso — investimento, CPL e ROAS dominam; o resto serve.

2. **Editorial no esqueleto, produto no detalhe.** O ritmo da página (margens, escala tipográfica, espaçamento entre seções) vem do mundo editorial. Os componentes internos (tabelas, números, tooltips) vêm do mundo de produto profissional, com tabular-nums e densidade real.

3. **Identidade na pele, não na decoração.** Finture aparece na materialidade — creme `#f8f1e7`, dark quente `#1b1a1a`, laranja `#ea622d` como instrumento — e na tipografia (Space Grotesk display + IBM Plex Sans). Não em logos repetidos, ornamentos ou padrões decorativos vazios.

4. **Funciona em projetor e em monitor solo.** Texto base nunca abaixo de 14px; deltas e estados não dependem só de cor; cinza muito fraco está banido. AA é piso, legibilidade em sala de reunião projetada é a régua real.

5. **Cor é instrumento, não decoração.** Laranja Finture marca o que é ação ou estado relevante (ativo, foco, primário). Verde/vermelho só em variação positiva/negativa. Paleta earthy de chart é a opinião — não substituível por categóricas saturadas.

## Accessibility & Inclusion

- **WCAG 2.2 AA** como piso obrigatório (contraste 4.5:1 em texto corrido, 3:1 em UI/large text).
- **Adaptação para apresentação** — texto base 14–15px, números KPI ≥32px, contraste ≥7:1 nos elementos hero. O painel precisa sobreviver a um projetor amarelado em sala iluminada.
- **Navegação por teclado completa** — period selector, drill-down, sort de tabela, refresh. Foco visível em laranja Finture.
- **Não depender só de cor** — deltas usam ícone/seta + cor; estados de campanha (ativo/pausado/encerrado) usam glifo + label, não bolinha colorida sozinha.
- **prefers-reduced-motion respeitado** — gráficos e transições reduzem a fade simples; sem deslocamentos quando a flag está ativa.
- **Idioma pt-BR** em toda UI, formatos BRL/datas em locale brasileiro.
