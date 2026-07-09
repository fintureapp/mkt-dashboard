import { Suspense } from 'react';
import { FunnelPipeline, type FunnelStage } from '@/components/funnel-pipeline';
import { KpiCard } from '@/components/kpi-card';
import { PlanoSaudeTabs } from '@/components/plano-saude-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { parsePeriodFromSearchParams, periodLabel, priorPeriod } from '@/lib/period';
import { aggregate, effectiveCRMPeriod, loadSnapshot, type PlanoSnapshot } from '@/lib/plano-saude';

type SP = Promise<{ since?: string; until?: string }>;

export default function PlanoSaudePage({ searchParams }: { searchParams: SP }) {
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
  const prior = priorPeriod(current);
  const isDefault = !sp.since && !sp.until;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Plano de Saúde
        </h1>
        <p className="text-muted-foreground text-sm">
          Relatório do período
          <span className="mx-2 text-muted-foreground/50">·</span>
          {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
          <span className="mx-2 text-muted-foreground/50">·</span>
          comparado com {periodLabel(prior)}
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
  const snapshot = await loadSnapshot();

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-10 text-center">
        <p className="font-medium text-foreground">Aguardando a primeira coleta do CRM</p>
        <p className="mt-1 text-muted-foreground text-sm">
          O coletor ainda não gravou o snapshot do funil. Assim que rodar, os números aparecem aqui.
        </p>
      </div>
    );
  }

  const cur = aggregate(snapshot.cards, current);
  const prev = aggregate(snapshot.cards, prior);

  const stages: FunnelStage[] = [
    {
      label: 'Cotações enviadas',
      value: cur.cotacoes.value,
      count: cur.cotacoes.count,
      prior: prev.cotacoes.value || null,
      color: 'var(--color-chart-2)',
    },
    {
      label: 'Propostas quentes',
      value: cur.quentes.value,
      count: cur.quentes.count,
      prior: prev.quentes.value || null,
      color: 'var(--color-chart-3)',
    },
    {
      label: 'Fechamentos',
      value: cur.fechamento.value,
      count: cur.fechamento.count,
      prior: prev.fechamento.value || null,
      color: 'var(--color-chart-4)',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Pipeline em R$ — a estrela: quanto está a ganhar vs. quanto fechou */}
      <section aria-label="Pipeline" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          variant="hero"
          label="A ganhar"
          value={cur.quentes.value || null}
          prior={prev.quentes.value || null}
          format="currency"
          hint="propostas quentes · estágio Negociação"
        />
        <KpiCard
          variant="hero"
          label="Fechado"
          value={cur.fechamento.value || null}
          prior={prev.fechamento.value || null}
          format="currency"
          hint="estágio Fechado - Ganho"
        />
      </section>

      {/* Funil de valor */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Funil de valor
          </h2>
          <span className="text-muted-foreground text-xs">pipeline em R$ por etapa</span>
        </div>
        <FunnelPipeline stages={stages} />
      </section>

      <SnapshotFooter snapshot={snapshot} />
    </div>
  );
}

function SnapshotFooter({ snapshot }: { snapshot: PlanoSnapshot }) {
  const when = new Date(snapshot.generatedAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return (
    <p className="text-muted-foreground/80 text-xs">
      Funil <span className="text-foreground/80">{snapshot.funnel}</span> · dados do CRM atualizados em{' '}
      <span className="tabular">{when}</span>
      {snapshot.note ? <> · {snapshot.note}</> : null}
    </p>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56 sm:h-10" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-9 w-56 rounded-md" />
    </header>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </section>
      <section className="flex flex-col gap-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-72 rounded-lg" />
      </section>
    </div>
  );
}
