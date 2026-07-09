import { Suspense } from 'react';
import { KanbanBoard } from '@/components/kanban-board';
import { PlanoSaudeTabs } from '@/components/plano-saude-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { parsePeriodFromSearchParams, periodLabel } from '@/lib/period';
import { effectiveCRMPeriod, groupByStage, loadSnapshot, type PlanoSnapshot } from '@/lib/plano-saude';

type SP = Promise<{ since?: string; until?: string }>;

export default function PlanoSaudeKanbanPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<BoardSkeleton />}>
        <Board searchParams={searchParams} />
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
          Quadro por estágio do CRM
          <span className="mx-2 text-muted-foreground/50">·</span>
          {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
        </p>
      </div>
      <PlanoSaudeTabs />
    </header>
  );
}

async function Board({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = effectiveCRMPeriod(parsePeriodFromSearchParams(sp));
  const snapshot = await loadSnapshot();

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-10 text-center">
        <p className="font-medium text-foreground">Aguardando a primeira coleta do CRM</p>
        <p className="mt-1 text-muted-foreground text-sm">
          O coletor ainda não gravou o snapshot do funil. Assim que rodar, o quadro aparece aqui.
        </p>
      </div>
    );
  }

  const columns = groupByStage(snapshot.cards, current);

  return (
    <div className="flex flex-col gap-6">
      <KanbanBoard columns={columns} />
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56 sm:h-10" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-56 rounded-md" />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}
