import type { CreativeRow } from '@/lib/creatives';
import { fmtCurrency, fmtInteger, fmtPercent } from '@/lib/format';

const brl = (v: number | null) =>
  v == null ? '—' : fmtCurrency(Math.round(v)).replace(/,00$/, '');

/**
 * Os 3 anúncios que mais trouxeram leads no período. Um container só, com os
 * criativos lado a lado separados por fio 1px (sem card dentro de card).
 */
export function TopCreatives({ rows }: { rows: CreativeRow[] | null }) {
  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-6 sm:px-6">
      <h2 className="mb-5 font-display font-semibold text-foreground text-lg tracking-tight">
        Criativos com melhor desempenho
      </h2>
      {rows == null ? (
        <p className="py-8 text-center text-muted-foreground text-sm">
          Dados da Meta indisponíveis agora.
        </p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground text-sm">
          Nenhum anúncio veiculado neste período.
        </p>
      ) : (
        <ol className="grid gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border">
          {rows.map((c, i) => (
            <li key={c.id} className="flex flex-col gap-4 md:px-6 md:first:pl-0 md:last:pr-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-secondary">
                {c.imageUrl ? (
                  // biome-ignore lint/performance/noImgElement: imagem externa (fbcdn), fora do next/image
                  <img
                    src={c.imageUrl}
                    alt={`Criativo: ${c.name}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground text-sm">
                    sem imagem
                  </span>
                )}
                <span className="tabular absolute top-2 left-2 inline-flex size-8 items-center justify-center rounded-md bg-background font-display font-semibold text-foreground">
                  {i + 1}º
                </span>
              </div>
              <p
                className="line-clamp-2 min-h-[2.5rem] font-medium text-foreground text-sm leading-snug"
                title={c.name}
              >
                {c.name}
              </p>
              <dl className="grid grid-cols-3 gap-2">
                <div>
                  <dt className="text-muted-foreground text-xs">Leads</dt>
                  <dd className="tabular font-display font-semibold text-2xl text-foreground">
                    {fmtInteger(c.leads)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">CPL</dt>
                  <dd className="tabular font-display font-semibold text-2xl text-foreground">
                    {brl(c.cpl)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Investido</dt>
                  <dd className="tabular font-display font-semibold text-2xl text-foreground">
                    {brl(c.spend)}
                  </dd>
                </div>
              </dl>
              <p className="tabular -mt-2 text-muted-foreground text-xs">
                CTR {fmtPercent(c.ctr)} · {fmtInteger(c.clicks)} cliques
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
