import { ArrowDown, ArrowRight } from 'lucide-react';
import { DeltaPill } from '@/components/kpi-card';
import { Sparkline } from '@/components/sparkline';
import { fmtCurrency, fmtMultiplier } from '@/lib/format';
import { deltaPct } from '@/lib/kpi-calc';
import { cn } from '@/lib/utils';

type Side = {
  label: string;
  value: number | null;
  prior: number | null;
  spark?: readonly number[];
  hint?: string;
};

function dir(delta: number | null): 'up' | 'down' | 'flat' {
  return delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
}

/**
 * O herói da Visão Geral: o par Investimento → Retorno, ligado pela razão de retorno.
 * Impacto vem de escala + espaço (dentro do DESIGN.md) — sem gradiente nem laranja
 * dominante. Pensado para leitura de 5s em projetor.
 */
export function HeroPair({
  spend,
  revenue,
  roas,
  roasPrior,
}: {
  spend: Side;
  revenue: Side;
  roas: number | null;
  roasPrior: number | null;
}) {
  const roasDelta = deltaPct(roas, roasPrior);

  return (
    <article
      aria-label="Investimento e retorno do período"
      className="grid grid-cols-1 items-center gap-6 rounded-lg border border-border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-8"
    >
      <HeroSide side={spend} />

      {/* Elo: Retorno — a razão que liga gasto a retorno */}
      <div className="flex items-center justify-center gap-3 lg:flex-col lg:gap-1.5">
        <ArrowDown
          className="size-5 text-muted-foreground/50 lg:hidden"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="flex flex-col items-center gap-0.5">
          <span className="label">Retorno</span>
          <span className="font-display font-semibold text-2xl text-foreground tabular tracking-tight sm:text-3xl">
            {fmtMultiplier(roas)}
          </span>
          {roasDelta != null && <DeltaPill direction={dir(roasDelta)} delta={roasDelta} />}
        </div>
        <ArrowRight
          className="hidden size-5 text-muted-foreground/50 lg:block"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <HeroSide side={revenue} align="end" />
    </article>
  );
}

function HeroSide({ side, align = 'start' }: { side: Side; align?: 'start' | 'end' }) {
  const delta = deltaPct(side.value, side.prior);
  const hasSpark = side.spark && side.spark.length >= 2;
  return (
    <div className={cn('flex flex-col gap-2', align === 'end' && 'lg:items-end lg:text-right')}>
      <span className="label">{side.label}</span>
      <span className="font-display font-semibold text-4xl text-foreground tabular leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
        {fmtCurrency(side.value)}
      </span>
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs',
          align === 'end' && 'lg:justify-end',
        )}
      >
        <DeltaPill direction={dir(delta)} delta={delta} />
        <span className="text-muted-foreground">vs período anterior</span>
      </div>
      {hasSpark && (
        <div className="mt-1 w-full max-w-[260px] lg:max-w-[320px]">
          <Sparkline data={side.spark ?? []} ariaLabel={`Tendência diária de ${side.label}`} />
        </div>
      )}
      {side.hint && (
        <span className="mt-0.5 text-muted-foreground/80 text-xs italic">{side.hint}</span>
      )}
    </div>
  );
}
