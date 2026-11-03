import { Suspense } from 'react';
import { FintureMark } from '@/components/ceo/finture-mark';
import { HeroFunnel, STAGE_COLOR } from '@/components/ceo/hero-funnel';
import { PeriodPills } from '@/components/ceo/period-pills';
import { RecentTable } from '@/components/ceo/recent-table';
import { RefreshButton } from '@/components/ceo/refresh-button';
import { StatStrip } from '@/components/ceo/stat-strip';
import { TopCreatives } from '@/components/ceo/top-creatives';
import { Skeleton } from '@/components/ui/skeleton';
import { loadCeoData } from '@/lib/ceo-data';
import { resolveCeoPeriod, todayInBrazil } from '@/lib/ceo-period';
import { fmtCurrency, fmtInteger } from '@/lib/format';
import { periodLabel } from '@/lib/period';
import { recentMoves } from '@/lib/plano-saude';

type SP = Promise<{ p?: string; since?: string; until?: string }>;

export default function CeoPage({ searchParams }: { searchParams: SP }) {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <Suspense fallback={<TopBarSkeleton />}>
        <TopBar searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<BodySkeleton />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function TopBar({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { preset, period } = resolveCeoPeriod(sp);
  return (
    <header className="flex flex-col gap-5 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <FintureMark className="size-8 shrink-0 self-center" />
          <h1 className="font-display font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            Plano de Saúde
          </h1>
          <span className="hidden text-muted-foreground text-sm sm:inline">Criteria PME</span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
        </div>
      </div>
      <PeriodPills
        preset={preset}
        since={preset === null ? (period?.since ?? null) : null}
        until={preset === null ? (period?.until ?? null) : null}
      />
    </header>
  );
}

async function Body({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { period } = resolveCeoPeriod(sp);
  const data = await loadCeoData(period, todayInBrazil());

  if (!data) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-card p-10 text-center text-muted-foreground">
        Aguardando a primeira coleta do CRM.
      </div>
    );
  }

  // Mídia e criativos no mesmo recorte; em "Tudo", do lead mais antigo do CRM até hoje.
  const { snapshot, summary: s, creatives } = data;
  const spend = data.media?.spend ?? null;
  const rows = recentMoves(snapshot.cards, period, 12);

  const custoVenda = spend != null && s.vendas > 0 ? spend / s.vendas : null;
  const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

  return (
    <>
      <HeroFunnel s={s} />
      <StatStrip
        stats={[
          { label: 'Em andamento', value: fmtInteger(s.emAndamento), note: 'ainda no funil' },
          {
            label: 'Vendas',
            value: fmtInteger(s.vendas),
            note: 'fechado ganho + boleto pago',
            color: STAGE_COLOR.vendas,
          },
          {
            label: 'Perdidos',
            value: fmtInteger(s.perdidos.count),
            note: s.total > 0 ? `${pct(s.perdidos.share)} dos leads` : undefined,
            color: STAGE_COLOR.perdidos,
          },
          {
            label: 'Investimento em mídia',
            value: spend == null ? '—' : fmtCurrency(Math.round(spend)).replace(/,00$/, ''),
            note: spend == null ? 'Meta indisponível agora' : 'Meta Ads',
          },
          {
            label: 'Custo por venda',
            value:
              custoVenda == null ? '—' : fmtCurrency(Math.round(custoVenda)).replace(/,00$/, ''),
            note: 'investimento ÷ vendas',
          },
        ]}
      />
      <TopCreatives rows={creatives} />
      <RecentTable rows={rows} />
      <p className="max-w-[75ch] text-muted-foreground text-xs leading-relaxed">
        {period
          ? `Leads que entraram no CRM entre ${periodLabel(period)}`
          : 'Todos os leads do CRM'}
        , na etapa em que estão agora. Vendas = Fechado ganho + Boleto pago; o valor das vendas
        considera o volume ×3 que retorna para a operação. Volume em negociação soma o valor das
        propostas em cotação e negociação. CRM atualizado em{' '}
        <span className="tabular">
          {new Date(snapshot.generatedAt).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
        .
      </p>
    </>
  );
}

function TopBarSkeleton() {
  return (
    <div className="flex flex-col gap-5 pb-2">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-11 w-[30rem] max-w-full rounded-full" />
    </div>
  );
}

function BodySkeleton() {
  return (
    <>
      <Skeleton className="h-[30rem] rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </>
  );
}
