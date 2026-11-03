import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { type CreativeRow, fetchTopCreatives } from '@/lib/creatives';
import { fetchInsights } from '@/lib/meta-api';
import type { Period } from '@/lib/period';

/**
 * Dados da campanha de Consórcio. A fonte são três listas do SharePoint no site
 * `criteriaseguros2`, escritas pelo Power Automate da LP:
 *
 * - "Consorcio Simulacoes" — uma linha por simulação, com o dinheiro
 *   (valor_credito, parcela, prazo, lances). É a lista MESTRA.
 * - "Consorcio Leads"      — contato (nome/e-mail/telefone) + UTMs. Só existe
 *   desde 05/08/2026, então simulações anteriores ficam sem contato.
 * - "Consorcio Eventos"    — trilha (lead_criado, simulacao_solicitada, email_erro).
 *
 * O coletor (repo marketing-bi-collector-cloud, `collect-consorcio.js`) lê as três
 * via Microsoft Graph, cruza cada telefone com o Chatwoot para saber quem de fato
 * conversou no WhatsApp, monta o snapshot e publica no Vercel Blob. O dashboard só LÊ.
 *
 * Origem do snapshot:
 * - Produção: URL em CONSORCIO_SNAPSHOT_URL (Vercel Blob).
 * - Dev/local: arquivo `consorcio-snapshot.json` na raiz do projeto.
 */

/**
 * Situação do lead no WhatsApp, apurada pelo coletor contra o Chatwoot do
 * Consórcio (inbox 11, número +5511955025094 — instância separada da do Plano
 * de Saúde).
 *
 * O botão da LP abre um wa.me com a mensagem já pronta, então todo lead que
 * clica gera uma mensagem de entrada. Por isso separamos `engajou` (escreveu
 * algo além dessa frase) de `conversou` (só disparou a mensagem pronta).
 */
export type WhatsappStatus =
  | 'engajou'
  | 'conversou'
  | 'contatado'
  | 'sem_conversa'
  | 'nao_encontrado'
  | 'telefone_invalido'
  | 'sem_telefone'
  | 'desconhecido';

export type ConsorcioWhatsapp = {
  status: WhatsappStatus;
  contactId?: number;
  contactName?: string;
  conversationId?: number | null;
  /** Quantas mensagens o lead mandou. */
  mensagensDoLead?: number;
  /** Quantas dessas foram além da mensagem pronta do botão. */
  mensagensAlemDaPronta?: number;
  primeiraMensagemEm?: string | null;
  ultimaMensagemEm?: string | null;
  labels?: string[];
};

export type ConsorcioLead = {
  leadId: string;
  /** Id da simulação (coluna "Simulacao ID" da lista). */
  simulacaoId: string;
  /** ISO — momento da simulação, que é também a entrada do lead. */
  createdAt: string;

  /** Há linha na lista "Consorcio Leads"? Falso nas simulações antigas. */
  temContato: boolean;
  nome: string;
  email: string;
  telefone: string;

  /** Crédito simulado — é o que o time chama de volume provisionado. */
  credito: number;
  /** O lead mexeu no simulador, ou aceitou o valor que já vinha na tela? */
  creditoPersonalizado: boolean;
  parcela: number;
  prazo: number;
  lanceEmbutido: number;
  lanceLivre: number;
  lanceTotal: number;
  creditoLiquido: number;
  totalIntegralizar: number;
  tipo: string;

  emailStatus: string;
  emailEnviadoEm: string;

  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  origem: string;

  whatsapp: ConsorcioWhatsapp;

  /**
   * Colunas de controle manual, hoje na planilha do OneDrive do consultor e
   * ainda NÃO integradas ao snapshot. Ficam vazias até essa fonte entrar.
   */
  etapa: string;
  classificacao: string;
};

export type ConsorcioSnapshot = {
  generatedAt: string;
  leads: ConsorcioLead[];
  fonte?: string;
  contagens?: { simulacoes?: number; leads?: number; eventos?: number; comContato?: number };
  chatwoot?: { executado?: boolean; base?: string; conta?: string };
  note?: string;
};

/** Campanha e conta de anúncios do Consórcio (conta distinta da que o BI lê por padrão). */
const CONSORCIO_AD_ACCOUNT_ID = process.env.CONSORCIO_AD_ACCOUNT_ID ?? '1372194658303955';

/**
 * IDs das campanhas de Consórcio, separados por vírgula em CONSORCIO_CAMPAIGN_ID.
 *
 * A campanha original `120248834012110691` foi apagada em set/2026 e recriada como
 * cópia `120249806177670691`. O endpoint de insights da conta continua devolvendo o
 * gasto histórico da apagada, então mantemos as duas na lista: períodos anteriores
 * seguem com CPL correto e o gasto novo entra pela cópia. Ao trocar de campanha de
 * novo, ACRESCENTE o ID novo em vez de substituir.
 */
const CONSORCIO_CAMPAIGN_IDS = (
  process.env.CONSORCIO_CAMPAIGN_ID ?? '120249806177670691,120248834012110691'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Teto de crédito considerado no volume provisionado.
 *
 * O campo de crédito da LP é aberto — não há máximo — e aparecem simulações de
 * centenas de milhões que são teste ou dedo pesado. Uma delas sozinha domina a
 * soma do período e faz o indicador perder sentido. Simulações acima do teto
 * continuam no snapshot e na tabela, mas ficam FORA da soma, e a página informa
 * quantas foram. Ajuste por CONSORCIO_CREDITO_MAX (0 desliga o corte).
 */
const CREDITO_MAX = (() => {
  const raw = process.env.CONSORCIO_CREDITO_MAX;
  if (raw == null) return 20_000_000;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY;
})();

/** Coerção defensiva: o snapshot pode trazer números como string ("300.000,00" ou "300000"). */
function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v !== 'string') return 0;
  const s = v.trim();
  if (!s) return 0;
  // Remove tudo exceto dígitos, vírgula, ponto e sinal; normaliza pt-BR → ponto decimal.
  const cleaned = s.replace(/[^\d.,-]/g, '');
  const normalized =
    cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

const WHATSAPP_STATUSES: readonly WhatsappStatus[] = [
  'engajou',
  'conversou',
  'contatado',
  'sem_conversa',
  'nao_encontrado',
  'telefone_invalido',
  'sem_telefone',
  'desconhecido',
];

function normalizeWhatsapp(raw: unknown): ConsorcioWhatsapp {
  const w = (raw ?? {}) as Record<string, unknown>;
  const status = str(w.status) as WhatsappStatus;
  return {
    status: WHATSAPP_STATUSES.includes(status) ? status : 'desconhecido',
    contactId: typeof w.contactId === 'number' ? w.contactId : undefined,
    contactName: str(w.contactName) || undefined,
    conversationId: typeof w.conversationId === 'number' ? w.conversationId : null,
    mensagensDoLead: typeof w.mensagensDoLead === 'number' ? w.mensagensDoLead : undefined,
    mensagensAlemDaPronta:
      typeof w.mensagensAlemDaPronta === 'number' ? w.mensagensAlemDaPronta : undefined,
    primeiraMensagemEm: str(w.primeiraMensagemEm) || null,
    ultimaMensagemEm: str(w.ultimaMensagemEm) || null,
    labels: Array.isArray(w.labels) ? w.labels.map(str).filter(Boolean) : [],
  };
}

/** Normaliza um item cru do snapshot, tolerando os nomes de coluna do SharePoint. */
function normalizeLead(raw: Record<string, unknown>): ConsorcioLead {
  const credito = toNum(raw.credito ?? raw.valor_credito ?? raw.Crédito);
  return {
    leadId: str(raw.leadId ?? raw.lead_id ?? raw['ID do lead']),
    simulacaoId: str(raw.simulacaoId ?? raw.simulacao_id ?? raw['Simulacao ID']),
    createdAt: str(raw.createdAt ?? raw.Created ?? raw.data ?? raw.Data),

    temContato: raw.temContato === true || Boolean(raw.telefone ?? raw.Telefone),
    nome: str(raw.nome ?? raw.NomeCompleto ?? raw['Nome completo']),
    email: str(raw.email ?? raw['E-mail']),
    telefone: str(raw.telefone ?? raw.Telefone),

    credito,
    creditoPersonalizado: raw.creditoPersonalizado === true,
    parcela: toNum(raw.parcela ?? raw.parcela_mensal_estimada ?? raw['Parcela mensal']),
    prazo: toNum(raw.prazo ?? raw.Prazo),
    lanceEmbutido: toNum(raw.lanceEmbutido ?? raw.lance_embutido),
    lanceLivre: toNum(raw.lanceLivre ?? raw.lance_livre),
    lanceTotal: toNum(raw.lanceTotal ?? raw.lance_total_estimado),
    creditoLiquido: toNum(raw.creditoLiquido ?? raw.credito_liquido_estimado),
    totalIntegralizar: toNum(raw.totalIntegralizar ?? raw.total_estimado_integralizar),
    tipo: str(raw.tipo ?? raw.Tipo) || 'Não informado',

    emailStatus: str(raw.emailStatus ?? raw.status_email),
    emailEnviadoEm: str(raw.emailEnviadoEm ?? raw.email_enviado_em),

    utmSource: str(raw.utmSource ?? raw.utm_source),
    utmMedium: str(raw.utmMedium ?? raw.utm_medium),
    utmCampaign: str(raw.utmCampaign ?? raw.utm_campaign),
    utmContent: str(raw.utmContent ?? raw.utm_content),
    utmTerm: str(raw.utmTerm ?? raw.utm_term),
    origem: str(raw.origem ?? raw.Origem),

    whatsapp: normalizeWhatsapp(raw.whatsapp),

    etapa: str(raw.etapa ?? raw['Etapa do funil']),
    classificacao: str(raw.classificacao ?? raw.Classificação),
  };
}

export async function loadConsorcioSnapshot(): Promise<ConsorcioSnapshot | null> {
  const url = process.env.CONSORCIO_SNAPSHOT_URL;
  try {
    let json: unknown;
    if (url) {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      json = await res.json();
    } else {
      const file = path.join(process.cwd(), 'consorcio-snapshot.json');
      json = JSON.parse(await readFile(file, 'utf8'));
    }
    const obj = json as {
      generatedAt?: string;
      leads?: unknown[];
      note?: string;
      fonte?: string;
      contagens?: ConsorcioSnapshot['contagens'];
      chatwoot?: ConsorcioSnapshot['chatwoot'];
    };
    const leads = Array.isArray(obj.leads)
      ? obj.leads.map((l) => normalizeLead(l as Record<string, unknown>))
      : [];
    return {
      generatedAt: str(obj.generatedAt),
      leads,
      note: obj.note,
      fonte: obj.fonte,
      contagens: obj.contagens,
      chatwoot: obj.chatwoot,
    };
  } catch {
    return null;
  }
}

/**
 * Leads são em tempo real (diferente da Meta, cujas métricas assentam): se a janela
 * alcança o presente, inclui HOJE (horário de Brasília). Janelas históricas ficam intactas.
 */
export function effectiveLeadsPeriod(parsed: Period): Period {
  const todayBR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const d = new Date(`${todayBR}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 2);
  const cutoff = d.toISOString().slice(0, 10);
  return parsed.until >= cutoff ? { since: parsed.since, until: todayBR } : parsed;
}

function dayOf(iso: string): string {
  return (iso || '').slice(0, 10);
}

function inPeriod(iso: string, period: Period): boolean {
  const d = dayOf(iso);
  return d >= period.since && d <= period.until;
}

export function leadsInPeriod(leads: readonly ConsorcioLead[], period: Period): ConsorcioLead[] {
  return leads.filter((l) => inPeriod(l.createdAt, period));
}

/** O lead chegou ao WhatsApp — abriu a conversa e mandou pelo menos a mensagem pronta. */
export function conversou(l: ConsorcioLead): boolean {
  return l.whatsapp.status === 'engajou' || l.whatsapp.status === 'conversou';
}

/** O lead falou de verdade — escreveu algo além da mensagem pronta do botão. */
export function engajou(l: ConsorcioLead): boolean {
  return l.whatsapp.status === 'engajou';
}

/** O crédito entra na soma do volume provisionado? (ver CREDITO_MAX) */
export function creditoContavel(l: ConsorcioLead): boolean {
  return l.credito > 0 && l.credito <= CREDITO_MAX;
}

export type TipoAgg = { tipo: string; count: number; credito: number };

export type ConsorcioAgg = {
  count: number;
  /** Volume provisionado: soma do crédito simulado, sem os valores acima do teto. */
  creditoTotal: number;
  /** Quantas simulações do período ficaram fora da soma por estourar o teto. */
  acimaDoTeto: number;
  creditoTeto: number;
  ticketMedio: number | null;
  /** Mediana do crédito — resistente às simulações extremas. */
  ticketMediano: number | null;
  /** Quantos leads mexeram no valor em vez de aceitar o que vinha na tela. */
  personalizados: number;
  comContato: number;
  /** Chegaram ao WhatsApp (inclui quem só mandou a mensagem pronta). */
  conversaram: number;
  /** Escreveram algo além da mensagem pronta. */
  engajaram: number;
  byTipo: TipoAgg[];
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export function aggregate(leads: readonly ConsorcioLead[], period: Period): ConsorcioAgg {
  const inWindow = leads.filter((l) => inPeriod(l.createdAt, period));
  let creditoTotal = 0;
  let acimaDoTeto = 0;
  let personalizados = 0;
  let comContato = 0;
  let conversaram = 0;
  let engajaram = 0;
  const creditos: number[] = [];
  const tipoMap = new Map<string, TipoAgg>();

  for (const l of inWindow) {
    if (l.credito > CREDITO_MAX) acimaDoTeto += 1;
    if (l.creditoPersonalizado) personalizados += 1;
    if (l.temContato) comContato += 1;
    if (conversou(l)) conversaram += 1;
    if (engajou(l)) engajaram += 1;

    const contavel = creditoContavel(l);
    if (contavel) {
      creditoTotal += l.credito;
      creditos.push(l.credito);
    }

    const key = l.tipo || 'Não informado';
    const t = tipoMap.get(key) ?? { tipo: key, count: 0, credito: 0 };
    t.count += 1;
    if (contavel) t.credito += l.credito;
    tipoMap.set(key, t);
  }

  return {
    count: inWindow.length,
    creditoTotal,
    acimaDoTeto,
    creditoTeto: CREDITO_MAX,
    ticketMedio: creditos.length > 0 ? creditoTotal / creditos.length : null,
    ticketMediano: median(creditos),
    personalizados,
    comContato,
    conversaram,
    engajaram,
    byTipo: [...tipoMap.values()].sort((a, b) => b.credito - a.credito),
  };
}

/** Quantos leads do período em cada situação de WhatsApp. */
export type WhatsappBreakdown = { status: WhatsappStatus; label: string; count: number }[];

const WHATSAPP_LABEL: Record<WhatsappStatus, string> = {
  engajou: 'Trocou mensagens',
  conversou: 'Abriu o WhatsApp, só a mensagem pronta',
  contatado: 'Recebeu mensagem, não respondeu',
  sem_conversa: 'Contato no CRM, sem conversa',
  nao_encontrado: 'Não está no CRM',
  telefone_invalido: 'Telefone ilegível',
  sem_telefone: 'Sem dados de contato',
  desconhecido: 'Não apurado',
};

export function whatsappBreakdown(
  leads: readonly ConsorcioLead[],
  period: Period,
): WhatsappBreakdown {
  const counts = new Map<WhatsappStatus, number>();
  for (const l of leads) {
    if (!inPeriod(l.createdAt, period)) continue;
    counts.set(l.whatsapp.status, (counts.get(l.whatsapp.status) ?? 0) + 1);
  }
  return WHATSAPP_STATUSES.filter((s) => (counts.get(s) ?? 0) > 0).map((status) => ({
    status,
    label: WHATSAPP_LABEL[status],
    count: counts.get(status) ?? 0,
  }));
}

export type ConsorcioKanbanColumn = {
  stage: string;
  count: number;
  credito: number;
  leads: ConsorcioLead[];
};

/**
 * Etapa do lead. Quando a planilha de controle do consultor estiver integrada, a
 * coluna "Etapa do funil" manda. Até lá, a etapa é derivada do que os dados de
 * fato sabem: se deixou contato e se chegou a conversar no WhatsApp.
 */
export function stageOf(lead: ConsorcioLead): string {
  if (lead.etapa.trim()) return lead.etapa.trim();
  switch (lead.whatsapp.status) {
    case 'engajou':
      return 'Trocou mensagens';
    case 'conversou':
      return 'Abriu o WhatsApp';
    case 'contatado':
      return 'Contatado, sem resposta';
    case 'sem_conversa':
    case 'nao_encontrado':
      return 'Aguardando contato';
    case 'telefone_invalido':
      return 'Telefone ilegível';
    default:
      return lead.temContato ? 'Aguardando contato' : 'Simulou sem deixar contato';
  }
}

/**
 * Ordem canônica das colunas do Kanban (topo → fundo). Etapas fora desta lista —
 * o vocabulário livre da planilha do consultor — vão para o fim, em ordem
 * alfabética.
 */
const STAGE_ORDER = [
  'Simulou sem deixar contato',
  'Telefone ilegível',
  'Aguardando contato',
  'Contatado, sem resposta',
  'Abriu o WhatsApp',
  'Trocou mensagens',
  'Novo lead',
  'Em contato',
  'Aguardando retorno',
  'Simulação enviada',
  'Negociação',
  'Proposta enviada',
  'Fechado - Ganho',
  'Fechado - Perdido',
  'Não respondeu',
];

const STAGE_RANK = new Map(STAGE_ORDER.map((s, i) => [s.toLowerCase(), i]));

function etapaRank(stage: string): number {
  const r = STAGE_RANK.get(stage.toLowerCase());
  return r === undefined ? STAGE_ORDER.length : r;
}

/** Agrupa os leads do período por etapa, para a visualização Kanban. */
export function groupByEtapa(
  leads: readonly ConsorcioLead[],
  period: Period,
): ConsorcioKanbanColumn[] {
  const byStage = new Map<string, ConsorcioLead[]>();
  for (const l of leads) {
    if (!inPeriod(l.createdAt, period)) continue;
    const stage = stageOf(l);
    const list = byStage.get(stage);
    if (list) list.push(l);
    else byStage.set(stage, [l]);
  }

  const columns: ConsorcioKanbanColumn[] = [];
  for (const [stage, list] of byStage) {
    list.sort(
      (a, b) =>
        (b.credito || 0) - (a.credito || 0) || (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
    columns.push({
      stage,
      count: list.length,
      credito: list.filter(creditoContavel).reduce((sum, l) => sum + l.credito, 0),
      leads: list,
    });
  }

  columns.sort((a, b) => etapaRank(a.stage) - etapaRank(b.stage) || a.stage.localeCompare(b.stage));
  return columns;
}

/** Enumera as datas (YYYY-MM-DD) do período, inclusive. */
export function eachDay(period: Period): string[] {
  const out: string[] = [];
  const start = new Date(`${period.since}T00:00:00Z`);
  const end = new Date(`${period.until}T00:00:00Z`);
  for (let d = start; d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function leadsByDay(
  leads: readonly ConsorcioLead[],
  period: Period,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const l of leads) {
    if (!inPeriod(l.createdAt, period)) continue;
    const d = dayOf(l.createdAt);
    map[d] = (map[d] ?? 0) + 1;
  }
  return map;
}

/**
 * Funil comercial da visão executiva. As etapas são as que os dados sustentam
 * hoje, de forma cumulativa:
 *
 * - Simulações        = todo mundo que completou uma simulação no período
 * - Com contato       = deixou nome/e-mail/telefone
 * - Abriram o WhatsApp = clicaram no botão e a conversa existe no CRM
 * - Trocaram mensagens = escreveram algo além da mensagem pronta do botão
 *
 * O volume provisionado acompanha o topo do funil: é a soma do crédito simulado,
 * já sem os valores acima do teto.
 */
export type ConsorcioFunnel = {
  total: number;
  comContato: number;
  conversaram: number;
  engajaram: number;
  emNegociacao: number;
  /** Volume provisionado do período (crédito simulado, dentro do teto). */
  volumeProvisionado: number;
  /** Volume dos que chegaram a conversar no WhatsApp. */
  volumeEmConversa: number;
};

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const NEGOCIA_KW = ['negocia', 'proposta', 'reuniao', 'quente', 'oportunidade', 'ganho', 'fechado'];

/** O lead está em negociação segundo as colunas manuais da planilha do consultor. */
function emNegociacao(lead: ConsorcioLead): boolean {
  const hay = `${norm(lead.classificacao)} ${norm(lead.etapa)}`;
  if (!hay.trim()) return false;
  return NEGOCIA_KW.some((k) => hay.includes(k));
}

export function consorcioFunnel(leads: readonly ConsorcioLead[], period: Period): ConsorcioFunnel {
  const inWindow = leads.filter((l) => inPeriod(l.createdAt, period));
  let comContato = 0;
  let conversaram = 0;
  let engajaram = 0;
  let negociando = 0;
  let volumeProvisionado = 0;
  let volumeEmConversa = 0;

  for (const l of inWindow) {
    const contavel = creditoContavel(l);
    if (contavel) volumeProvisionado += l.credito;
    if (l.temContato) comContato += 1;
    if (conversou(l)) {
      conversaram += 1;
      if (contavel) volumeEmConversa += l.credito;
    }
    if (engajou(l)) engajaram += 1;
    if (emNegociacao(l)) negociando += 1;
  }

  return {
    total: inWindow.length,
    comContato,
    conversaram,
    engajaram,
    emNegociacao: negociando,
    volumeProvisionado,
    volumeEmConversa,
  };
}

/** Melhores criativos da campanha de Consórcio (ordenados por gasto — a conta usa
 *  Pixel/CAPI na LP, não Lead Ads nativo, então leads por anúncio podem vir zerados). */
export function fetchConsorcioCreatives(period: Period): Promise<CreativeRow[] | null> {
  return fetchTopCreatives({
    accountId: CONSORCIO_AD_ACCOUNT_ID,
    campaignIds: CONSORCIO_CAMPAIGN_IDS,
    period,
    rankBy: 'spend',
  });
}

export type ConsorcioSpend = { total: number; daily: Record<string, number> };

/**
 * Gasto de mídia da campanha de Consórcio na Meta. Busca na conta de anúncios do
 * Consórcio (distinta da conta padrão do BI) e filtra pela campanha. Retorna null
 * se o token não alcançar a conta ou a API falhar — o CPL degrada para "—".
 */
export async function fetchConsorcioSpend(period: Period): Promise<ConsorcioSpend | null> {
  try {
    const rows = await fetchInsights({
      accountId: CONSORCIO_AD_ACCOUNT_ID,
      level: 'campaign',
      period,
      timeIncrement: 1,
    });
    const wanted = new Set(CONSORCIO_CAMPAIGN_IDS);
    const mine = rows.filter((r) => r.campaign_id != null && wanted.has(r.campaign_id));
    if (mine.length === 0 && rows.length > 0) {
      // A conta respondeu, mas a campanha não apareceu no período — trata como zero, não erro.
      return { total: 0, daily: {} };
    }
    let total = 0;
    const daily: Record<string, number> = {};
    for (const r of mine) {
      total += r.spend;
      const d = r.date_start;
      if (d) daily[d] = (daily[d] ?? 0) + r.spend;
    }
    return { total, daily };
  } catch {
    return null;
  }
}
