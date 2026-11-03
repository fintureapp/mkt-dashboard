import type { ConsorcioKanbanColumn, ConsorcioLead } from '@/lib/consorcio';
import { fmtCurrency, fmtInteger } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Paleta earthy do funil — as colunas ciclam por estas cores, na ordem do board. */
const COLUMN_COLORS = [
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-1)',
];

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

function fmtEntryDate(iso: string): string {
  const d = (iso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return dateFmt.format(date);
}

/** Quando o "nome" vier vazio, formata o telefone (dígitos) como número BR legível. */
function fmtContact(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (!digits) return s;
  let cc = '';
  let rest = digits;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    cc = '+55 ';
    rest = digits.slice(2);
  }
  if (rest.length === 10 || rest.length === 11) {
    const ddd = rest.slice(0, 2);
    const num = rest.slice(2);
    const mid =
      num.length === 9
        ? `${num.slice(0, 5)}-${num.slice(5)}`
        : `${num.slice(0, 4)}-${num.slice(4)}`;
    return `${cc}(${ddd}) ${mid}`;
  }
  return s;
}

function KanbanCard({ lead }: { lead: ConsorcioLead }) {
  const hasValue = lead.credito > 0;
  const when = fmtEntryDate(lead.createdAt);
  const title = lead.nome.trim() || fmtContact(lead.telefone) || 'sem nome';
  const tags = [
    lead.tipo.trim(),
    lead.classificacao.trim(),
    lead.prazo > 0 ? `${lead.prazo} meses` : '',
  ].filter(Boolean);
  return (
    <article className="flex flex-col gap-1.5 rounded-md border border-border bg-card p-3">
      <span className="truncate font-medium text-foreground text-sm" title={title}>
        {title}
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            'font-display font-semibold tabular tracking-tight',
            hasValue ? 'text-base text-foreground' : 'text-muted-foreground text-sm',
          )}
        >
          {hasValue ? fmtCurrency(lead.credito) : 'sem valor'}
        </span>
        {when && <span className="shrink-0 text-muted-foreground text-xs tabular">{when}</span>}
      </div>
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 text-muted-foreground/70 text-xs">
          {tags.map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-muted-foreground/40">
                  ·
                </span>
              )}
              <span className="truncate">{t}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function KanbanColumnView({ column, color }: { column: ConsorcioKanbanColumn; color: string }) {
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
            {fmtInteger(column.count)} {column.count === 1 ? 'lead' : 'leads'}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-foreground/80 tabular">{fmtCurrency(column.credito)}</span>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        {column.leads.length > 0 ? (
          column.leads.map((lead) => (
            <KanbanCard key={lead.leadId || `${lead.email}-${lead.createdAt}`} lead={lead} />
          ))
        ) : (
          <p className="rounded-md border border-border border-dashed px-3 py-6 text-center text-muted-foreground text-xs">
            Nenhum lead no período
          </p>
        )}
      </div>
    </section>
  );
}

export function ConsorcioKanban({ columns }: { columns: ConsorcioKanbanColumn[] }) {
  if (columns.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-10 text-center">
        <p className="font-medium text-foreground">Nenhum lead no período selecionado</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Ajuste o período no seletor acima para ver os leads por etapa do funil.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-min gap-4">
          {columns.map((column, i) => (
            <KanbanColumnView
              key={column.stage}
              column={column}
              color={COLUMN_COLORS[i % COLUMN_COLORS.length]}
            />
          ))}
        </div>
      </div>
      <p className="text-muted-foreground/60 text-xs">
        Enquanto a planilha do consultor não entra no BI, as colunas são a etapa que os dados
        sustentam: se o lead deixou contato e se chegou a{' '}
        <span className="text-foreground/80">conversar no WhatsApp</span>. Quando a coluna{' '}
        <span className="text-foreground/80">Etapa do funil</span> for integrada, ela passa a
        mandar.
      </p>
    </div>
  );
}
