import { fmtCompactCurrency, fmtInteger } from '@/lib/format';
import { type CeoStageKey, type CeoSummary, ceoFunnel } from '@/lib/plano-saude';
import { StageFunnel } from './stage-funnel';

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
  const count = (k: CeoStageKey) => s.stages.find((x) => x.key === k)?.count ?? 0;
  const frios = count('frios');
  const novos = count('novos');
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

      <div className="mt-10">
        <StageFunnel steps={ceoFunnel(s)} />
        <p className="tabular mt-4 text-center text-muted-foreground text-sm">
          Cada etapa conta quem chegou nela ou passou dela; o percentual é sobre a etapa anterior.
          Fora do funil agora: {fmtInteger(frios)} {frios === 1 ? 'lead frio' : 'leads frios'} (sem
          resposta) e {fmtInteger(novos)} {novos === 1 ? 'novo lead' : 'novos leads'} ainda sem
          atendimento.
        </p>
      </div>
    </section>
  );
}
