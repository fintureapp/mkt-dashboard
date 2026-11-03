import { ArrowDown, ArrowRight } from 'lucide-react';
import { Fragment } from 'react';
import { DeltaPill } from '@/components/kpi-card';
import { fmtCurrency, fmtInteger } from '@/lib/format';
import { deltaPct } from '@/lib/kpi-calc';
import { cn } from '@/lib/utils';

export type FunnelStep = {
  label: string;
  count: number;
  /** Contagem no período anterior (para o delta). */
  prior?: number | null;
  /** Valor em R$ associado à etapa (opcional — ex.: crédito, fechado). */
  value?: number | null;
  /** Linha de apoio abaixo do número. */
  hint?: string;
  /**
   * 'count' (padrão) exibe a contagem e calcula a conversão da etapa anterior.
   * 'currency' exibe `amount` em R$ como número principal (ex.: "Volume
   * provisionado") — sem pílula de conversão, pois não é uma razão de contagens.
   */
  kind?: 'count' | 'currency';
  /** Valor em R$ exibido quando `kind === 'currency'`. */
  amount?: number;
};

function convRate(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round((curr / prev) * 100);
}

/**
 * Funil horizontal estilo "visão executiva": cada etapa é um cartão com o número
 * grande; entre as etapas, uma pílula mostra a taxa de conversão da etapa anterior.
 * Empilha na vertical no mobile (setas para baixo) e fica lado a lado no desktop.
 *
 * As contagens são uma foto do estágio atual do funil — as taxas entre etapas são
 * indicativas, não uma coorte fechada que flui de uma para a outra.
 */
export function FunnelBoard({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="flex flex-col items-stretch gap-2 lg:flex-row">
      {steps.map((step, i) => {
        const prev = steps[i - 1];
        const isCurrency = step.kind === 'currency';
        const rate = prev && !isCurrency ? convRate(step.count, prev.count) : null;
        const delta = isCurrency ? null : deltaPct(step.count, step.prior ?? null);
        const dir = delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
        const isFirst = i === 0;
        const texto = isCurrency ? fmtCurrency(step.amount ?? 0) : fmtInteger(step.count);

        return (
          <Fragment key={step.label}>
            {i > 0 && (
              <div
                className="flex shrink-0 items-center justify-center gap-1 lg:flex-col lg:justify-center"
                aria-hidden="true"
              >
                {isCurrency ? (
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 font-semibold text-muted-foreground text-xs">
                    R$
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-foreground px-2 py-1 font-semibold text-background text-xs tabular">
                    {rate != null ? `${rate}%` : '—'}
                  </span>
                )}
                <ArrowDown className="size-4 text-muted-foreground lg:hidden" strokeWidth={2} />
                <ArrowRight
                  className="hidden size-4 text-muted-foreground lg:block"
                  strokeWidth={2}
                />
              </div>
            )}

            <article
              className={cn(
                'flex flex-1 flex-col gap-1.5 rounded-lg border p-5',
                isFirst && 'border-primary/40 bg-primary/5',
                isCurrency && 'border-border bg-secondary/40',
                !isFirst && !isCurrency && 'border-border bg-card',
              )}
            >
              <span className="label">{step.label}</span>
              <span
                className={cn(
                  'font-display font-semibold text-foreground tabular leading-[1.05] tracking-tight',
                  // Valores longos (ex.: "R$ 14.320.000,00" numa etapa de 1/5 da
                  // largura) estouram o cartão no tamanho padrão.
                  texto.length > 13 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
                )}
              >
                {texto}
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                {isCurrency ? (
                  <span className="text-muted-foreground/60">
                    {step.hint ?? 'em Fechado ganho'}
                  </span>
                ) : delta != null ? (
                  <DeltaPill direction={dir} delta={delta} />
                ) : (
                  <span className="text-muted-foreground/60">sem base anterior</span>
                )}
              </div>
              {!isCurrency && step.value != null && step.value > 0 && (
                <span className="text-foreground/70 text-xs tabular">
                  {fmtCurrency(step.value)}
                </span>
              )}
              {!isCurrency && step.hint && (
                <span className="text-muted-foreground/80 text-xs italic">{step.hint}</span>
              )}
            </article>
          </Fragment>
        );
      })}
    </div>
  );
}
