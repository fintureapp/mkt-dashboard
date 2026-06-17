# Design System: Marketing BI — Criteria × Finture

> Documento de identidade visual ("The Operator's Notebook"). O arquivo original
> trazia um bloco de tokens em frontmatter YAML; o conteúdo normativo abaixo é a
> referência de design do projeto. Os tokens efetivos vivem em
> `src/app/globals.css`.

## 1. Overview

**Creative North Star: "The Operator's Notebook"**

Esse sistema é um caderno de campo do analista de mídia. O `Ink Black` (#1b1a1a) é a tinta. O `Manuscript Cream` (#f8f1e7) é o papel. O `Finture Sienna` (#ea622d) é o marca-texto: usado raramente, sempre para sublinhar o que decide algo. As cores secundárias da paleta — peach, atelier teal, olive, dusty rose — são as canetas coloridas do operador, reservadas para gráficos onde categoria importa. Em todo o resto, o sistema é monocromático sobre o ink.

Esse sistema rejeita explicitamente: o cinza-azulado de **Looker Studio / Power BI**, a sombra Material elevada em tudo, o template hero-metric SaaS, e o dashboard genérico shadcn.

**Key Characteristics:**
- Dark warm-brown como pele (não cinza-azulado)
- Paleta earthy de revista, não categórica saturada
- Space Grotesk display + IBM Plex Sans body + tabular-nums obrigatório nos números
- Flat por padrão; sombras só em popover/dropdown que precisam descolar
- Laranja Finture é instrumento (≤10% da tela), não decoração
- Densidade real de produto profissional, ritmo editorial entre seções

## 2. Colors: The Operator's Notebook Palette

### Primary
- **Finture Sienna** (`#ea622d`): cor da marca. Usar em ≤10% da tela.

### Tertiary (paleta de chart)
- **Peach Ribbon** (`#f8b96b`), **Atelier Teal** (`#6fb1a1`), **Olive Field** (`#b7c68b`, delta positivo), **Terracotta Rose** (`#c26d74`, delta negativo).

### Neutral
- **Ink Black** (`#1b1a1a`), **Soft Ink** (`#232220`), **Lifted Charcoal** (`#2a2928`), **Hairline Sepia** (`#3a3938`), **Warm Ash** (`#b0a89c`), **Manuscript Cream** (`#f8f1e7`).

### Semantic
- **Olive Field** para ganho, **Terracotta Rose** para perda, **Alarm Rust** (`#dc2626`) para erro destrutivo.

### Named Rules
- **The 10% Rule:** Sienna ocupa no máximo 10% da área visível.
- **The No-Cool-Gray Rule:** nenhum cinza neutro frio; todo neutro é sépia.
- **The Earthy Chart Rule:** charts usam exclusivamente `chart-1..5`.

## 3. Typography

- **Display:** Space Grotesk (fallback `system-ui, sans-serif`).
- **Body:** IBM Plex Sans (features cv02/cv03/cv04/cv11; `tnum` obrigatório em números).
- **Mono:** `ui-monospace, "Cascadia Mono", "Segoe UI Mono"`.

Hierarquia: Display (32px), Headline (24px), Title (18px), Metric (30px tabular), Body (14px), Label (12px uppercase tracking 0.06em).

## 4. Elevation

Flat por padrão com camadas tonais (Ink → Soft Ink → Lifted Charcoal → Hairline Sepia 1px). Sombra (`shadow-floating`) só em popover/dropdown. Cards nunca têm `box-shadow`.

## 5. Components

Botões `rounded-md`; primary sienna sobre texto ink; outline é o padrão de ação; ghost para nav. KPI Card `rounded-lg`, label uppercase + metric tabular + delta pill (sempre com ícone). Data Table com sticky header/coluna, números à direita tabular. Trend Chart: barras sienna (investimento) + linha peach (conversões), grid só horizontal.

## 6. Do's and Don'ts

**Do:** Cream em texto; Sienna ≤10%; tabular-nums em todo número; Soft Ink sólido em cards; ícone + cor em deltas; respeitar `prefers-reduced-motion`.

**Don't:** gradientes; `box-shadow` em cards/botões; grid uniforme de KPIs; paleta categórica saturada; parecer Looker/Material/SaaS/shadcn genérico; `#000`/`#fff` cru; uppercase fora do Label; cinza azulado; em-dash; animar layout; bounce/elastic.
