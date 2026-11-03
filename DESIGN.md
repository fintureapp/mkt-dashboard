---
name: Marketing BI — Criteria × Finture
description: O caderno de campo do operador de mídia. Identidade Finture, dados Meta Ads, em modo de plantão.
colors:
  finture-sienna: "#ea622d"
  ink-black: "#1b1a1a"
  manuscript-cream: "#f8f1e7"
  soft-ink: "#232220"
  lifted-charcoal: "#2a2928"
  hairline-sepia: "#3a3938"
  warm-ash: "#b0a89c"
  alarm-rust: "#dc2626"
  peach-ribbon: "#f8b96b"
  atelier-teal: "#6fb1a1"
  olive-field: "#b7c68b"
  terracotta-rose: "#c26d74"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "'cv02','cv03','cv04','cv11','tnum'"
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
  metric:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.015em"
    fontFeature: "'tnum','zero'"
rounded:
  none: "0"
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  pill: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  hero: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.finture-sienna}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.finture-sienna}"
    textColor: "{colors.ink-black}"
  button-outline:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.manuscript-cream}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.875rem"
    height: "2rem"
  button-outline-hover:
    backgroundColor: "{colors.lifted-charcoal}"
    textColor: "{colors.manuscript-cream}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-ash}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  button-ghost-hover:
    backgroundColor: "{colors.lifted-charcoal}"
    textColor: "{colors.manuscript-cream}"
  card-base:
    backgroundColor: "{colors.soft-ink}"
    textColor: "{colors.manuscript-cream}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  card-kpi:
    backgroundColor: "{colors.soft-ink}"
    textColor: "{colors.manuscript-cream}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  card-kpi-hero:
    backgroundColor: "{colors.soft-ink}"
    textColor: "{colors.manuscript-cream}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  chip-delta-up:
    backgroundColor: "{colors.lifted-charcoal}"
    textColor: "{colors.olive-field}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  chip-delta-down:
    backgroundColor: "{colors.lifted-charcoal}"
    textColor: "{colors.terracotta-rose}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  chip-delta-flat:
    backgroundColor: "{colors.lifted-charcoal}"
    textColor: "{colors.warm-ash}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.warm-ash}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  nav-link-active:
    backgroundColor: "transparent"
    textColor: "{colors.manuscript-cream}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  table-cell:
    backgroundColor: "transparent"
    textColor: "{colors.manuscript-cream}"
    padding: "0.625rem 0.75rem"
  brand-mark:
    backgroundColor: "{colors.finture-sienna}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.sm}"
    size: "1.75rem"
---

# Design System: Marketing BI — Criteria × Finture

## 1. Overview

**Creative North Star: "The Operator's Notebook"**

Esse sistema é um caderno de campo do analista de mídia. O `Ink Black` (#1b1a1a) é a tinta. O `Manuscript Cream` (#f8f1e7) é o papel — virado de cabeça pra baixo, vira a cor do texto sobre a tinta. O `Finture Sienna` (#ea622d) é o marca-texto: usado raramente, sempre para sublinhar o que decide algo. As cores secundárias da paleta — peach, atelier teal, olive, dusty rose — são as canetas coloridas do operador, reservadas para gráficos onde categoria importa. Em todo o resto, o sistema é monocromático sobre o ink.

A energia é editorial no esqueleto e produto no detalhe: as margens, a escala tipográfica display (Space Grotesk) e o ritmo de seção vêm do mundo de revista; tabular-nums, sticky columns, deltas com seta e densidade real vêm do mundo de plantão. Nada brilha por brilhar. O laranja queima onde faz sentido — botão primário, foco, marca, barra principal do gráfico — e some no resto.

Esse sistema rejeita explicitamente: o cinza-azulado de **Looker Studio / Power BI**, a sombra Material elevada em tudo, o template hero-metric SaaS (gradiente + número gigante + +12% verde fluor), e o dashboard genérico shadcn (dark + accent azul + cards iguais). Se parecer com qualquer um desses, está errado.

**Key Characteristics:**
- Dark warm-brown como pele (não cinza-azulado)
- Paleta earthy de revista, não categórica saturada
- Space Grotesk display + IBM Plex Sans body + tabular-nums obrigatório nos números
- Flat por padrão; sombras só em popover/dropdown que precisam descolar
- Laranja Finture é instrumento (≤10% da tela), não decoração
- Densidade real de produto profissional, ritmo editorial entre seções

## 2. Colors: The Operator's Notebook Palette

A paleta é **earthy quente**: nenhum azul, nenhum verde-floresta, nenhum cinza neutro frio. Toda neutralidade é tingida em sépia. Toda cor é tirada de uma redoma de pigmento, não de uma roda HSL saturada.

### Primary
- **Finture Sienna** (`#ea622d`): cor da marca. Marca-texto do operador. Usar em ≤10% da tela: botão primário, anel de foco, marca "f" do header, barra principal do gráfico de tendência (investimento), e nada mais. Em projetor amarelado, ele segura. Nunca usar em texto corrido — só em UI ou dado-chave.

### Tertiary (paleta de chart, "as canetas coloridas")
- **Peach Ribbon** (`#f8b96b`): linha secundária do gráfico de tendência (conversões), tags categóricas suaves.
- **Atelier Teal** (`#6fb1a1`): séries categóricas em chart, indicadores de saudável quando categoria importa mais que sinal.
- **Olive Field** (`#b7c68b`): séries categóricas, **delta positivo** em pills (`+12%`).
- **Terracotta Rose** (`#c26d74`): séries categóricas, **delta negativo** em pills (`−8%`).

### Neutral (a tinta, o papel, e tudo entre eles)
- **Ink Black** (`#1b1a1a`): background base. A tinta da página.
- **Soft Ink** (`#232220`): superfície de card, pulled meio-tom acima do base. Diferença é deliberadamente sutil — você sente, não vê.
- **Lifted Charcoal** (`#2a2928`): popover, dropdown, hover de linha de tabela, fundo de chip. Mais um meio-tom acima.
- **Hairline Sepia** (`#3a3938`): borda, divisor, grade do chart. 1px sempre.
- **Warm Ash** (`#b0a89c`): texto secundário, label uppercase, ticks de eixo. Quente, nunca cinza azulado.
- **Manuscript Cream** (`#f8f1e7`): foreground, texto primário, números KPI. O papel virado pra cima.

### Semantic (estado, não decoração)
- **Olive Field** para ganho. **Terracotta Rose** para perda. **Alarm Rust** (`#dc2626`) para erro destrutivo (botão deletar, mensagem crítica) — único vermelho saturado tolerado, único momento em que a paleta quebra a regra earthy.

### Named Rules

**The 10% Rule.** Sienna ocupa no máximo 10% da área visível em qualquer tela. Se ultrapassar, alguma decisão de hierarquia está errada — não é a cor que está demais, é a hierarquia que está mal definida.

**The No-Cool-Gray Rule.** Nenhum cinza neutro frio. Todo neutro é sépia (chroma > 0). `#1b1a1a` ≠ `#000000`; `#3a3938` ≠ `#3a3a3a`. Se um neutro parecer "cinza chumbo", está errado — refazer em sépia.

**The Earthy Chart Rule.** Charts usam exclusivamente a paleta `chart-1..5` (sienna → peach → teal → olive → rose). Proibido categórico saturado (azul/roxo/verde-bandeira). Se o chart precisar de mais de 5 séries, a história está errada antes da cor.

## 3. Typography

**Display Font:** Space Grotesk (300/400/500/600/700) — com fallback para `system-ui, sans-serif`.
**Body Font:** IBM Plex Sans (300/400/500/600/700) — com fallback para `system-ui, sans-serif`. Features `cv02`, `cv03`, `cv04`, `cv11` ativas para diferenciar `1`, `l`, `I`, `0/O`. Em números, `tnum` (tabular) obrigatório.
**Mono Font:** `ui-monospace, "Cascadia Mono", "Segoe UI Mono"` — reservado para IDs de conta, datas em log e IDs de ad.

**Character:** A dupla é o coração editorial-mas-técnico. Space Grotesk traz uma personalidade arquitetônica em headers e métricas — geométrico, mas com letras de inquietação (o `R`, o `e`, o `g`). IBM Plex Sans é o tom de voz do operador: clinical, legível, com afinação para diferenciar caracteres ambíguos em telas de plantão. Juntas: o magazine na cabeçalho, a planilha no corpo.

### Hierarchy

- **Display** (Space Grotesk 600, 2rem / 32px, line-height 1.05, tracking -0.02em): título de página principal (`<h1>`). Aparece uma vez por tela. "Visão geral", "Campanhas".
- **Headline** (Space Grotesk 600, 1.5rem / 24px, line-height 1.15): seções grandes dentro da página, cabeçalho de modal. Raro.
- **Title** (Space Grotesk 600, 1.125rem / 18px, line-height 1.25): cabeçalho de seção (`<h2>`). "Tendência diária", "Top campanhas".
- **Metric** (Space Grotesk 600, 1.875rem / 30px, tabular-nums, tracking -0.015em): números KPI dentro do card. Tracking apertado para o número parecer pesado, denso.
- **Body** (IBM Plex Sans 400, 0.875rem / 14px, line-height 1.5): texto corrido, descrições, células de tabela. Limite máximo de linha 65–75ch quando for prosa real (em tabela, não aplica).
- **Label** (IBM Plex Sans 500, 0.75rem / 12px, tracking 0.06em, **uppercase**): rótulos de KPI, cabeçalhos de coluna, tags de status. Uppercase só aqui — em mais lugar, vira gritaria.

### Named Rules

**The Tabular Number Rule.** Todo número em UI usa `font-feature-settings: 'tnum'`. A classe `.tabular` (já em `globals.css`) é a forma curta. Sem isso, números de KPI se mexem entre estados e o leitor perde âncora visual.

**The Cap-Lock-Once Rule.** Uppercase aparece **apenas** no token `Label` (rótulos de 12px). Em qualquer outro tamanho, é proibido. Se um header parecer querer caixa-alta, troque por `Title` em weight 600.

**The 65ch Body Rule.** Texto corrido de prosa (descrições, tooltips longos, copy de erro) capa em `max-width: 65ch`. Em células de tabela e KPIs, não aplica — esses não são prosa.

## 4. Elevation

O sistema é **flat por padrão com camadas tonais**. Profundidade vem de empilhar tons quentes, não de sombra. A ordem do mais fundo ao mais alto:

1. `Ink Black` (`#1b1a1a`) — background base, página
2. `Soft Ink` (`#232220`) — cards, painéis, container de chart
3. `Lifted Charcoal` (`#2a2928`) — popover, dropdown, hover de linha, chip
4. `Hairline Sepia` (`#3a3938`) 1px — toda borda e divisor

Sombras existem em **um único caso**: floating UI que precisa descolar visualmente do fundo (popover do period selector, dropdown do calendar). Nunca em card. Nunca em botão. Nunca como decoração.

### Shadow Vocabulary

- **shadow-floating** (`box-shadow: 0 8px 24px -8px rgba(0,0,0,0.5), 0 2px 6px -2px rgba(0,0,0,0.4)`): aplicado em popover/dropdown/calendar quando flutuam sobre o conteúdo. Direção sempre para baixo, opacidade alta porque o fundo é escuro.

### Named Rules

**The Flat-Card Rule.** Cards nunca têm `box-shadow`. Profundidade de card vem **só** da diferença tonal (`bg-card` `#232220` sobre `bg-background` `#1b1a1a`) e da borda 1px `Hairline Sepia`. Quem adiciona sombra a card está pedindo Material/Bootstrap, não isso.

**The Single-Shadow Rule.** Existe **um** vocabulário de sombra (`shadow-floating`) e ele é usado **um caso**: popover/dropdown. Não criar segunda variação ("shadow-sm", "shadow-md"). Se um elemento precisa de outra sombra, está errado de início.

## 5. Components

### Buttons

- **Shape:** Cantos discretos `rounded-md` (8px). Nem quadrados, nem pílula. A intenção é "ferramenta polida", não "ferramenta brutalista" nem "ferramenta SaaS-friendly".
- **Primary** (`button-primary`): `bg: Finture Sienna #ea622d`, `text: Ink Black #1b1a1a` (laranja precisa fundo escuro embaixo do label para AAA), padding `0.5rem 1rem`, altura `2.25rem` (36px). Usado em **ações primárias raras** — submit de formulário crítico, "Atualizar dados". O botão `Atualizar` no header **não** usa primary, usa outline (não é ação destrutiva nem decisão).
- **Outline** (`button-outline`): `bg: transparent` sobre Ink Black, borda 1px `Hairline Sepia`, `text: Manuscript Cream`. Padding `0.5rem 0.875rem`, altura `2rem` (32px). Hover: `bg: Lifted Charcoal`. **Variante padrão para botões de ação no header e em controles** (period selector, refresh).
- **Ghost** (`button-ghost`): sem fundo, sem borda, `text: Warm Ash`. Hover: `bg: Lifted Charcoal`, `text: Manuscript Cream`. Usado em nav links e ações terciárias.
- **Focus:** anel `ring-2 ring-Finture-Sienna ring-offset-2 ring-offset-Ink-Black`. Visível, não tímido. Foco sempre laranja porque é o canal de comunicação para teclado.

### KPI Card (signature)

- **Shape:** `rounded-lg` (12px), borda 1px `Hairline Sepia`, `bg: Soft Ink #232220` (não `bg-card/60`, opacidade quebra contraste em projetor — usar a cor sólida).
- **Internal padding:** `1.25rem` (20px) padrão; `1.5rem` na variante hero.
- **Content order (top → bottom):**
  1. **Label** (uppercase, 12px, tracking 0.06em, `text: Warm Ash`)
  2. **Metric** (Space Grotesk 600, 30px no padrão / 48px na variante hero, tabular-nums, `text: Manuscript Cream`)
  3. **Delta pill + reference label** (12px, alinhados na mesma linha)
  4. **Hint** (12px italic, `text: Warm Ash 80%`) — opcional, só quando explicação é necessária
- **Variante Hero:** primeiros 2-3 KPIs (Investimento / CPL / ROAS) recebem variante hero — métrica em 48px, padding 1.5rem, ocupam 2 colunas no grid. Os outros 9 KPIs são padrão. Hierarquia explícita; não é grid uniforme.
- **States:** card não tem hover (não é interativo por si). Se vira link, ganhar `border-color: Finture Sienna` no hover.

### Delta Pill

- **Shape:** `rounded-sm` (4px), padding `0.125rem 0.375rem`, altura ~18px.
- **Up** (positivo): `bg: Lifted Charcoal`, `text: Olive Field #b7c68b`, ícone seta-cima 12px.
- **Down** (negativo): `bg: Lifted Charcoal`, `text: Terracotta Rose #c26d74`, ícone seta-baixo 12px.
- **Flat** (zero / sem comparação): `bg: Lifted Charcoal`, `text: Warm Ash`, ícone hífen.
- **Acessibilidade obrigatória:** pill nunca depende só da cor; **sempre tem ícone**. Em projetor amarelado, o olive vira mostarda — o ícone seta-cima salva a leitura.

### Cards / Containers (genéricos não-KPI)

- **Corner Style:** `rounded-lg` (12px) padrão. `rounded-xl` (16px) só para containers de página inteira (ex: o `<main>` interno em mobile).
- **Background:** `Soft Ink #232220` em containers genéricos. Nunca `bg-card/40` ou `/60` — aquela opacidade meia-vida é resíduo de shadcn template; substituir por cor sólida.
- **Border:** 1px `Hairline Sepia`, sempre.
- **Internal Padding:** `1.5rem` (24px) padrão. `1rem` em containers densos (table wrapper). `2rem` em hero/feature.

### Inputs / Fields

- **Style:** sem campo de texto livre exposto no momento; o único input visual é o trigger do Period Selector (botão outline) e o calendário dentro do popover. Quando entrar input livre, usar: `bg: Ink Black`, borda 1px `Hairline Sepia`, `rounded-md`, padding `0.5rem 0.75rem`, font body, foco com `border-color: Finture Sienna` + `ring-Finture-Sienna/20`.

### Navigation

- **Top nav (header):** sticky, `bg: Ink Black/80 + backdrop-blur`, borda inferior 1px `Hairline Sepia`, altura `4rem` (64px).
- **Brand mark:** quadrado `1.75rem` × `1.75rem`, `rounded-sm`, `bg: Finture Sienna`, letra `f` em Space Grotesk 700, `text: Ink Black`. Único lugar onde o sienna ocupa um bloco — é a assinatura.
- **Nav link:** `text: Warm Ash`, hover/active: `text: Manuscript Cream`, padding `0.375rem 0.75rem`, font body 500 14px.
- **Active state:** sem fundo. Apenas mudança de cor de texto + sublinhado de 2px `Finture Sienna` 4px abaixo (offset). Nunca pílula colorida.

### Data Table (signature)

- **Wrapper:** `bg: Soft Ink`, borda 1px `Hairline Sepia`, `rounded-lg`, `overflow-x-auto`. Header de tabela e primeira coluna `sticky` com mesmo `bg: Soft Ink`.
- **Header row:** `text: Warm Ash`, label 12px uppercase tracking 0.06em, ícone de sort à direita.
- **Body row:** padding célula `0.625rem 0.75rem`, border-bottom 1px `Hairline Sepia`, hover `bg: Lifted Charcoal`. Última linha sem border-bottom.
- **Numbers:** `text-align: right`, `tabular-nums` obrigatório. Delta abaixo do número em 11px `Olive Field` (positivo) / `Terracotta Rose` (negativo).
- **Empty state:** `bg: Soft Ink`, padding `3rem`, texto centralizado em `Warm Ash` body 14px.

### Trend Chart (signature)

- **Container:** `bg: Soft Ink`, borda 1px `Hairline Sepia`, `rounded-lg`, padding `1rem`, altura `20rem` (320px).
- **Bars** (eixo esquerdo, investimento): cor `Finture Sienna #ea622d`, `radius: [4,4,0,0]` no topo.
- **Line** (eixo direito, conversões): cor `Peach Ribbon #f8b96b`, `strokeWidth: 2`, sem dots no estado de repouso, `activeDot r:4` em hover.
- **Grid:** `Hairline Sepia`, `strokeDasharray: 3 3`, somente linhas horizontais (`vertical={false}`).
- **Axis text:** `Warm Ash`, font 11px, sem `axisLine`, sem `tickLine`.
- **Tooltip:** `bg: Soft Ink`, borda 1px `Hairline Sepia`, `rounded-md`, font 12px, label da data em pt-BR.
- **Cursor on hover:** retângulo translúcido `Lifted Charcoal` com 50% alpha.

## 6. Do's and Don'ts

### Do:

- **Do** usar `Manuscript Cream #f8f1e7` para texto primário e números KPI. É o papel.
- **Do** usar `Finture Sienna #ea622d` em ≤10% de qualquer tela. É o marca-texto.
- **Do** usar `tabular-nums` (`font-feature-settings: 'tnum'`) em **todo número de UI**.
- **Do** usar `Soft Ink #232220` (cor sólida) em cards. Substituir todo `bg-card/40` ou `/60` herdado de shadcn por cor sólida.
- **Do** combinar ícone + cor em deltas. Nunca depender só de verde/vermelho.
- **Do** usar Space Grotesk em headers e métricas. IBM Plex Sans em corpo. Nada mais.
- **Do** dar variação de tamanho aos KPIs: 2-3 em hero (Investimento, CPL, ROAS), o resto em tamanho padrão. Hierarquia explícita.
- **Do** usar `Olive Field` para delta positivo, `Terracotta Rose` para delta negativo, `Warm Ash` para flat.
- **Do** usar borda 1px `Hairline Sepia` para definir superfície. É o único divisor permitido.
- **Do** respeitar `prefers-reduced-motion`: trocar transições por fade simples.

### Don't:

- **Don't** usar gradientes em backgrounds, em texto, em cards. Nenhum gradiente. Nunca.
- **Don't** usar `background-clip: text` com gradiente. Texto é sólido.
- **Don't** usar `box-shadow` em cards ou botões. Profundidade vem de tom + borda. Sombra só em popover/dropdown.
- **Don't** criar grid de KPIs uniforme 4×3 com todos do mesmo tamanho. Isso é exatamente o **identical card grid** banido. KPIs principais ganham hero; secundários, padrão.
- **Don't** usar paleta categórica saturada em chart (azul/roxo/verde-bandeira). Só `chart-1..5` da paleta earthy.
- **Don't** parecer **Looker Studio / Power BI corporativo** — caixinhas brancas com sombra, filtros genéricos no topo, paleta saturada zero personalidade. Foi explicitamente rejeitado em PRODUCT.md.
- **Don't** parecer **Material/Bootstrap padrão** — sombra elevada, cantos arredondados sem intenção, paleta Material. Também rejeitado.
- **Don't** parecer **template hero-metric SaaS** — número gigante + label miúdo + gradiente + +12% verde fluor. Clichê de PRODUCT.md.
- **Don't** parecer **dashboard genérico shadcn** — dark + neutro cinza azulado + accent azul + cards uniformes. O motivo de existir esse painel é não ser isso.
- **Don't** usar `border-left` ou `border-right` > 1px como acento colorido em cards/alertas. Banido.
- **Don't** usar `#000000` ou `#ffffff` cru. Sempre tingido em sépia.
- **Don't** usar uppercase fora do token `Label` 12px. Header em CAIXA-ALTA é gritaria.
- **Don't** usar cinza azulado neutro (Tailwind `slate`, `zinc`, `gray`). Todo neutro tem chroma > 0 puxando para sépia.
- **Don't** usar em-dash. Em copy: vírgula, dois-pontos, ponto. Em ranges numéricos: en-dash `–`, não `--`.
- **Don't** animar propriedades de layout (`width`, `height`, `top`, `left`, `padding`). Só `transform` e `opacity`.
- **Don't** usar bounce/elastic nas transições. Easing exponencial out (quart/quint).
