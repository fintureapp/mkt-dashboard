import { Suspense } from 'react';
import { ConsorcioTabs } from '@/components/consorcio-tabs';
import { KpiCard } from '@/components/kpi-card';
import { TrendChart, type TrendPoint } from '@/components/trend-chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  aggregate,
  type ConsorcioLead,
  type ConsorcioSnapshot,
  eachDay,
  effectiveLeadsPeriod,
  fetchConsorcioSpend,
  leadsByDay,
  leadsInPeriod,
  loadConsorcioSnapshot,
  type WhatsappBreakdown,
  whatsappBreakdown,
} from '@/lib/consorcio';
import { fmtCurrency, fmtInteger } from '@/lib/format';
import { parsePeriodFromSearchParams, periodLabel, priorPeriod } from '@/lib/period';

type SP = Promise<{ since?: string; until?: string }>;

export default function ConsorcioPage({ searchParams }: { searchParams: SP }) {
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
  const prior = priorPeriod(current);
  const isDefault = !sp.since && !sp.until;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
          Consórcio
        </h1>
        <p className="text-muted-foreground text-sm">
          Simulador e CRM
          <span className="mx-2 text-muted-foreground/50">·</span>
          {isDefault ? 'Últimos 30 dias' : periodLabel(current)}
          <span className="mx-2 text-muted-foreground/50">vs</span>
          {periodLabel(prior)}
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
          O coletor ainda não publicou o snapshot das listas do SharePoint. Assim que rodar, os
          leads aparecem aqui.
        </p>
      </div>
    );
  }

  const [spend, priorSpend] = await Promise.all([
    fetchConsorcioSpend(current),
    fetchConsorcioSpend(prior),
  ]);

  const cur = aggregate(snapshot.leads, current);
  const prev = aggregate(snapshot.leads, prior);

  const cpl = spend && cur.count > 0 ? spend.total / cur.count : null;
  const priorCpl = priorSpend && prev.count > 0 ? priorSpend.total / prev.count : null;

  const byDay = leadsByDay(snapshot.leads, current);
  const trend: TrendPoint[] = eachDay(current).map((date) => ({
    date,
    spend: spend?.daily[date] ?? 0,
    conversions: byDay[date] ?? 0,
  }));

  const rows = leadsInPeriod(snapshot.leads, current).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || ''),
  );

  return (
    <div className="flex flex-col gap-8">
      {/* KPIs do período */}
      <section
        aria-label="Indicadores do período"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <KpiCard
          label="Simulações"
          value={cur.count || null}
          prior={prev.count || null}
          format="integer"
          hint="uma por lead do simulador"
        />
        <KpiCard
          label="Volume provisionado"
          value={cur.creditoTotal || null}
          prior={prev.creditoTotal || null}
          format="currency"
          hint={
            cur.acimaDoTeto > 0
              ? `soma do crédito simulado · ${cur.acimaDoTeto} fora do teto`
              : 'soma do crédito simulado'
          }
        />
        <KpiCard
          label="CPL"
          value={cpl}
          prior={priorCpl}
          format="currency"
          hint={spend ? 'investimento ÷ leads' : 'gasto da Meta indisponível'}
        />
        <KpiCard
          label="Investimento"
          value={spend ? spend.total || null : null}
          prior={priorSpend ? priorSpend.total || null : null}
          format="currency"
          hint="campanha de consórcio · Meta"
        />
      </section>

      {/* Da simulação à conversa */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Da simulação à conversa
          </h2>
          <span className="text-muted-foreground text-xs">
            telefone cruzado com a inbox de Consórcio
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MiniStat
            label="Deixaram contato"
            value={fmtInteger(cur.comContato)}
            hint={pct(cur.comContato, cur.count)}
          />
          <MiniStat
            label="Abriram o WhatsApp"
            value={fmtInteger(cur.conversaram)}
            hint={pct(cur.conversaram, cur.comContato) ?? 'de quem deixou contato'}
          />
          <MiniStat
            label="Trocaram mensagens"
            value={fmtInteger(cur.engajaram)}
            hint={pct(cur.engajaram, cur.conversaram) ?? 'além da mensagem pronta'}
          />
          <MiniStat
            label="Crédito mediano"
            value={cur.ticketMediano != null ? fmtCurrency(cur.ticketMediano) : '—'}
            hint="metade simulou acima disso"
          />
          <MiniStat
            label="Mexeram no valor"
            value={fmtInteger(cur.personalizados)}
            hint={pct(cur.personalizados, cur.count) ?? 'não aceitaram o padrão'}
          />
        </div>
        <WhatsappSplit rows={whatsappBreakdown(snapshot.leads, current)} total={cur.count} />
      </section>

      {/* Tendência: leads x investimento por dia */}
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

      {/* Split por tipo de bem */}
      {cur.byTipo.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Por tipo de bem
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cur.byTipo.map((t) => (
              <div
                key={t.tipo}
                className="flex flex-col gap-1 rounded-lg border border-border bg-card p-5"
              >
                <span className="label">{t.tipo}</span>
                <span className="font-display font-semibold text-2xl text-foreground tabular tracking-tight">
                  {fmtCurrency(t.credito)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {t.count} {t.count === 1 ? 'lead' : 'leads'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabela de leads */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-semibold text-foreground text-lg tracking-tight">
            Leads do período
          </h2>
          <span className="text-muted-foreground text-xs">
            {rows.length} {rows.length === 1 ? 'lead' : 'leads'}
          </span>
        </div>
        <LeadsTable rows={rows} />
      </section>

      <SnapshotFooter snapshot={snapshot} spendAvailable={spend != null} />
    </div>
  );
}

function LeadsTable({ rows }: { rows: ConsorcioLead[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
        Sem leads no período. Tente um intervalo mais amplo.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="label h-11 whitespace-nowrap text-muted-foreground">
              Data
            </TableHead>
            <TableHead className="label h-11 whitespace-nowrap text-muted-foreground">
              Nome
            </TableHead>
            <TableHead className="label h-11 whitespace-nowrap text-muted-foreground">
              Contato
            </TableHead>
            <TableHead className="label h-11 whitespace-nowrap text-muted-foreground">
              Tipo
            </TableHead>
            <TableHead className="label h-11 whitespace-nowrap text-right text-muted-foreground">
              Crédito
            </TableHead>
            <TableHead className="label h-11 whitespace-nowrap text-right text-muted-foreground">
              Parcela
            </TableHead>
            <TableHead className="label h-11 whitespace-nowrap text-muted-foreground">
              WhatsApp
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => (
            <TableRow key={l.leadId || `${l.email}-${l.createdAt}`} className="border-border">
              <TableCell className="whitespace-nowrap tabular text-muted-foreground">
                {shortDate(l.createdAt)}
              </TableCell>
              <TableCell className="max-w-[200px] truncate font-medium text-foreground">
                {l.nome || <span className="text-muted-foreground italic">sem contato</span>}
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-muted-foreground">
                <span className="block truncate">{l.email || '—'}</span>
                <span className="block truncate text-xs">{l.telefone}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {l.tipo || '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular text-foreground">
                {l.credito > 0 ? fmtCurrency(l.credito) : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular text-muted-foreground">
                {l.parcela > 0 ? fmtCurrency(l.parcela) : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {WHATSAPP_CELL[l.whatsapp.status]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SnapshotFooter({
  snapshot,
  spendAvailable,
}: {
  snapshot: ConsorcioSnapshot;
  spendAvailable: boolean;
}) {
  const when = snapshot.generatedAt
    ? new Date(snapshot.generatedAt).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';
  const c = snapshot.contagens;
  return (
    <p className="text-muted-foreground/80 text-xs">
      Listas do SharePoint do simulador · atualizadas em <span className="tabular">{when}</span>
      {c?.simulacoes != null ? (
        <>
          {' '}
          · {c.simulacoes} simulações no total, {c.comContato ?? 0} com dados de contato
        </>
      ) : null}
      {snapshot.chatwoot?.executado === false ? (
        <> · cruzamento com o WhatsApp não executado nesta coleta</>
      ) : null}
      {snapshot.note ? <> · {snapshot.note}</> : null}
      {!spendAvailable ? (
        <> · gasto da Meta indisponível (token sem acesso à conta do consórcio)</>
      ) : null}
    </p>
  );
}

/** Participação de uma contagem sobre outra, como texto curto. Null se não há base. */
function pct(part: number, whole: number): string | null {
  if (whole <= 0) return null;
  return `${Math.round((part / whole) * 100)}% do período`;
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string | null }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-5">
      <span className="label">{label}</span>
      <span className="font-display font-semibold text-2xl text-foreground tabular tracking-tight">
        {value}
      </span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );
}

/** Rótulo curto de cada situação de WhatsApp, para a coluna da tabela. */
const WHATSAPP_CELL: Record<ConsorcioLead['whatsapp']['status'], string> = {
  engajou: 'Trocou mensagens',
  conversou: 'Só a mensagem pronta',
  contatado: 'Sem resposta',
  sem_conversa: 'No CRM, sem conversa',
  nao_encontrado: 'Não está no CRM',
  telefone_invalido: 'Telefone ilegível',
  sem_telefone: '—',
  desconhecido: '—',
};

/**
 * Distribuição dos leads do período por situação de WhatsApp, em barra
 * proporcional. Serve para ver de relance onde o funil trava: quantos nem
 * deixaram contato, quantos deixaram e nunca apareceram no CRM.
 */
function WhatsappSplit({ rows, total }: { rows: WhatsappBreakdown; total: number }) {
  if (rows.length === 0 || total <= 0) return null;
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
      {rows.map((r) => (
        <li key={r.status} className="flex items-center gap-3 text-sm">
          <span className="w-56 shrink-0 truncate text-muted-foreground">{r.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full bg-primary/70"
              style={{ width: `${Math.max(2, Math.round((r.count / total) * 100))}%` }}
            />
          </span>
          <span className="w-10 shrink-0 text-right tabular text-foreground">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

function shortDate(iso: string): string {
  const d = (iso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '—';
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48 sm:h-10" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-56 rounded-md" />
    </header>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </section>
      <Skeleton className="h-80 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
