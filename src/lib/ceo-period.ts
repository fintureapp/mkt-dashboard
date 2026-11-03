import type { Period } from '@/lib/period';

/**
 * Recorte do painel do CEO, lido da URL:
 * - `?p=tudo|hoje|7d|30d` escolhe um atalho (padrão: 30d);
 * - `?since=AAAA-MM-DD&until=AAAA-MM-DD` define um intervalo livre e vence o atalho.
 *
 * Dado de CRM é tempo real, então os atalhos incluem HOJE (horário de Brasília).
 * "Tudo" devolve `period: null`: o board inteiro, sem recorte.
 */
export type CeoPreset = 'tudo' | 'hoje' | '7d' | '30d';
export const CEO_PRESETS: ReadonlyArray<{ value: CeoPreset; label: string }> = [
  { value: 'tudo', label: 'Tudo' },
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

export type CeoPeriod = {
  /** Atalho ativo, ou null quando o intervalo é livre. */
  preset: CeoPreset | null;
  period: Period | null;
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function todayInBrazil(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function minusDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function resolveCeoPeriod(
  sp: { p?: string; since?: string; until?: string },
  today: string = todayInBrazil(),
): CeoPeriod {
  if (sp.since && sp.until && ISO_DAY.test(sp.since) && ISO_DAY.test(sp.until)) {
    const [since, until] = sp.since <= sp.until ? [sp.since, sp.until] : [sp.until, sp.since];
    return { preset: null, period: { since, until } };
  }
  switch (sp.p) {
    case 'tudo':
      return { preset: 'tudo', period: null };
    case 'hoje':
      return { preset: 'hoje', period: { since: today, until: today } };
    case '7d':
      return { preset: '7d', period: { since: minusDays(today, 6), until: today } };
    default:
      return { preset: '30d', period: { since: minusDays(today, 29), until: today } };
  }
}
