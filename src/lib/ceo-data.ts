import { type CreativeRow, fetchTopCreatives } from '@/lib/creatives';
import { env } from '@/lib/env';
import { aggregateRows } from '@/lib/kpi-calc';
import { fetchInsights } from '@/lib/meta-api';
import type { Period } from '@/lib/period';
import {
  type CeoSummary,
  ceoSummary,
  earliestEntry,
  loadSnapshot,
  type PlanoSnapshot,
} from '@/lib/plano-saude';

export type MediaTotals = {
  spend: number;
  leads: number;
  cpl: number | null;
  ctr: number;
  cpm: number;
  clicks: number;
  impressions: number;
};

/** Janela da mídia: o próprio recorte, ou (em "Tudo") do lead mais antigo até hoje. */
export function mediaPeriodFor(
  period: Period | null,
  snapshot: PlanoSnapshot,
  today: string,
): Period {
  return period ?? { since: earliestEntry(snapshot.cards) ?? today, until: today };
}

/** Totais da conta Meta no período; null se a API falhar. */
export async function loadMediaTotals(period: Period): Promise<MediaTotals | null> {
  try {
    const rows = await fetchInsights({
      accountId: env.META_AD_ACCOUNT_ID,
      level: 'account',
      period,
    });
    const k = aggregateRows(rows);
    return {
      spend: k.spend,
      leads: k.leads,
      cpl: k.cpl,
      ctr: k.ctr,
      cpm: k.cpm,
      clicks: k.clicks,
      impressions: k.impressions,
    };
  } catch {
    return null;
  }
}

export type CeoData = {
  snapshot: PlanoSnapshot;
  summary: CeoSummary;
  media: MediaTotals | null;
  creatives: CreativeRow[] | null;
};

/** Tudo o que a página e o diagnóstico leem para um recorte. null = sem snapshot do CRM. */
export async function loadCeoData(
  period: Period | null,
  today: string,
  creativesLimit = 3,
): Promise<CeoData | null> {
  const snapshot = await loadSnapshot();
  if (!snapshot) return null;
  const mediaPeriod = mediaPeriodFor(period, snapshot, today);
  const [media, creatives] = await Promise.all([
    loadMediaTotals(mediaPeriod),
    fetchTopCreatives({
      accountId: env.META_AD_ACCOUNT_ID,
      period: mediaPeriod,
      limit: creativesLimit,
    }),
  ]);
  return { snapshot, summary: ceoSummary(snapshot.cards, period), media, creatives };
}
