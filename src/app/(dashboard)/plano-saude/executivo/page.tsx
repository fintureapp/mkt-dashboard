import { Suspense } from 'react';
import { BestCreatives } from '@/components/best-creatives';
import { FunnelBoard, type FunnelStep } from '@/components/funnel-board';
import { KpiCard } from '@/components/kpi-card';
import { PlanoSaudeTabs } from '@/components/plano-saude-tabs';
import { TrendChart, type TrendPoint } from '@/components/trend-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTopCreatives } from '@/lib/creatives';
import { env } from '@/lib/env';
import { fmtInteger } from '@/lib/format';
import { aggregateRows, rowToKpis } from '@/lib/kpi-calc';
import { fetchInsights, fetchInsightsWithComparison } from '@/lib/meta-api';
import type { InsightsRow } from '@/lib/meta-types';
import { parsePeriodFromSearchParams, periodLabel, priorPeriod } from '@/lib/period';
import { countUndated, effectiveCRMPeriod, healthFunnel, loadSnapshot } from '@/lib/plano-saude';

type SP = Promise<{ since?: string; until?: string }>;

const ACCOUNT = env.META_AD_ACCOUNT_ID;

export default function PlanoSaudeExecutivoPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="flex flex-col gap-10">
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ReportSkeleton />}>
        <Report searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PageHeader({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = effectiveCRMPeriod(parsePeriodFromSearchParams(sp));
  const isDefault = !sp.since && !sp.until;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Plano de Saúde
        </h1>
        <p className="text-muted-foreground text-sm">
          Resumo executivo
          <span className="mx-2 text-muted-foreground/50">·</span>
          {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
        </p>
      </div>
      <PlanoSaudeTabs />
    </header>
  );
}

async function Report({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = effectiveCRMPeriod(parsePeriodFromSearchParams(sp));
  const prior = priorPeriod(current);

  const emptyComparison = { current: [] as InsightsRow[], prior: [] as InsightsRow[] };
  const [snapshot, dailyRows, comp, creatives] = await Promise.all([
    loadSnapshot(),
    fetchInsights({
      accountId: ACCOUNT,
      level: 'account',
      period: current,
      timeIncrement: 1,
    }).catch(() => [] as InsightsRow[]),
    fetchInsightsWithComparison({ accountId: ACCOUNT, level: 'account', current, prior }).catch(
      () => emptyComparison,
    ),
    fetchTopCreatives({ accountId: ACCOUNT, period: current, rankBy: 'leads' }),
  ]);

  const media = aggregateRows(comp.current);
  const mediaPrior = aggregateRows(comp.prior);
  const hasMedia = media.spend > 0 || media.leads > 0;

  const funnel = snapshot ? healthFunnel(snapshot, current) : null;
  const semData = snapshot ? countUndated(snapshot.cards) : 0;
  const qualificados = funnel?.qualificados ?? 0;
  const custoQualificado = qualificados > 0 && media.spend > 0 ? media.spend / qualificados : null;

  const trend: TrendPoint[] = dailyRows
    .map((r) => ({ date: r.date_start, spend: r.spend, conversions: rowToKpis(r).leads }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const funnelSteps: FunnelStep[] = funnel
    ? [
        { label: 'Total de leads', count: funnel.total },
        { label: 'Entraram em conversas', count: funnel.conversas },
        { label: 'Cotações enviadas', count: funnel.cotacoes },
        { label: 'Fechado ganho', count: funnel.ganho, hint: 'fechado-ganho + boleto pago' },
        {
          label: 'Volume provisionado',
          count: 0,
          kind: 'currency',
          amount: funnel.ganhoValor,
          hint: 'em Fechado ganho + Boleto pago · volume ×3',
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-10">
      {/* Funil comercial (CRM) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Funil comercial
          </h2>
          <span className="text-muted-foreground text-xs">CRM · período selecionado</span>
        </div>
        {funnel ? (
          <FunnelBoard steps={funnelSteps} />
        ) : (
          <div className="rounded-lg border border-border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
            Aguardando a primeira coleta do CRM para montar o funil.
          </div>
        )}
      </section>

      {/* Mídia (Meta) */}
      <section aria-label="Indicadores de mídia" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Mídia paga
          </h2>
          <span className="text-muted-foreground text-xs">Meta · período selecionado</span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Investimento"
            value={media.spend || null}
            prior={mediaPrior.spend || null}
            format="currency"
          />
          <KpiCard
            label="Leads"
            value={media.leads || null}
            prior={mediaPrior.leads || null}
            format="integer"
            hint="formulários da Meta"
          />
          <KpiCard label="CPL" value={media.cpl} prior={mediaPrior.cpl} format="currency" />
          <KpiCard
            label="Custo por lead qualificado"
            value={custoQualificado}
            prior={null}
            format="currency"
            hint="investimento ÷ leads em negociação (CRM)"
          />
        </div>
      </section>

      {/* Tendência */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Leads no tempo
          </h2>
          <span className="text-muted-foreground text-xs">
            leads (linha) x investimento (barras)
          </span>
        </div>
        <TrendChart data={trend} lineMetric="conversions" />
      </section>

      {/* Criativos */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
          Criativos que melhor performaram
        </h2>
        <BestCreatives rows={creatives} showLeads />
      </section>

      <p className="text-muted-foreground/80 text-xs">
        Funil: leads que entraram no período (CRM Cotação PME) e o estágio em que estão hoje ·
        Mídia, CPL e criativos: Meta no mesmo período
        {semData > 0 ? (
          <> · {fmtInteger(semData)} cards sem data no CRM ficam fora do recorte</>
        ) : null}
        {snapshot ? (
          <>
            {' '}
            · CRM atualizado em{' '}
            <span className="tabular">
              {new Date(snapshot.generatedAt).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          </>
        ) : null}
        {!hasMedia ? <> · gasto da Meta indisponível no período</> : null}
      </p>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56 sm:h-10" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-64 rounded-md" />
    </header>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <Skeleton className="h-36 rounded-lg" />
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </section>
      <Skeleton className="h-80 rounded-lg" />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </section>
    </div>
  );
}
