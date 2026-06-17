import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import {
  fmtCurrency,
  fmtDecimal,
  fmtDelta,
  fmtInteger,
  fmtMultiplier,
  fmtPercent,
} from '@/lib/format';
import { deltaPct } from '@/lib/kpi-calc';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/sparkline';

type Format = 'currency' | 'integer' | 'decimal' | 'percent' | 'multiplier';
type Variant = 'standard' | 'hero';
type SparklineProp = { data: readonly number[]; ariaLabel: string };

const formatters: Record<Format, (v: number | null | undefined) => string> = {
  currency: fmtCurrency,
  integer: fmtInteger,
  decimal: fmtDecimal,
  percent: fmtPercent,
  multiplier: fmtMultiplier,
};

export function KpiCard({
  label,
  value,
  prior,
  format = 'integer',
  hint,
  variant = 'standard',
  sparkline,
}: {
  label: string;
  value: number | null | undefined;
  prior: number | null | undefined;
  format?: Format;
  hint?: string;
  variant?: Variant;
  sparkline?: SparklineProp;
}) {
  const fmtValue = formatters[format];
  const delta = deltaPct(value ?? null, prior ?? null);
  const direction = delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const isHero = variant === 'hero';
  const showSparkline = isHero && sparkline && sparkline.data.length >= 2;

  return (
    <article
      className={cn(
        'flex flex-col rounded-lg border border-border bg-card',
        isHero ? 'gap-2 p-6' : 'gap-1.5 p-5',
      )}
    >
      <span className="label">{label}</span>
      <span
        className={cn(
          'font-display font-semibold tabular tracking-tight text-foreground',
          isHero ? 'text-[2.75rem] leading-[1.05] sm:text-5xl' : 'text-3xl leading-[1.05]',
        )}
      >
        {fmtValue(value ?? null)}
      </span>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <DeltaPill direction={direction} delta={delta} />
        <span className="text-muted-foreground">vs período anterior</span>
      </div>
      {showSparkline && (
        <div className="mt-1">
          <Sparkline data={sparkline.data} ariaLabel={sparkline.ariaLabel} />
        </div>
      )}
      {hint && <span className="mt-0.5 text-muted-foreground/80 text-xs italic">{hint}</span>}
    </article>
  );
}

function DeltaPill({
  direction,
  delta,
}: {
  direction: 'up' | 'down' | 'flat';
  delta: number | null;
}) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const colorClass =
    direction === 'up' ? 'delta-up' : direction === 'down' ? 'delta-down' : 'delta-flat';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium tabular',
        colorClass,
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} aria-hidden="true" />
      {fmtDelta(delta)}
    </span>
  );
}
