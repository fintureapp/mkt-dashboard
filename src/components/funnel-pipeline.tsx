import { ArrowDown } from 'lucide-react';
import { DeltaPill } from '@/components/kpi-card';
import { fmtCurrency, fmtInteger } from '@/lib/format';
import { deltaPct } from '@/lib/kpi-calc';

export type FunnelStage = {
  label: string;
  /** Valor em R$ da etapa (define a largura da barra). */
  value: number;
  /** Quantidade de cards na etapa. */
  count: number;
  /** Valor da etapa no período anterior (para o delta). */
  prior: number | null;
  /** Token de cor (ex.: 'var(--color-chart-2)'). */
  color: string;
};

function dir(delta: number | null): 'up' | 'down' | 'flat' {
  return delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
}

/**
 * Funil de valor do Plano de Saúde: cada etapa é uma barra cuja largura é proporcional
 * ao R$ que ela carrega. A estrela é o pipeline em dinheiro, não a contagem.
 *
 * Honestidade do dado: as três etapas são fotos do funil AGORA (snapshot), não uma coorte
 * que flui de uma para a outra — as razões entre etapas são indicativas.
 */
export function FunnelPipeline({ stages }: { stages: FunnelStage[] }) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6 sm:p-8">
      {stages.map((stage, i) => {
        const pct = (stage.value / maxValue) * 100;
        const delta = deltaPct(stage.value, stage.prior);
        const prev = stages[i - 1];
        const ratioOfPrev =
          prev && prev.value > 0 ? Math.round((stage.value / prev.value) * 100) : null;

        return (
          <div key={stage.label} className="flex flex-col gap-3">
            {i > 0 && (
              <div className="flex items-center gap-1.5 pl-0.5 text-muted-foreground/70 text-xs tabular">
                <ArrowDown className="size-3" strokeWidth={2} aria-hidden="true" />
                {ratioOfPrev != null
                  ? `${ratioOfPrev}% do valor da etapa anterior`
                  : 'etapa anterior sem valor para comparar'}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="label">{stage.label}</span>
                  <span className="text-muted-foreground text-xs tabular">
                    {fmtInteger(stage.count)} {stage.count === 1 ? 'card' : 'cards'}
                  </span>
                </div>
                {delta != null && <DeltaPill direction={dir(delta)} delta={delta} />}
              </div>

              <div className="flex items-center gap-4">
                <div className="h-10 flex-1 overflow-hidden rounded-md bg-secondary/30 sm:h-12">
                  <div
                    className="h-full rounded-md transition-[width] duration-500"
                    style={{
                      width: `${pct}%`,
                      minWidth: stage.value > 0 ? '0.5rem' : 0,
                      background: stage.color,
                    }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right font-display font-semibold text-foreground text-xl tabular tracking-tight sm:w-36 sm:text-2xl">
                  {fmtCurrency(stage.value)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-muted-foreground/60 text-xs">
        Valores por etapa do funil no snapshot atual — não é uma coorte que flui; as razões entre
        etapas são indicativas.
      </p>
    </div>
  );
}
