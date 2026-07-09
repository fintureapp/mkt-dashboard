import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { OverviewReport } from '@/components/overview-report';
import { PeriodSelector } from '@/components/period-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Painel compartilhado · Criteria × Finture',
  // Nunca indexar: a página expõe métricas de mídia sem login.
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;
type SP = Promise<{ since?: string; until?: string }>;

export default function PublicOverviewPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-border border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-6 sm:gap-4">
          <span
            className="inline-flex size-7 items-center justify-center rounded bg-primary font-display font-bold text-primary-foreground"
            aria-hidden="true"
          >
            f
          </span>
          <span className="font-display font-semibold text-base text-foreground tracking-tight">
            Marketing BI
          </span>
          <span className="hidden rounded bg-secondary px-2 py-0.5 text-muted-foreground text-xs sm:inline">
            compartilhado · somente leitura
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Suspense fallback={<Skeleton className="h-8 w-44" />}>
              <PeriodSelector />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<ReportSkeleton />}>
          <GatedReport params={params} searchParams={searchParams} />
        </Suspense>
      </main>

      <footer className="mx-auto w-full max-w-[1600px] px-6 pb-8">
        <p className="text-muted-foreground/70 text-xs">
          Visão geral de performance · Criteria Seguros × Finture · dados Meta Ads · link somente
          leitura.
        </p>
      </footer>
    </div>
  );
}

/**
 * Valida o token (defesa em profundidade — o middleware já barra tokens errados
 * com basic auth) e renderiza o relatório. Fica dentro de `<Suspense>` porque
 * lê `params`, que é dado dinâmico (Cache Components).
 */
async function GatedReport({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { token } = await params;
  const expected = env.PUBLIC_SHARE_TOKEN;
  if (!expected || token.length !== expected.length || token !== expected) {
    notFound();
  }
  return <OverviewReport searchParams={searchParams} />;
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56 sm:h-10" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-48 rounded-lg sm:h-52" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
