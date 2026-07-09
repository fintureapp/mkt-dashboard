import { fmtCurrency, fmtInteger } from '@/lib/format';
import type { KanbanColumn, PlanoBucket, PlanoCard } from '@/lib/plano-saude';
import { cn } from '@/lib/utils';

/** Cor do estágio herdada do bucket — mesma paleta earthy do funil de valor. */
const BUCKET_COLOR: Record<PlanoBucket, string> = {
  cotacoes: 'var(--color-chart-2)',
  quentes: 'var(--color-chart-3)',
  fechamento: 'var(--color-chart-4)',
};

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

function fmtEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return dateFmt.format(d);
}

/**
 * O `name` do card costuma ser um telefone (ex.: "5521998818281"). Quando for só
 * dígitos, formata como número BR legível; caso contrário, mostra o texto como está.
 */
function fmtContact(name: string): string {
  const raw = (name || '').trim();
  if (!raw) return 'sem contato';
  if (!/^\d+$/.test(raw)) return raw;

  let cc = '';
  let rest = raw;
  if ((raw.length === 12 || raw.length === 13) && raw.startsWith('55')) {
    cc = '+55 ';
    rest = raw.slice(2);
  }
  if (rest.length === 10 || rest.length === 11) {
    const ddd = rest.slice(0, 2);
    const num = rest.slice(2);
    const mid = num.length === 9 ? `${num.slice(0, 5)}-${num.slice(5)}` : `${num.slice(0, 4)}-${num.slice(4)}`;
    return `${cc}(${ddd}) ${mid}`;
  }
  return raw;
}

function KanbanCard({ card }: { card: PlanoCard }) {
  const hasValue = card.value > 0;
  const when = fmtEventDate(card.eventDate);
  const taskCount = card.tasks?.length ?? 0;
  return (
    <article className="flex flex-col gap-1.5 rounded-md border border-border bg-card p-3">
      <span className="truncate font-medium text-foreground text-sm" title={card.name}>
        {fmtContact(card.name)}
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            'font-display font-semibold tabular tracking-tight',
            hasValue ? 'text-base text-foreground' : 'text-muted-foreground text-sm',
          )}
        >
          {hasValue ? fmtCurrency(card.value) : 'sem valor'}
        </span>
        {when && <span className="shrink-0 text-muted-foreground text-xs tabular">{when}</span>}
      </div>
      {taskCount > 0 && (
        <span className="text-muted-foreground/70 text-xs">
          {fmtInteger(taskCount)} {taskCount === 1 ? 'tarefa' : 'tarefas'}
        </span>
      )}
    </article>
  );
}

function KanbanColumnView({ column }: { column: KanbanColumn }) {
  const color = column.bucket ? BUCKET_COLOR[column.bucket] : 'var(--color-muted-foreground)';
  return (
    <section className="flex w-72 shrink-0 flex-col gap-3">
      <header className="flex flex-col gap-1.5 border-border border-b pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden="true"
          />
          <h3 className="font-display font-semibold text-foreground text-sm leading-tight tracking-tight">
            {column.stage}
          </h3>
        </div>
        <div className="flex items-baseline gap-2 pl-4 text-xs">
          <span className="text-muted-foreground tabular">
            {fmtInteger(column.count)} {column.count === 1 ? 'card' : 'cards'}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-foreground/80 tabular">{fmtCurrency(column.value)}</span>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        {column.cards.length > 0 ? (
          column.cards.map((card) => <KanbanCard key={card.convId} card={card} />)
        ) : (
          <p className="rounded-md border border-border border-dashed px-3 py-6 text-center text-muted-foreground text-xs">
            Nenhum card no período
          </p>
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({ columns }: { columns: KanbanColumn[] }) {
  if (columns.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-10 text-center">
        <p className="font-medium text-foreground">Nenhum card no período selecionado</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Ajuste o período no seletor acima para ver os cards do funil.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-min gap-4">
          {columns.map((column) => (
            <KanbanColumnView key={column.stage} column={column} />
          ))}
        </div>
      </div>
      <p className="text-muted-foreground/60 text-xs">
        O quadro mostra os estágios com cards coletados pelo CRM. As contagens completas do funil,
        incluindo estágios sem detalhe de card, ficam na Visão Geral.
      </p>
    </div>
  );
}
