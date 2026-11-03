import { fmtCompactCurrency, fmtInteger } from '@/lib/format';
import type { CeoStageKey, CeoSummary } from '@/lib/plano-saude';

/**
 * Cor de cada etapa: o topo do funil é neutro (cinza quente), o trabalho do time
 * esquenta de teal a sienna, e venda é olive. Só tons da paleta do DESIGN.md.
 */
export const STAGE_COLOR: Record<CeoStageKey | 'perdidos', string> = {
  novos: '#b0a89c',
  frios: '#6f675d',
  atendimento: '#6fb1a1',
  cotacao: '#f8b96b',
  negociacao: '#ea622d',
  vendas: '#b7c68b',
  perdidos: '#c26d74',
};

const pct = (v: number) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: v > 0 && v < 0.1 ? 1 : 0 })}%`;

export function HeroFunnel({ s }: { s: CeoSummary }) {
  return (
    <section
      aria-label="Resumo do funil"
      className="rounded-2xl border border-border bg-card px-5 py-6 sm:px-8 sm:py-8"
    >
      <div className="grid gap-8 sm:grid-cols-[1fr_1.4fr_1fr] sm:items-end">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">Leads que chegaram</p>
          <p className="tabular font-display font-semibold text-5xl text-foreground leading-none tracking-tight sm:text-6xl">
            {fmtInteger(s.total)}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">entraram no CRM</p>
        </div>

        <div className="flex flex-col gap-1 sm:items-center sm:text-center">
          <p className="text-muted-foreground text-sm">Volume em negociação</p>
          <p className="tabular font-display font-semibold text-5xl text-primary leading-none tracking-tight sm:text-6xl lg:text-7xl">
            {fmtCompactCurrency(s.volumeNegociacao)}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            {fmtInteger(s.comValor)} de {fmtInteger(s.emNegociacao)} propostas com valor informado
          </p>
        </div>

        <div className="flex flex-col gap-1 sm:items-end sm:text-right">
          <p className="text-muted-foreground text-sm">Conversão em vendas</p>
          <p
            className="tabular font-display font-semibold text-5xl leading-none tracking-tight sm:text-6xl"
            style={{ color: STAGE_COLOR.vendas }}
          >
            {s.conversao == null ? '—' : pct(s.conversao)}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            {fmtInteger(s.vendas)} {s.vendas === 1 ? 'venda' : 'vendas'} ·{' '}
            {fmtCompactCurrency(s.vendasValor)}
          </p>
        </div>
      </div>

      <ol className="mt-10 flex flex-col gap-3" aria-label="Onde os leads estão agora">
        {s.stages.map((st) => (
          <li
            key={st.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_minmax(0,1fr)_3.5rem]"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm sm:text-base">{st.label}</p>
              <p className="tabular text-muted-foreground text-xs sm:text-sm">
                {st.value > 0 ? `${fmtCompactCurrency(st.value)} · ` : ''}
                {pct(st.share)} dos leads
              </p>
            </div>
            <div className="order-last col-span-2 h-3 overflow-hidden rounded-full bg-secondary sm:order-none sm:col-span-1 sm:h-9 sm:rounded-lg">
              <div
                className="h-full rounded-[inherit]"
                style={{
                  width: `${Math.max(st.share * 100, st.count > 0 ? 1.5 : 0)}%`,
                  backgroundColor: STAGE_COLOR[st.key],
                }}
              />
            </div>
            <p className="tabular text-right font-display font-semibold text-foreground text-xl sm:text-2xl">
              {fmtInteger(st.count)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
