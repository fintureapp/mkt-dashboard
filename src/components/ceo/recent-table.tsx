import { fmtCurrency } from '@/lib/format';
import type { RecentMove } from '@/lib/plano-saude';
import { STAGE_COLOR } from './hero-funnel';

const dt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const d = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
});

function fmtWhen(iso: string, withTime: boolean): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return (withTime ? dt : d).format(date).replace(',', '');
}

/** Últimas movimentações do CRM. Só primeiro nome: a página é pública. */
export function RecentTable({ rows }: { rows: RecentMove[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-6 sm:px-6">
      <h2 className="mb-4 font-display font-semibold text-foreground text-lg tracking-tight">
        Últimas movimentações
      </h2>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground text-sm">
          Nenhum lead entrou no CRM neste período.
        </p>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="text-left text-muted-foreground text-xs">
                <th className="pb-2 font-normal">Lead</th>
                <th className="pb-2 font-normal">Etapa</th>
                <th className="pb-2 text-right font-normal">Valor</th>
                <th className="pb-2 text-right font-normal">Entrada</th>
                <th className="pb-2 text-right font-normal">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: lista estática, sem id público (id de conversa não é exposto)
                <tr key={i}>
                  <td className="py-3 pr-3 font-medium text-foreground">{r.firstName}</td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: STAGE_COLOR[r.stageKey] }}
                      />
                      {r.stage}
                    </span>
                  </td>
                  <td className="tabular py-3 pr-3 text-right text-foreground">
                    {r.value > 0 ? fmtCurrency(r.value) : '—'}
                  </td>
                  <td className="tabular py-3 pr-3 text-right text-muted-foreground">
                    {fmtWhen(r.entrada, false)}
                  </td>
                  <td className="tabular py-3 text-right text-muted-foreground">
                    {fmtWhen(r.ultima, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
