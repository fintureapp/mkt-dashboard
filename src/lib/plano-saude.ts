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

export type PlanoBucket = 'cotacoes' | 'quentes' | 'fechamento';

export type PlanoCard = {
  bucket: PlanoBucket;
  stage: string;
  convId: number;
  name: string;
  value: number;
  /** ISO — data da tarefa de valor (proxy de "cotação enviada"), com fallback p/ criação do card */
  eventDate: string;
  hasValue: boolean;
  tasks: string[];
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
export type Relatorio = { cotacoes: BucketAgg; quentes: BucketAgg; fechamento: BucketAgg };

export async function loadSnapshot(): Promise<PlanoSnapshot | null> {
  const url = process.env.PLANO_SAUDE_SNAPSHOT_URL;
  try {
    if (url) {
      const res = await fetch(url, { cache: 'no-store' });
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

export function aggregate(cards: PlanoCard[], period: Period): Relatorio {
  const empty = (): BucketAgg => ({ count: 0, value: 0 });
  const r: Relatorio = { cotacoes: empty(), quentes: empty(), fechamento: empty() };
  for (const c of cards) {
    if (!inPeriod(c.eventDate, period)) continue;
    const b = r[c.bucket];
    if (!b) continue;
    // "Cotações enviadas" conta apenas cards com cotação feita (valor informado).
    // Quentes e Fechamento contam por estágio (independente de valor preenchido).
    if (c.bucket === 'cotacoes' && !(c.value > 0)) continue;
    b.count += 1;
    b.value += c.value || 0;
  }
  return r;
}
