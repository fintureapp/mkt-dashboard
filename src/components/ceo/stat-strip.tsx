import { cn } from '@/lib/utils';

export type Stat = {
  label: string;
  value: string;
  note?: string;
  /** Cor do número (hex da paleta); padrão = texto primário. */
  color?: string;
};

/**
 * Faixa única de indicadores separados por fios de 1px, em vez de cinco cards
 * soltos: lê como uma linha de placar, não como grade de caixinhas.
 */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <section
      aria-label="Indicadores"
      className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 lg:grid-cols-5"
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            'flex flex-col gap-1.5 border-border px-5 py-5',
            // fios internos: topo em todas menos a 1ª linha, esquerda em todas menos a 1ª coluna
            i > 0 && 'border-l',
            i >= 2 && 'max-sm:border-t',
            i % 2 === 0 && 'max-sm:border-l-0',
            i >= 3 && 'sm:max-lg:border-t',
            i % 3 === 0 && 'sm:max-lg:border-l-0',
          )}
        >
          <p className="text-muted-foreground text-sm">{s.label}</p>
          <p
            className="tabular font-display font-semibold text-3xl text-foreground leading-none tracking-tight sm:text-4xl"
            style={s.color ? { color: s.color } : undefined}
          >
            {s.value}
          </p>
          {s.note ? <p className="text-muted-foreground text-xs sm:text-sm">{s.note}</p> : null}
        </div>
      ))}
    </section>
  );
}
