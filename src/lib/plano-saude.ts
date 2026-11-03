import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Period } from '@/lib/period';

/**
 * Dados do funil "Plano de Saúde" (Criteria PME) coletados do CRM Kanban
 * (kanban.nicotech.com.br) por um coletor externo, que grava um snapshot JSON.
 * O dashboard apenas LÊ o snapshot — não acessa o CRM diretamente.
 *
 * Origem do snapshot:
 * - Produção: URL em PLANO_SAUDE_SNAPSHOT_URL (ex.: Vercel Blob).
 * - Dev/local: arquivo `plano-saude-snapshot.json` na raiz do projeto.
 */

export type PlanoBucket = 'cotacoes' | 'negociacao' | 'quentes' | 'fechamento';

export type PlanoCard = {
  /** Métrica do card SEGUNDO O COLETOR. Mantido só como reserva para snapshots
   *  antigos: quem manda hoje é `bucketOfStage(card.stage)`, calculado aqui, para
   *  que uma coluna criada ou renomeada no CRM mude de métrica sem exigir um
   *  deploy do coletor. null = estágio sem métrica (Leads Frios, Validação...). */
  bucket: PlanoBucket | null;
  stage: string;
  convId: number;
  name: string;
  value: number;
  /** ISO — última movimentação do card no CRM (updated_at da conversa). Recorta o Relatório. */
  eventDate: string;
  /** ISO — entrada do lead no CRM (created_at da conversa). Recorta o funil e o Kanban.
   *  Ausente nos snapshots gravados antes de 31/08/2026 — daí o fallback p/ eventDate. */
  createdDate?: string;
  hasValue: boolean;
  /** origem do valor: 'campo' (Valor da cotação estruturado) ou 'tarefa' (texto livre, legado) */
  source?: string;
  tasks?: string[];
};

export type PlanoSnapshot = {
  generatedAt: string;
  funnel: string;
  stageCounts: Record<string, number>;
  note?: string;
  relatorioAllTime?: Record<string, number>;
  cards: PlanoCard[];
};

export type BucketAgg = { count: number; value: number };
export type Relatorio = {
  cotacoes: BucketAgg;
  negociacao: BucketAgg;
  quentes: BucketAgg;
  fechamento: BucketAgg;
};

export async function loadSnapshot(): Promise<PlanoSnapshot | null> {
  const url = process.env.PLANO_SAUDE_SNAPSHOT_URL;
  try {
    if (url) {
      // O Blob é servido pela CDN da Vercel com `s-maxage=300`, então `no-store`
      // sozinho ainda entrega até 5 min de atraso: o Next não guarda a resposta,
      // mas a borda guarda. O carimbo por minuto muda a URL e força a revalidação,
      // deixando o dashboard no ritmo do coletor em vez do ritmo da CDN.
      const bust = Math.floor(Date.now() / 60_000);
      const fresh = `${url}${url.includes('?') ? '&' : '?'}t=${bust}`;
      const res = await fetch(fresh, { cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as PlanoSnapshot;
    }
    const file = path.join(process.cwd(), 'plano-saude-snapshot.json');
    return JSON.parse(await readFile(file, 'utf8')) as PlanoSnapshot;
  } catch {
    return null;
  }
}

/**
 * Diferente da Meta (que exclui o dia corrente porque as métricas assentam),
 * dados de CRM são em tempo real: se a janela alcança o presente, inclui HOJE
 * (em horário de Brasília). Janelas históricas explícitas ficam intactas.
 */
export function effectiveCRMPeriod(parsed: Period): Period {
  const todayBR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const d = new Date(`${todayBR}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 2);
  const cutoff = d.toISOString().slice(0, 10);
  return parsed.until >= cutoff ? { since: parsed.since, until: todayBR } : parsed;
}

function inPeriod(eventDate: string, period: Period): boolean {
  const d = (eventDate || '').slice(0, 10);
  return d >= period.since && d <= period.until;
}

/**
 * Último recurso de ordenação: nomes de estágio conhecidos, do topo ao fundo.
 * A ordem do quadro é a de `DISPLAY_STAGE_ORDER`; esta lista só desempata um
 * estágio que nem o dashboard reconhece nem o snapshot listou em `stageCounts`
 * (snapshot antigo, ou card parado num estágio já removido do funil).
 */
const STAGE_ORDER = [
  'Novos Leads',
  'Leads Frios - Segunda Validação',
  'Validação de Dados',
  'Necessita Atendimento',
  'Enviado para Cotação',
  'Atendimento Humano / Em Cotação',
  'Em Cotação / Atendimento Humano', // nome legado do mesmo estágio
  'Negociação',
  'Fechado - Ganho',
  'Boleto pago',
  'Fechado - Perdido',
] as const;

function stageRank(stage: string): number {
  const i = (STAGE_ORDER as readonly string[]).indexOf(stage);
  return i === -1 ? STAGE_ORDER.length : i;
}

/**
 * Ordem em que as colunas aparecem no quadro Kanban DO DASHBOARD — definida
 * pelo usuário em 11/09/2026, e só aqui: o CRM continua com a ordem dele, esta
 * lista não volta para o Chatwoot/salesapp.
 *
 * Cada etapa casa por palavra-chave, não por nome exato, para sobreviver a um
 * rename da coluna no CRM (foi assim que "Em Cotação / Atendimento Humano"
 * virou "Atendimento Humano / Em Cotação" sem quebrar as métricas). Os testes
 * rodam NESTA ordem, então uma etapa mais específica precisa vir antes da mais
 * genérica: "Leads Frios - Segunda Validação" casa antes de "Validação de
 * Dados", e "Negociação" exclui explicitamente "Negociações quentes", que é a
 * única exceção — ela aparece DEPOIS, apesar de a palavra casar antes.
 *
 * Uma coluna que o CRM tenha e esta lista não conheça vai para o fim do quadro,
 * na ordem em que o CRM a devolveu — ninguém fica invisível por ser nova.
 */
const DISPLAY_STAGE_ORDER: ReadonlyArray<{ label: string; test: (s: string) => boolean }> = [
  { label: 'Novos Leads', test: (s) => s.includes('novo') },
  { label: 'Leads Frios', test: (s) => s.includes('frio') },
  { label: 'Validação de Dados', test: (s) => s.includes('valida') },
  { label: 'Necessita Atendimento', test: (s) => s.includes('necessita') },
  { label: 'Enviado para Cotação', test: (s) => s.includes('enviado') },
  {
    label: 'Atendimento Humano / Em Cotação',
    test: (s) => s.includes('atendimento') || s.includes('cota'),
  },
  { label: 'Negociação', test: (s) => s.includes('negocia') && !s.includes('quent') },
  { label: 'Negociações quentes', test: (s) => s.includes('quent') },
  { label: 'Boleto pago', test: (s) => s.includes('boleto') || s.includes('pago') },
  { label: 'Fechado - Ganho', test: (s) => s.includes('ganho') },
  { label: 'Fechado - Perdido', test: (s) => s.includes('perdido') },
];

/** Posição da coluna no quadro; `DISPLAY_STAGE_ORDER.length` = estágio desconhecido. */
function displayStageRank(stage: string): number {
  const s = (stage || '').toLowerCase();
  const i = DISPLAY_STAGE_ORDER.findIndex((e) => e.test(s));
  return i === -1 ? DISPLAY_STAGE_ORDER.length : i;
}

export type KanbanColumn = {
  stage: string;
  /** bucket predominante do estágio (para a cor); null se não houver cards */
  bucket: PlanoBucket | null;
  count: number;
  value: number;
  cards: PlanoCard[];
};

/**
 * Data que recorta funil e Kanban: a ENTRADA do lead no CRM. Filtrar pela última
 * movimentação inflava a conversão do funil — lead parado sai da janela e só o
 * ativo permanece, então "entraram em conversas" batia quase 100% do total.
 * Snapshots antigos (sem createdDate) caem no eventDate para não zerar a tela.
 */
export function entryDate(card: PlanoCard): string {
  return card.createdDate || card.eventDate;
}

/** Cards que entraram no CRM dentro da janela. */
export function cardsInPeriod(cards: PlanoCard[], period: Period): PlanoCard[] {
  return cards.filter((c) => inPeriod(entryDate(c), period));
}

/** Cards sem data resolvida no CRM — ficam fora de qualquer recorte de período. */
export function countUndated(cards: PlanoCard[]): number {
  return cards.reduce((n, c) => n + (entryDate(c) ? 0 : 1), 0);
}

function countByStage(cards: PlanoCard[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of cards) counts[c.stage] = (counts[c.stage] || 0) + 1;
  return counts;
}

/**
 * Agrupa os cards do snapshot por estágio do CRM para a visualização Kanban.
 * Diferente de `aggregate` (que alimenta o funil de valor e só conta cotações
 * com valor informado), o quadro traz 100% das colunas e dos cards que o
 * coletor exportou.
 *
 * Com `period`, o quadro passa a mostrar só os cards que entraram no CRM na
 * janela (`entryDate`), acompanhando o seletor do dashboard.
 * As COLUNAS continuam vindo do board inteiro — um estágio sem card no período
 * aparece vazio em vez de sumir, para o quadro não mudar de forma a cada
 * troca de janela. Cards sem data resolvida (`countUndated`) ficam de fora.
 * A ordem em que elas aparecem é a do dashboard (`DISPLAY_STAGE_ORDER`), que
 * difere de propósito da ordem do CRM.
 */
export function groupByStage(
  cards: PlanoCard[],
  period?: Period,
  /**
   * Estágios do CRM na ordem do board (as chaves de `snapshot.stageCounts`).
   * É o que faz uma coluna RECÉM-CRIADA, ainda sem nenhum card, aparecer no
   * quadro — se as colunas viessem só dos cards, ela seria invisível até
   * alguém arrastar o primeiro lead para lá.
   */
  stageOrder?: readonly string[],
): KanbanColumn[] {
  const byStage = new Map<string, PlanoCard[]>();
  for (const stage of stageOrder ?? []) byStage.set(stage, []);
  for (const c of cards) if (!byStage.has(c.stage)) byStage.set(c.stage, []);
  for (const c of period ? cardsInPeriod(cards, period) : cards) {
    byStage.get(c.stage)?.push(c);
  }

  // Quem manda na ordem é o DASHBOARD (`DISPLAY_STAGE_ORDER`), não o CRM: o
  // time pediu uma leitura de funil diferente da que o board do CRM mostra.
  // A ordem do CRM (`stageOrder`) só desempata as colunas que o dashboard não
  // conhece, e o STAGE_ORDER fixo cobre o que nem o snapshot listou (snapshot
  // antigo, ou card num estágio já removido do funil).
  const crmRank = new Map((stageOrder ?? []).map((s, i) => [s, i]));
  const rank = (stage: string) => {
    const display = displayStageRank(stage);
    if (display < DISPLAY_STAGE_ORDER.length) return display;
    const fallback = crmRank.has(stage)
      ? (crmRank.get(stage) as number)
      : crmRank.size + stageRank(stage);
    return DISPLAY_STAGE_ORDER.length + fallback;
  };

  // A cor da coluna sai do NOME do estágio, não dos cards que ele contém: uma
  // coluna vazia (por filtro de período ou recém-criada no CRM) mantém a
  // identidade visual da etapa a que pertence em vez de cair no cinza de topo.
  const columnBucket = new Map<string, PlanoBucket | null>();
  for (const stage of byStage.keys()) columnBucket.set(stage, bucketOfStage(stage));

  const columns: KanbanColumn[] = [];
  for (const [stage, list] of byStage) {
    list.sort(
      (a, b) =>
        (b.value || 0) - (a.value || 0) || (b.eventDate || '').localeCompare(a.eventDate || ''),
    );
    columns.push({
      stage,
      bucket: columnBucket.get(stage) ?? null,
      count: list.length,
      value: list.reduce((sum, c) => sum + (c.value || 0), 0),
      cards: list,
    });
  }

  columns.sort((a, b) => rank(a.stage) - rank(b.stage) || a.stage.localeCompare(b.stage));
  return columns;
}

/**
 * Regra de negócio (Plano de Saúde): o volume fechado que retorna para a operação
 * é 3× o valor que "cai" no card. Multiplicamos só o VALOR do fechamento para
 * refletir esse volume real na visão do funil — a contagem permanece intacta.
 * Aplica-se apenas ao relatório do funil (card "Fechado" e Funil de valor); o
 * quadro Kanban continua exibindo os valores reais por card.
 */
const FECHAMENTO_VALUE_FACTOR = 3;

const emptyRelatorio = (): Relatorio => ({
  cotacoes: { count: 0, value: 0 },
  negociacao: { count: 0, value: 0 },
  quentes: { count: 0, value: 0 },
  fechamento: { count: 0, value: 0 },
});

/**
 * Métrica do card. Vale o ESTÁGIO em que ele está agora (`bucketOfStage`); o
 * `bucket` gravado pelo coletor só entra como reserva para snapshots antigos,
 * de antes de "Negociações quentes" existir.
 */
function cardBucket(card: PlanoCard): PlanoBucket | null {
  return card.stage ? bucketOfStage(card.stage) : (card.bucket ?? null);
}

/** Cotação só conta quando o valor foi informado no card; as demais etapas contam por estágio. */
function countsInMetric(bucket: PlanoBucket, value: number): boolean {
  return bucket !== 'cotacoes' || value > 0;
}

/**
 * FOTO do funil de valor: o que está PARADO em cada coluna do Kanban agora,
 * sem recorte de período.
 *
 * É o que a aba Visão Geral mostra, e é deliberado. O valor de uma proposta é um
 * ESTOQUE (quanto há em jogo hoje), não um evento datado: arrastar um card entre
 * colunas ou digitar o "Valor da cotação" não mexe na conversa do Chatwoot, de
 * onde vêm as datas — então qualquer recorte por período deixaria a tela cega
 * justamente para as mudanças que o time acabou de fazer no CRM. Sem recorte, o
 * número da tela é o número da coluna, sempre.
 *
 * Para métricas de FLUXO (quanto fechou dentro da janela), use `aggregate`.
 */
export function boardTotals(cards: PlanoCard[]): Relatorio {
  const r = emptyRelatorio();
  for (const c of cards) {
    const bucket = cardBucket(c);
    if (!bucket) continue; // topo do funil, Fechado - Ganho e Perdido: só no quadro
    const value = c.value || 0;
    if (!countsInMetric(bucket, value)) continue;
    r[bucket].count += 1;
    r[bucket].value += value;
  }
  r.fechamento.value *= FECHAMENTO_VALUE_FACTOR;
  return r;
}

/**
 * FLUXO: o mesmo funil de valor recortado pela janela, pela última movimentação
 * do lead (`eventDate`). Alimenta o "Volume" da home, que se compara ao
 * investimento de mídia do mesmo período e por isso precisa ser datado.
 */
export function aggregate(cards: PlanoCard[], period: Period): Relatorio {
  const r = emptyRelatorio();
  for (const c of cards) {
    if (!inPeriod(c.eventDate, period)) continue;
    const bucket = cardBucket(c);
    if (!bucket) continue; // estágio sem métrica (só quadro Kanban)
    const value = c.value || 0;
    if (!countsInMetric(bucket, value)) continue;
    r[bucket].count += 1;
    r[bucket].value += value;
  }
  r.fechamento.value *= FECHAMENTO_VALUE_FACTOR;
  return r;
}

/**
 * Funil comercial de 4 etapas para a visão executiva, derivado de `stageCounts`
 * (a foto atual do CRM — contagem real por estágio, não o subconjunto de cards
 * detalhados). Cada etapa é o total de leads que **alcançaram aquele estágio ou
 * além** (incluindo quem depois foi perdido, pois passou pela etapa):
 *
 * - Total de leads      = todos os estágios
 * - Entraram em conversas = de "Necessita Atendimento" em diante (houve atendimento humano)
 * - Cotações enviadas   = de "Enviado para Cotação" em diante (inclui "Atendimento Humano / Em Cotação")
 * - Fechado ganho        = "Fechado - Ganho" + "Boleto pago"
 *
 * O casamento de estágio é por palavra-chave (`stageKind`), não por nome exato:
 * o CRM já renomeou colunas e nomes fixos silenciam etapas inteiras.
 *
 * `qualificados` (lead que respondeu e entrou em negociação) alimenta o custo por
 * lead qualificado.
 *
 * Com `period`, o funil deixa de ser a foto acumulada do CRM e passa a contar só
 * os leads que ENTRARAM na janela (`entryDate`) e o estágio em que estão hoje —
 * assim funil e mídia falam do mesmo intervalo e a conversão é a daquela safra.
 * Sem `period`, mantém a foto completa via `stageCounts`.
 */
export type HealthFunnel = {
  total: number;
  conversas: number;
  cotacoes: number;
  ganho: number;
  qualificados: number;
  /** Volume provisionado: R$ dos cards em Fechado-Ganho + Boleto pago (regra ×3 aplicada). */
  ganhoValor: number;
};

const GANHO_STAGES = new Set(['Fechado - Ganho', 'Boleto pago']);

/**
 * Classifica o estágio por palavra-chave em vez de nome exato. O CRM renomeia
 * colunas (ex.: "Em Cotação / Atendimento Humano" virou "Atendimento Humano /
 * Em Cotação"), e uma lista de nomes exatos deixa a coluna inteira fora do
 * funil silenciosamente. A ordem dos testes importa: "Atendimento Humano / Em
 * Cotação" é COTAÇÃO, não atendimento.
 */
type StageKind =
  | 'topo'
  | 'atendimento'
  | 'cotacao'
  | 'negociacao'
  | 'quente'
  | 'ganho'
  | 'pago'
  | 'perdido';

/**
 * Classifica o estágio por palavra-chave em vez de nome exato — o CRM renomeia
 * colunas e uma lista de nomes fixos silencia etapas inteiras sem avisar.
 *
 * A ORDEM dos testes é a regra de negócio:
 * - "Fechado - Perdido" antes de tudo (contém "fechado", mas não é ganho);
 * - "Negociações quentes" é `quente`, NÃO `negociacao`: a coluna dedicada que o
 *   time criou para as propostas de fato quentes tem métrica própria, e o teste
 *   de "quent" precisa vir antes do de "negocia" porque o nome casa com os dois;
 * - "Atendimento Humano / Em Cotação" é `cotacao`, não `atendimento`.
 */
function stageKind(stage: string): StageKind {
  const s = (stage || '').toLowerCase();
  if (s.includes('perdido')) return 'perdido';
  if (s.includes('boleto')) return 'pago';
  if (s.includes('fechado') && s.includes('ganho')) return 'ganho';
  if (s.includes('quent')) return 'quente';
  if (s.includes('negocia')) return 'negociacao';
  if (s.includes('cota')) return 'cotacao';
  if (s.includes('atendimento')) return 'atendimento';
  return 'topo'; // Novos Leads, Leads Frios, Validação de Dados
}

/**
 * Métrica do funil de valor a que o estágio pertence — a ÚNICA fonte de verdade
 * do mapeamento coluna → métrica no dashboard.
 *
 * Fica aqui, e não no coletor, de propósito: o coletor também grava um `bucket`
 * em cada card, mas ele só é revisto quando alguém faz deploy do coletor. Lendo
 * do nome do estágio, uma coluna criada ou renomeada no CRM entra na métrica
 * certa já na coleta seguinte.
 *
 * "Propostas quentes" = a coluna "Negociações quentes" do Kanban, e só ela.
 * "Negociação" (a coluna larga, onde o lead fica enquanto a proposta amadurece)
 * virou uma etapa própria — antes as duas somavam e o número de quentes ficava
 * inflado pelo estoque parado.
 */
export function bucketOfStage(stage: string): PlanoBucket | null {
  switch (stageKind(stage)) {
    case 'cotacao':
      return 'cotacoes';
    case 'negociacao':
      return 'negociacao';
    case 'quente':
      return 'quentes';
    case 'pago':
      return 'fechamento';
    default:
      return null; // topo do funil, Fechado - Ganho e Fechado - Perdido
  }
}

/** Etapas cumulativas: quem está aqui já passou pela etapa anterior (perdidos incluídos). */
const CONVERSA_KINDS = new Set<StageKind>([
  'atendimento',
  'cotacao',
  'negociacao',
  'quente',
  'ganho',
  'pago',
  'perdido',
]);
const COTACAO_KINDS = new Set<StageKind>([
  'cotacao',
  'negociacao',
  'quente',
  'ganho',
  'pago',
  'perdido',
]);
const QUALIFICADO_KINDS = new Set<StageKind>(['negociacao', 'quente', 'ganho', 'pago']);

/**
 * Estágio de negócio ganho: "Fechado - Ganho" (documentação aprovada) e
 * "Boleto pago" (pagamento entrou). Os dois entram na contagem E no volume
 * provisionado. O match por palavra-chave sobrevive a renomeações no CRM.
 */
function isGanhoStage(stage: string): boolean {
  if (GANHO_STAGES.has(stage)) return true;
  const kind = stageKind(stage);
  return kind === 'ganho' || kind === 'pago';
}

export function healthFunnel(snapshot: PlanoSnapshot, period?: Period): HealthFunnel {
  // No recorte por período o stageCounts (contagem acumulada do board) não serve:
  // as contagens saem dos próprios cards filtrados pela janela.
  const cards = period ? cardsInPeriod(snapshot.cards, period) : snapshot.cards;
  const stageCounts = period ? countByStage(cards) : snapshot.stageCounts;

  let total = 0;
  let conversas = 0;
  let cotacoes = 0;
  let ganho = 0;
  let qualificados = 0;
  for (const [stage, n] of Object.entries(stageCounts)) {
    const c = n || 0;
    const kind = stageKind(stage);
    total += c;
    if (CONVERSA_KINDS.has(kind)) conversas += c;
    if (COTACAO_KINDS.has(kind)) cotacoes += c;
    if (kind === 'ganho' || kind === 'pago') ganho += c;
    if (QUALIFICADO_KINDS.has(kind)) qualificados += c;
  }
  // Valor provisionado vem dos cards detalhados (o stageCounts só traz contagens).
  // Soma por ESTÁGIO ganho, não por bucket: "Fechado - Ganho" tem bucket null no
  // coletor (fora da métrica "Fechamento", que é só pagamento confirmado), mas o
  // volume provisionado inclui os dois — a mesma base da contagem "Fechado ganho".
  // Sobre esse total aplica-se a regra ×3 do funil.
  let ganhoValor = 0;
  for (const card of cards) {
    if (isGanhoStage(card.stage)) ganhoValor += card.value || 0;
  }
  ganhoValor *= FECHAMENTO_VALUE_FACTOR;
  return { total, conversas, cotacoes, ganho, qualificados, ganhoValor };
}

// ---------------------------------------------------------------------------
// Painel do CEO
// ---------------------------------------------------------------------------

/**
 * As 6 etapas do funil de saúde que o CEO lê, agrupando as colunas do CRM.
 * O agrupamento sai de `stageKind` (palavra-chave), então sobrevive a renomes
 * de coluna no Kanban. "Fechado - Perdido" não é etapa: vira indicador à parte.
 */
export type CeoStageKey = 'novos' | 'frios' | 'atendimento' | 'cotacao' | 'negociacao' | 'vendas';

export const CEO_STAGES: ReadonlyArray<{ key: CeoStageKey; label: string }> = [
  { key: 'novos', label: 'Novos leads' },
  { key: 'frios', label: 'Leads frios' },
  { key: 'atendimento', label: 'Em atendimento' },
  { key: 'cotacao', label: 'Em cotação' },
  { key: 'negociacao', label: 'Em negociação' },
  { key: 'vendas', label: 'Vendas' },
];

export function ceoStageOf(stage: string): CeoStageKey | 'perdidos' {
  switch (stageKind(stage)) {
    case 'perdido':
      return 'perdidos';
    case 'ganho':
    case 'pago':
      return 'vendas';
    case 'negociacao':
    case 'quente':
      return 'negociacao';
    case 'cotacao':
      return 'cotacao';
    case 'atendimento':
      return 'atendimento';
    default:
      return (stage || '').toLowerCase().includes('frio') ? 'frios' : 'novos';
  }
}

export function ceoStageLabel(stage: string): string {
  const key = ceoStageOf(stage);
  if (key === 'perdidos') return 'Perdido';
  return CEO_STAGES.find((s) => s.key === key)?.label ?? stage;
}

export type CeoStage = {
  key: CeoStageKey;
  label: string;
  count: number;
  /** R$ somado dos cards da etapa. Em Vendas, já com a regra ×3. */
  value: number;
  /** Fração (0–1) sobre o total de leads do recorte. */
  share: number;
};

export type CeoSummary = {
  total: number;
  stages: CeoStage[];
  perdidos: { count: number; share: number };
  /** Leads ainda abertos: tudo que não é venda nem perdido. */
  emAndamento: number;
  vendas: number;
  /** R$ das vendas (regra ×3 aplicada). */
  vendasValor: number;
  /** R$ em jogo agora: cotação + negociação (inclui quentes). */
  volumeNegociacao: number;
  /** Quantos cards de cotação/negociação têm valor informado. */
  comValor: number;
  emNegociacao: number;
  /** vendas ÷ total (0–1); null sem leads. */
  conversao: number | null;
};

/**
 * Resumo do painel do CEO. Com `period`, considera só os leads que ENTRARAM no
 * CRM na janela (`entryDate`) e o estágio em que estão hoje, igual ao funil da
 * aba executiva. `null` = "Tudo": o board inteiro.
 */
export function ceoSummary(cards: PlanoCard[], period: Period | null): CeoSummary {
  const list = period ? cardsInPeriod(cards, period) : cards;
  const acc = new Map<CeoStageKey, { count: number; value: number }>(
    CEO_STAGES.map((s) => [s.key, { count: 0, value: 0 }]),
  );
  let perdidos = 0;
  let comValor = 0;
  for (const c of list) {
    const key = ceoStageOf(c.stage);
    if (key === 'perdidos') {
      perdidos += 1;
      continue;
    }
    const slot = acc.get(key) as { count: number; value: number };
    slot.count += 1;
    slot.value += c.value || 0;
    if ((key === 'cotacao' || key === 'negociacao') && (c.value || 0) > 0) comValor += 1;
  }
  const vendasSlot = acc.get('vendas') as { count: number; value: number };
  vendasSlot.value *= FECHAMENTO_VALUE_FACTOR;

  const total = list.length;
  const share = (n: number) => (total > 0 ? n / total : 0);
  const stages = CEO_STAGES.map(({ key, label }) => {
    const { count, value } = acc.get(key) as { count: number; value: number };
    return { key, label, count, value, share: share(count) };
  });
  const cotacao = acc.get('cotacao') as { count: number; value: number };
  const negociacao = acc.get('negociacao') as { count: number; value: number };
  const vendas = vendasSlot.count;
  return {
    total,
    stages,
    perdidos: { count: perdidos, share: share(perdidos) },
    emAndamento: total - vendas - perdidos,
    vendas,
    vendasValor: vendasSlot.value,
    volumeNegociacao: cotacao.value + negociacao.value,
    comValor,
    emNegociacao: cotacao.count + negociacao.count,
    conversao: total > 0 ? vendas / total : null,
  };
}

/**
 * Só o primeiro nome, para a tabela pública (sem login) não expor nome completo.
 * Nome vazio, sem letras, ou que pareça contato (telefone/e-mail) vira "Sem nome".
 */
export function firstName(name: string | null | undefined): string {
  const first = (name || '').trim().split(/\s+/)[0] ?? '';
  // Sem letra, ou com dígito/@ (telefone, "5511…@c.us", e-mail): não é nome, e
  // exibir isso vazaria contato numa página pública.
  if (!/\p{L}/u.test(first) || /[\d@]/.test(first)) return 'Sem nome';
  return first.charAt(0).toLocaleUpperCase('pt-BR') + first.slice(1).toLocaleLowerCase('pt-BR');
}

export type RecentMove = {
  firstName: string;
  stage: string;
  stageKey: CeoStageKey | 'perdidos';
  /** Valor real do card (sem a regra ×3, como no Kanban). */
  value: number;
  /** ISO da entrada do lead no CRM. */
  entrada: string;
  /** ISO da última movimentação. */
  ultima: string;
};

/**
 * Últimas movimentações do recorte, da mais recente para a mais antiga. Devolve
 * só campos não identificáveis (primeiro nome, etapa, valor, datas): nem nome
 * completo, nem id de conversa.
 */
export function recentMoves(cards: PlanoCard[], period: Period | null, n = 12): RecentMove[] {
  const list = period ? cardsInPeriod(cards, period) : cards;
  return [...list]
    .sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''))
    .slice(0, n)
    .map((c) => ({
      firstName: firstName(c.name),
      stage: ceoStageLabel(c.stage),
      stageKey: ceoStageOf(c.stage),
      value: c.value || 0,
      entrada: entryDate(c) || '',
      ultima: c.eventDate || '',
    }));
}

/** Data de entrada mais antiga do board (YYYY-MM-DD), para o "Tudo" da mídia. */
export function earliestEntry(cards: PlanoCard[]): string | null {
  let min: string | null = null;
  for (const c of cards) {
    const d = (entryDate(c) || '').slice(0, 10);
    if (d && (!min || d < min)) min = d;
  }
  return min;
}
