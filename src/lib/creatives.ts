import { cacheLife, cacheTag } from 'next/cache';
import { env } from '@/lib/env';
import { rowToKpis } from '@/lib/kpi-calc';
import { fetchInsights } from '@/lib/meta-api';
import type { Period } from '@/lib/period';

/** Um anúncio com as métricas do ranking de criativos do painel. */
export type CreativeRow = {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  /** CTR em pontos percentuais (ex.: 1.8 = 1,8%). */
  ctr: number;
  leads: number;
  cpl: number | null;
  /** URL da imagem do criativo (fbcdn) — null quando indisponível. */
  imageUrl: string | null;
};

/**
 * Busca a imagem do criativo de um anúncio. O endpoint de insights não traz mídia,
 * então consultamos o criativo do anúncio. Sem `thumbnail_width/height` a Meta
 * devolve uma miniatura de 64px (borrada no card); pedimos 800×1000. Cacheado
 * por horas (as URLs fbcdn são temporárias, mas o dashboard revalida junto).
 */
async function fetchCreativeImage(adId: string): Promise<string | null> {
  'use cache';
  cacheTag('meta:creative');
  cacheLife('hours');
  if (!/^\d+$/.test(adId)) return null;
  try {
    const url = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${adId}?fields=creative.thumbnail_width(800).thumbnail_height(1000){image_url,thumbnail_url}&access_token=${env.META_ACCESS_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      creative?: { image_url?: string; thumbnail_url?: string };
    };
    return json.creative?.image_url ?? json.creative?.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Funde anúncios com o mesmo nome. O mesmo criativo costuma rodar em vários
 * conjuntos (ou numa campanha recriada), cada um com ID próprio; sem isso o top 3
 * vira o mesmo anúncio repetido e o gasto aparece partido.
 */
function mergeByName(rows: CreativeRow[]): CreativeRow[] {
  const byName = new Map<string, CreativeRow>();
  for (const r of rows) {
    const prev = byName.get(r.name);
    if (!prev) {
      byName.set(r.name, { ...r });
      continue;
    }
    const merged: CreativeRow = {
      // Mantém o ID de maior gasto: é dele que sai a imagem do criativo.
      id: r.spend > prev.spend ? r.id : prev.id,
      name: prev.name,
      spend: prev.spend + r.spend,
      impressions: prev.impressions + r.impressions,
      clicks: prev.clicks + r.clicks,
      ctr: 0,
      leads: prev.leads + r.leads,
      cpl: null,
      imageUrl: null,
    };
    merged.ctr = merged.impressions > 0 ? (merged.clicks / merged.impressions) * 100 : 0;
    merged.cpl = merged.leads > 0 ? merged.spend / merged.leads : null;
    byName.set(merged.name, merged);
  }
  return [...byName.values()];
}

/**
 * Anúncios (nível 'ad') da conta no período, ordenados por leads (desempate por
 * gasto), já com a imagem do criativo. Devolve null se a Meta falhar ou o token
 * não alcançar a conta: o chamador mostra o estado "indisponível".
 */
export async function fetchTopCreatives(args: {
  accountId: string;
  period: Period;
  limit?: number;
}): Promise<CreativeRow[] | null> {
  try {
    const rows = await fetchInsights({
      accountId: args.accountId,
      level: 'ad',
      period: args.period,
    });
    const raw: CreativeRow[] = rows.map((r) => {
      const k = rowToKpis(r);
      return {
        id: r.ad_id ?? r.ad_name ?? `${r.campaign_id}-${r.date_start}`,
        name: r.ad_name?.trim() || '(anúncio sem nome)',
        spend: k.spend,
        impressions: k.impressions,
        clicks: k.clicks,
        ctr: k.ctr,
        leads: k.leads,
        cpl: k.cpl,
        imageUrl: null,
      };
    });
    const mapped = mergeByName(raw);
    mapped.sort((a, b) => b.leads - a.leads || b.spend - a.spend);

    const top = mapped.filter((c) => c.spend > 0 || c.leads > 0).slice(0, args.limit ?? 3);

    // Enriquecer os top-N com a imagem do criativo (uma chamada por anúncio, cacheada).
    const images = await Promise.all(top.map((c) => fetchCreativeImage(c.id)));
    return top.map((c, i) => ({ ...c, imageUrl: images[i] }));
  } catch {
    return null;
  }
}
