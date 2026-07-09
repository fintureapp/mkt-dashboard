import { Suspense } from 'react';
import { DetailsDisclosure } from '@/components/details-disclosure';
import { HeroPair } from '@/components/hero-pair';
import { KpiCard } from '@/components/kpi-card';
import { TrendChart, type TrendPoint } from '@/components/trend-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/lib/env';
import { fmtCurrency, fmtMultiplier } from '@/lib/format';
import { aggregateRows, rowToKpis } from '@/lib/kpi-calc';
import { fetchInsights, fetchInsightsWithComparison } from '@/lib/meta-api';
import { parsePeriodFromSearchParams, periodLabel, priorPeriod } from '@/lib/period';
import { aggregate as aggregatePlano, loadSnapshot } from '@/lib/plano-saude';

type SP = Promise<{ since?: string; until?: string }>;

/**
 * Corpo da Visão Geral (KPIs, tendência, top campanhas). Extraído da página `/`
 * para ser reaproveitado também pela rota pública `/publico/[token]`, garantindo
 * que as duas telas mostrem exatamente o mesmo relatório.
 */
export function OverviewReport({ searchParams }: { searchParams: SP }) {
  return (
    <div className="flex flex-col gap-10">
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiSections searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<TrendSkeleton />}>
        <TrendSection searchParams={searchParams} />
      </Suspense>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Top campanhas" subtitle="por investimento" />
        <Suspense fallback={<Skeleton className="h-56 rounded-lg" />}>
          <TopCampaigns searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">{title}</h2>
      <span className="text-muted-foreground text-xs">{subtitle}</span>
    </div>
  );
}

async function PageHeader({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = parsePeriodFromSearchParams(sp);
  const prior = priorPeriod(current);
  const isDefault = !sp.since && !sp.until;
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
        Visão geral
      </h1>
      <p className="text-muted-foreground text-sm">
        {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
        <span className="mx-2 text-muted-foreground/50">·</span>
        comparado com {periodLabel(prior)}
      </p>
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-col gap-2">
      <Skeleton className="h-9 w-56 sm:h-10" />
      <Skeleton className="h-4 w-72" />
    </header>
  );
}

async function KpiSections({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = parsePeriodFromSearchParams(sp);
  const prior = priorPeriod(current);

  // Daily breakdown for the current period feeds both aggregates and hero sparklines.
  // `fetchInsights` uses Next 'use cache', so TrendSection reuses this same series.
  const [currentDaily, priorRows, snapshot] = await Promise.all([
    fetchInsights({
      accountId: env.META_AD_ACCOUNT_ID,
      level: 'account',
      period: current,
      timeIncrement: 1,
    }),
    fetchInsights({ accountId: env.META_AD_ACCOUNT_ID, level: 'account', period: prior }),
    loadSnapshot(),
  ]);
  const c = aggregateRows(currentDaily);
  const p = aggregateRows(priorRows);

  const dailyKpis = [...currentDaily]
    .sort((a, b) => a.date_start.localeCompare(b.date_start))
    .map(rowToKpis);
  const spendSpark = dailyKpis.map((k) => k.spend);

  // "Volume": o retorno real do negócio são os fechamentos no funil do CRM
  // (Plano de Saúde), não o purchase do pixel. Comparado ao Investimento, vira o Retorno.
  const volume = snapshot ? aggregatePlano(snapshot.cards, current).fechamento.value || null : null;
  const volumePrior = snapshot ? aggregatePlano(snapshot.cards, prior).fechamento.value || null : null;
  const volRoas = volume != null && c.spend > 0 ? volume / c.spend : null;
  const volRoasPrior = volumePrior != null && p.spend > 0 ? volumePrior / p.spend : null;
  // ROI a partir do Volume (fechamentos do CRM) vs. Investimento.
  const volRoi = volume != null && c.spend > 0 ? ((volume - c.spend) / c.spend) * 100 : null;
  const volRoiPrior =
    volumePrior != null && p.spend > 0 ? ((volumePrior - p.spend) / p.spend) * 100 : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Herói: Investimento → Volume (fechamentos do CRM), ligado pelo Retorno */}
      <HeroPair
        spend={{
          label: 'Investimento',
          value: c.spend,
          prior: p.spend,
          spark: spendSpark.length >= 2 ? spendSpark : undefined,
        }}
        revenue={{
          label: 'Volume',
          value: volume,
          prior: volumePrior,
          hint: volume == null ? 'Sem snapshot do funil' : 'fechamentos · funil Plano de Saúde',
        }}
        roas={volRoas}
        roasPrior={volRoasPrior}
      />

      {/* Linha de resultado: como chegamos ao retorno */}
      <section aria-label="Resultado" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Conversões" value={c.leads} prior={p.leads} format="integer" />
        <KpiCard label="CPL" value={c.cpl} prior={p.cpl} format="currency" />
        <KpiCard
          label="ROI"
          value={volRoi}
          prior={volRoiPrior}
          format="percent"
          hint={volRoi == null ? undefined : 'Volume vs. investimento'}
        />
      </section>

      {/* Diagnóstico: densidade de operador, escondida por padrão */}
      <DetailsDisclosure summary="Métricas de diagnóstico" hint="8 indicadores">
        <section
          aria-label="Diagnóstico"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
        >
          <KpiCard label="CPC" value={c.cpc} prior={p.cpc} format="currency" />
          <KpiCard label="CPM" value={c.cpm} prior={p.cpm} format="currency" />
          <KpiCard label="Impressões" value={c.impressions} prior={p.impressions} format="integer" />
          <KpiCard label="Alcance" value={c.reach} prior={p.reach} format="integer" />
          <KpiCard label="Frequência" value={c.frequency} prior={p.frequency} format="decimal" />
          <KpiCard label="Cliques" value={c.clicks} prior={p.clicks} format="integer" />
          <KpiCard label="CTR" value={c.ctr} prior={p.ctr} format="percent" />
          <KpiCard label="Tx Conv." value={c.convRate} prior={p.convRate} format="percent" />
        </section>
      </DetailsDisclosure>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-48 rounded-lg sm:h-52" />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {['r-1', 'r-2', 'r-3'].map((k) => (
          <Skeleton key={k} className="h-28 rounded-lg" />
        ))}
      </section>
      <Skeleton className="h-5 w-52" />
    </div>
  );
}

async function TrendSection({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = parsePeriodFromSearchParams(sp);
  const rows = await fetchInsights({
    accountId: env.META_AD_ACCOUNT_ID,
    level: 'account',
    period: current,
    timeIncrement: 1,
  });
  const data: TrendPoint[] = rows
    .map((row) => {
      const k = rowToKpis(row);
      return { date: row.date_start, spend: row.spend, conversions: k.leads, revenue: k.revenue };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const hasRevenue = data.some((d) => (d.revenue ?? 0) > 0);
  const lineMetric = hasRevenue ? 'revenue' : 'conversions';

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle
        title="Tendência diária"
        subtitle={`investimento × ${hasRevenue ? 'receita' : 'conversões'}`}
      />
      <TrendChart data={data} lineMetric={lineMetric} height="h-96" />
    </section>
  );
}

function TrendSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </section>
  );
}

async function TopCampaigns({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = parsePeriodFromSearchParams(sp);
  const prior = priorPeriod(current);
  const { current: currentRows } = await fetchInsightsWithComparison({
    accountId: env.META_AD_ACCOUNT_ID,
    level: 'campaign',
    current,
    prior,
  });
  const rows = currentRows
    .map((row) => {
      const k = rowToKpis(row);
      return { id: row.campaign_id ?? '', name: row.campaign_name ?? '—', spend: k.spend, roas: k.roas };
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 3);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
        Sem dados no período. Tente um intervalo mais amplo.
      </div>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
      {rows.map((r, i) => (
        <li key={r.id || i} className="flex items-center gap-4 px-5 py-4">
          <span className="label w-4 shrink-0 tabular text-muted-foreground/60">{i + 1}</span>
          <span className="flex-1 truncate text-foreground text-sm">{r.name}</span>
          <span className="w-24 shrink-0 text-right text-muted-foreground text-xs tabular sm:w-28">
            {fmtMultiplier(r.roas)} ROAS
          </span>
          <span className="w-28 shrink-0 text-right font-display font-semibold text-foreground tabular tracking-tight sm:w-32">
            {fmtCurrency(r.spend)}
          </span>
        </li>
      ))}
    </ol>
  );
}
