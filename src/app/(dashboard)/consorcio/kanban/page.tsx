import { Suspense } from 'react';
import { ConsorcioKanban } from '@/components/consorcio-kanban';
import { ConsorcioTabs } from '@/components/consorcio-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type ConsorcioSnapshot,
  effectiveLeadsPeriod,
  groupByEtapa,
  loadConsorcioSnapshot,
} from '@/lib/consorcio';
import { parsePeriodFromSearchParams, periodLabel } from '@/lib/period';

type SP = Promise<{ since?: string; until?: string }>;

export default function ConsorcioKanbanPage({ searchParams }: { searchParams: SP }) {
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
  const current = effectiveLeadsPeriod(parsePeriodFromSearchParams(sp));
  const isDefault = !sp.since && !sp.until;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Consórcio
        </h1>
        <p className="text-muted-foreground text-sm">
          Leads por etapa do funil
          <span className="mx-2 text-muted-foreground/50">·</span>
          {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
        </p>
      </div>
      <ConsorcioTabs />
    </header>
  );
}

async function Board({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = effectiveLeadsPeriod(parsePeriodFromSearchParams(sp));
  const snapshot = await loadConsorcioSnapshot();

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-10 text-center">
        <p className="font-medium text-foreground">Aguardando a primeira publicação da planilha</p>
        <p className="mt-1 text-muted-foreground text-sm">
          O fluxo do Power Automate ainda não publicou o snapshot da planilha de controle. Assim que
          rodar, o quadro aparece aqui.
        </p>
      </div>
    );
  }

  const columns = groupByEtapa(snapshot.leads, current);

  return (
    <div className="flex flex-col gap-6">
      <ConsorcioKanban columns={columns} />
      <SnapshotFooter snapshot={snapshot} />
    </div>
  );
}

function SnapshotFooter({ snapshot }: { snapshot: ConsorcioSnapshot }) {
  const when = snapshot.generatedAt
    ? new Date(snapshot.generatedAt).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';
  return (
    <p className="text-muted-foreground/80 text-xs">
      Planilha de controle · atualizada em <span className="tabular">{when}</span>
      {snapshot.note ? <> · {snapshot.note}</> : null}
    </p>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48 sm:h-10" />
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
