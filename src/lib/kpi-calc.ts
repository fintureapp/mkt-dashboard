import {
  LEAD_ACTION_TYPES,
  PURCHASE_ACTION_TYPES,
  sumActionsByType,
} from '@/lib/conversion-mapping';
import type { InsightsRow } from '@/lib/meta-types';

export type KpiSet = {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  revenue: number;
  cpl: number | null;
  roas: number | null;
  roi: number | null;
  convRate: number | null;
};

const safeDiv = (num: number, denom: number): number | null =>
  denom > 0 && Number.isFinite(num / denom) ? num / denom : null;

export function rowToKpis(row: InsightsRow): KpiSet {
  const leads = sumActionsByType(row.actions, LEAD_ACTION_TYPES);
  const revenue = sumActionsByType(row.action_values, PURCHASE_ACTION_TYPES);
  return {
    spend: row.spend,
    impressions: row.impressions,
    reach: row.reach,
    frequency: row.frequency,
    clicks: row.clicks,
    ctr: row.ctr,
    cpc: row.cpc,
    cpm: row.cpm,
    leads,
    revenue,
    cpl: safeDiv(row.spend, leads),
    roas: safeDiv(revenue, row.spend),
    roi: revenue > 0 && row.spend > 0 ? (revenue - row.spend) / row.spend : null,
    convRate: row.clicks > 0 ? (leads / row.clicks) * 100 : null,
  };
}

/**
 * Aggregate multiple rows into a single KPI set. Used when summing across campaigns,
 * adsets, etc. for a "total" footer or whole-account roll-up.
 */
export function aggregateRows(rows: readonly InsightsRow[]): KpiSet {
  let spend = 0;
  let impressions = 0;
  let reach = 0;
  let clicks = 0;
  let leads = 0;
  let revenue = 0;
  let frequencyWeighted = 0;
  let frequencyDenom = 0;

  for (const row of rows) {
    spend += row.spend;
    impressions += row.impressions;
    reach += row.reach;
    clicks += row.clicks;
    leads += sumActionsByType(row.actions, LEAD_ACTION_TYPES);
    revenue += sumActionsByType(row.action_values, PURCHASE_ACTION_TYPES);
    if (row.reach > 0) {
      frequencyWeighted += row.frequency * row.reach;
      frequencyDenom += row.reach;
    }
  }

  const ctr = clicks > 0 && impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = safeDiv(spend, clicks) ?? 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const frequency = frequencyDenom > 0 ? frequencyWeighted / frequencyDenom : 0;

  return {
    spend,
    impressions,
    reach,
    frequency,
    clicks,
    ctr,
    cpc,
    cpm,
    leads,
    revenue,
    cpl: safeDiv(spend, leads),
    roas: safeDiv(revenue, spend),
    roi: revenue > 0 && spend > 0 ? (revenue - spend) / spend : null,
    convRate: clicks > 0 ? (leads / clicks) * 100 : null,
  };
}

/**
 * Percent change from prior to current. Returns null when prior is zero/missing
 * (no meaningful comparison) or when either side is null.
 */
export function deltaPct(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null) return null;
  if (prior === 0) return null;
  return ((current - prior) / prior) * 100;
}
