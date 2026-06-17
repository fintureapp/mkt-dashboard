import { Suspense } from 'react';
import { KpiCard } from '@/components/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  aggregate,
  type BucketAgg,
  effectiveCRMPeriod,
  loadSnapshot,
  type PlanoSnapshot,
} from '@/lib/plano-saude';
import { parsePeriodFromSearchParams, periodLabel, priorPeriod } from '@/lib/period';

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
    <header className="flex flex-col gap-1.5">
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

  return (
    <div className="flex flex-col gap-8">
      <MetricGroup
        title="Cotações enviadas"
        subtitle="com valor informado (Enviado + Em Cotação)"
        current={cur.cotacoes}
        prior={prev.cotacoes}
      />
      <MetricGroup
        title="Propostas quentes"
        subtitle="estágio Negociação"
        current={cur.quentes}
        prior={prev.quentes}
      />
      <MetricGroup
        title="Fechamentos"
        subtitle="estágio Fechado - Ganho"
        current={cur.fechamento}
        prior={prev.fechamento}
      />
      <SnapshotFooter snapshot={snapshot} />
    </div>
  );
}

function MetricGroup({
  title,
  subtitle,
  current,
  prior,
}: {
  title: string;
  subtitle: string;
  current: BucketAgg;
  prior: BucketAgg;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">{title}</h2>
        <span className="text-muted-foreground text-xs">{subtitle}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          variant="hero"
          label="Quantidade"
          value={current.count}
          prior={prior.count}
          format="integer"
        />
        <KpiCard
          variant="hero"
          label="Valor total"
          value={current.value || null}
          prior={prior.value || null}
          format="currency"
        />
      </div>
    </section>
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
    <header className="flex flex-col gap-2">
      <Skeleton className="h-9 w-56 sm:h-10" />
      <Skeleton className="h-4 w-80" />
    </header>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {[0, 1, 2].map((g) => (
        <section key={g} className="flex flex-col gap-4">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-44 rounded-lg" />
            <Skeleton className="h-44 rounded-lg" />
          </div>
        </section>
      ))}
    </div>
  );
}
