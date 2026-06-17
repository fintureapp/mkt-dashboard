import { cacheLife, cacheTag } from 'next/cache';
import { env } from '@/lib/env';
import { type InsightsResponse, InsightsResponseSchema, type InsightsRow } from '@/lib/meta-types';
import type { Period } from '@/lib/period';

export type Level = 'account' | 'campaign' | 'adset' | 'ad';

export class MetaApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly graphCode: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

const FIELDS = [
  'spend',
  'impressions',
  'reach',
  'frequency',
  'clicks',
  'ctr',
  'cpc',
  'cpm',
  'unique_clicks',
  'inline_link_clicks',
  'cost_per_inline_link_click',
  'actions',
  'action_values',
  'cost_per_action_type',
  'date_start',
  'date_stop',
  'account_currency',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
].join(',');

function buildInitialUrl(args: {
  accountId: string;
  level: Level;
  period: Period;
  timeIncrement?: number;
}): string {
  const base = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/act_${args.accountId}/insights`;
  const params = new URLSearchParams({
    level: args.level,
    fields: FIELDS,
    time_range: JSON.stringify({ since: args.period.since, until: args.period.until }),
    limit: '500',
    access_token: env.META_ACCESS_TOKEN,
  });
  if (args.timeIncrement) params.set('time_increment', String(args.timeIncrement));
  return `${base}?${params.toString()}`;
}

async function fetchPage(url: string): Promise<{ data: InsightsRow[]; nextUrl?: string }> {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    let graphCode: number | undefined;
    let graphMsg = res.statusText;
    try {
      const body = (await res.json()) as { error?: { code?: number; message?: string } };
      graphCode = body?.error?.code;
      graphMsg = body?.error?.message ?? graphMsg;
    } catch {
      // body not JSON; keep statusText
    }
    throw new MetaApiError(res.status, graphCode, `Meta API ${res.status}: ${graphMsg}`);
  }
  const json = (await res.json()) as unknown;
  const parsed: InsightsResponse = InsightsResponseSchema.parse(json);
  return { data: parsed.data, nextUrl: parsed.paging?.next };
}

export async function fetchInsights(args: {
  accountId: string;
  level: Level;
  period: Period;
  timeIncrement?: number;
}): Promise<InsightsRow[]> {
  'use cache';
  cacheTag('meta:insights');
  cacheLife('hours');

  let url: string | undefined = buildInitialUrl(args);
  const all: InsightsRow[] = [];
  while (url) {
    const { data, nextUrl } = await fetchPage(url);
    all.push(...data);
    url = nextUrl;
  }
  return all;
}

export async function fetchInsightsWithComparison(args: {
  accountId: string;
  level: Level;
  current: Period;
  prior: Period;
  timeIncrement?: number;
}): Promise<{ current: InsightsRow[]; prior: InsightsRow[] }> {
  const [current, prior] = await Promise.all([
    fetchInsights({
      accountId: args.accountId,
      level: args.level,
      period: args.current,
      timeIncrement: args.timeIncrement,
    }),
    fetchInsights({
      accountId: args.accountId,
      level: args.level,
      period: args.prior,
      timeIncrement: args.timeIncrement,
    }),
  ]);
  return { current, prior };
}
