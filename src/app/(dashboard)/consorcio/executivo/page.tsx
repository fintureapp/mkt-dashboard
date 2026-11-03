import { Suspense } from 'react';
import { BestCreatives } from '@/components/best-creatives';
import { ConsorcioTabs } from '@/components/consorcio-tabs';
import { FunnelBoard, type FunnelStep } from '@/components/funnel-board';
import { KpiCard } from '@/components/kpi-card';
import { TrendChart, type TrendPoint } from '@/components/trend-chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  consorcioFunnel,
  eachDay,
  effectiveLeadsPeriod,
  fetchConsorcioCreatives,
  fetchConsorcioSpend,
  leadsByDay,
  loadConsorcioSnapshot,
} from '@/lib/consorcio';
import { parsePeriodFromSearchParams, periodLabel, priorPeriod } from '@/lib/period';

type SP = Promise<{ since?: string; until?: string }>;

export default function ConsorcioExecutivoPage({ searchParams }: { searchParams: SP }) {
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
  const current = effectiveLeadsPeriod(parsePeriodFromSearchParams(sp));
  const isDefault = !sp.since && !sp.until;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Consórcio
        </h1>
        <p className="text-muted-foreground text-sm">
          Resumo executivo
          <span className="mx-2 text-muted-foreground/50">·</span>
          {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
        </p>
      </div>
      <ConsorcioTabs />
    </header>
  );
}

async function Report({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const current = effectiveLeadsPeriod(parsePeriodFromSearchParams(sp));
  const prior = priorPeriod(current);

  const snapshot = await loadConsorcioSnapshot();
  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-10 text-center">
        <p className="font-medium text-foreground">Aguardando a primeira coleta</p>
        <p className="mt-1 text-muted-foreground text-sm">
          O coletor ainda não publicou o snapshot das listas do SharePoint. Assim que rodar, o
          resumo aparece aqui.
        </p>
      </div>
    );
  }

  const [spend, priorSpend, creatives] = await Promise.all([
    fetchConsorcioSpend(current),
    fetchConsorcioSpend(prior),
    fetchConsorcioCreatives(current),
  ]);

  const funnel = consorcioFunnel(snapshot.leads, current);
  const funnelPrior = consorcioFunnel(snapshot.leads, prior);
  const cpl = spend && funnel.total > 0 ? spend.total / funnel.total : null;
  const cplPrior =
    priorSpend && funnelPrior.total > 0 ? priorSpend.total / funnelPrior.total : null;
  const custoConversa = spend && funnel.conversaram > 0 ? spend.total / funnel.conversaram : null;
  const custoConversaPrior =
    priorSpend && funnelPrior.conversaram > 0 ? priorSpend.total / funnelPrior.conversaram : null;
  const custoContato = spend && funnel.comContato > 0 ? spend.total / funnel.comContato : null;
  const custoContatoPrior =
    priorSpend && funnelPrior.comContato > 0 ? priorSpend.total / funnelPrior.comContato : null;

  const byDay = leadsByDay(snapshot.leads, current);
  const trend: TrendPoint[] = eachDay(current).map((date) => ({
    date,
    spend: spend?.daily[date] ?? 0,
    conversions: byDay[date] ?? 0,
  }));

  const funnelSteps: FunnelStep[] = [
    { label: 'Simulações', count: funnel.total, prior: funnelPrior.total || null },
    {
      label: 'Deixaram contato',
      count: funnel.comContato,
      prior: funnelPrior.comContato || null,
      hint: 'nome, e-mail e telefone',
    },
    {
      label: 'Abriram o WhatsApp',
      count: funnel.conversaram,
      prior: funnelPrior.conversaram || null,
      hint: 'clicaram no botão e a conversa existe',
    },
    {
      label: 'Trocaram mensagens',
      count: funnel.engajaram,
      prior: funnelPrior.engajaram || null,
      hint: 'escreveram além da mensagem pronta',
    },
    {
      label: 'Volume provisionado',
      count: 0,
      kind: 'currency',
      amount: funnel.volumeProvisionado,
      hint: 'crédito simulado no período',
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Funil comercial (planilha) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Funil comercial
          </h2>
          <span className="text-muted-foreground text-xs">
            simulador e CRM · período selecionado
          </span>
        </div>
        <FunnelBoard steps={funnelSteps} />
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
            value={spend ? spend.total || null : null}
            prior={priorSpend ? priorSpend.total || null : null}
            format="currency"
            hint="campanha de consórcio"
          />
          <KpiCard
            label="CPL"
            value={cpl}
            prior={cplPrior}
            format="currency"
            hint={spend ? 'investimento ÷ leads' : 'gasto da Meta indisponível'}
          />
          <KpiCard
            label="Custo por conversa"
            value={custoConversa}
            prior={custoConversaPrior}
            format="currency"
            hint="investimento ÷ leads que abriram o WhatsApp"
          />
          <KpiCard
            label="Custo por contato"
            value={custoContato}
            prior={custoContatoPrior}
            format="currency"
            hint="investimento ÷ leads que deixaram telefone"
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
        <BestCreatives rows={creatives} showLeads={false} />
      </section>

      <p className="text-muted-foreground/80 text-xs">
        Funil: listas do SharePoint do simulador, cruzadas pelo telefone com a inbox de Consórcio do
        Chatwoot · Mídia e criativos: Meta no período
        {snapshot.generatedAt ? (
          <>
            {' '}
            · dados atualizados em{' '}
            <span className="tabular">
              {new Date(snapshot.generatedAt).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          </>
        ) : null}
        {!spend ? <> · gasto da Meta indisponível (token sem acesso à conta do consórcio)</> : null}
      </p>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48 sm:h-10" />
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
