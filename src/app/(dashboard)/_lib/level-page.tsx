import { Suspense } from 'react';
import { InsightsTable, type InsightsTableRow } from '@/components/insights-table';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/lib/env';
import { type KpiSet, rowToKpis } from '@/lib/kpi-calc';
import { fetchInsightsWithComparison, type Level } from '@/lib/meta-api';
import type { InsightsRow } from '@/lib/meta-types';
import { parsePeriodFromSearchParams, periodLabel, priorPeriod } from '@/lib/period';

export type SP = Promise<{ since?: string; until?: string }>;

type Spec = {
  level: Exclude<Level, 'account'>;
  title: string;
  subtitle: string;
  idOf: (r: InsightsRow) => string;
  nameOf: (r: InsightsRow) => string;
};

export function LevelPage({ searchParams, spec }: { searchParams: SP; spec: Spec }) {
  return (
    <div className="flex flex-col gap-10">
      <Suspense fallback={<HeaderSkeleton title={spec.title} subtitle={spec.subtitle} />}>
        <PageHeader searchParams={searchParams} spec={spec} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
        <Body searchParams={searchParams} spec={spec} />
      </Suspense>
    </div>
  );
}

async function PageHeader({ searchParams, spec }: { searchParams: SP; spec: Spec }) {
  const sp = await searchParams;
  const current = parsePeriodFromSearchParams(sp);
  const prior = priorPeriod(current);
  const isDefault = !sp.since && !sp.until;
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
        {spec.title}
      </h1>
      <p className="text-muted-foreground text-sm">
        {spec.subtitle}
        <span className="mx-2 text-muted-foreground/50">·</span>
        {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
        <span className="mx-2 text-muted-foreground/50">vs</span>
        {periodLabel(prior)}
      </p>
    </header>
  );
}

function HeaderSkeleton({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </header>
  );
}

async function Body({ searchParams, spec }: { searchParams: SP; spec: Spec }) {
  const sp = await searchParams;
  const current = parsePeriodFromSearchParams(sp);
  const prior = priorPeriod(current);

  const { current: currentRows, prior: priorRows } = await fetchInsightsWithComparison({
    accountId: env.META_AD_ACCOUNT_ID,
    level: spec.level,
    current,
    prior,
  });

  const priorMap = new Map<string, KpiSet>();
  for (const row of priorRows) priorMap.set(spec.idOf(row), rowToKpis(row));

  const rows: InsightsTableRow[] = currentRows
    .map((row) => ({
      id: spec.idOf(row),
      name: spec.nameOf(row),
      current: rowToKpis(row),
      prior: priorMap.get(spec.idOf(row)) ?? null,
    }))
    .sort((a, b) => b.current.spend - a.current.spend);

  return <InsightsTable rows={rows} />;
}
