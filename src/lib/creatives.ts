import { cacheLife, cacheTag } from 'next/cache';
import { env } from '@/lib/env';
import { rowToKpis } from '@/lib/kpi-calc';
import { fetchInsights } from '@/lib/meta-api';
import type { Period } from '@/lib/period';

/** Uma linha de criativo (anúncio) com as métricas usadas no ranking executivo. */
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
 * então consultamos `/{ad-id}?fields=creative{image_url,thumbnail_url}`. Cacheado
 * por horas (as URLs fbcdn são temporárias, mas o dashboard revalida junto).
 */
async function fetchCreativeImage(adId: string): Promise<string | null> {
  'use cache';
  cacheTag('meta:creative');
  cacheLife('hours');
  if (!/^\d+$/.test(adId)) return null;
  try {
    const url = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${adId}?fields=creative{image_url,thumbnail_url}&access_token=${env.META_ACCESS_TOKEN}`;
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
 * Funde linhas do mesmo criativo veiculado em campanhas diferentes (caso típico:
 * uma campanha apagada e recriada como cópia — os anúncios ganham IDs novos, mas
 * são o mesmo criativo com o mesmo nome). Sem isso o gasto do período aparece
 * partido em duas linhas iguais no ranking.
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
      // Mantém o ID de maior gasto — é dele que sai a imagem do criativo.
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
 * Busca os anúncios (nível 'ad') de uma conta — opcionalmente filtrando por
 * campanha(s) — e devolve os melhores segundo `rankBy`. Retorna null se a API da
 * Meta falhar ou o token não alcançar a conta (o chamador degrada a seção para "—").
 *
 * - `rankBy: 'leads'` (padrão) ordena por leads e desempata por gasto — bom para
 *   contas de Lead Ads (Plano de Saúde).
 * - `rankBy: 'spend'` ordena por gasto — bom quando o evento de lead não vive na
 *   conta de anúncios (Consórcio usa Pixel/CAPI na LP, não Lead Ads nativo).
 * - `campaignIds` com mais de um ID funde criativos homônimos (campanha recriada).
 */
export async function fetchTopCreatives(args: {
  accountId: string;
  campaignIds?: string[];
  period: Period;
  limit?: number;
  rankBy?: 'leads' | 'spend';
}): Promise<CreativeRow[] | null> {
  try {
    const rows = await fetchInsights({
      accountId: args.accountId,
      level: 'ad',
      period: args.period,
    });
    const wanted = new Set(args.campaignIds ?? []);
    const scoped =
      wanted.size > 0
        ? rows.filter((r) => r.campaign_id != null && wanted.has(r.campaign_id))
        : rows;

    const raw: CreativeRow[] = scoped.map((r) => {
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
    const mapped = wanted.size > 1 ? mergeByName(raw) : raw;

    const rankBy = args.rankBy ?? 'leads';
    mapped.sort((a, b) =>
      rankBy === 'leads' ? b.leads - a.leads || b.spend - a.spend : b.spend - a.spend,
    );

    const top = mapped.filter((c) => c.spend > 0 || c.leads > 0).slice(0, args.limit ?? 5);

    // Enriquecer os top-N com a imagem do criativo (uma chamada por anúncio, cacheada).
    const images = await Promise.all(top.map((c) => fetchCreativeImage(c.id)));
    return top.map((c, i) => ({ ...c, imageUrl: images[i] }));
  } catch {
    return null;
  }
}
