import type { CreativeRow } from '@/lib/creatives';
import { fmtCurrency, fmtInteger, fmtPercent } from '@/lib/format';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground/70 text-[0.7rem] uppercase tracking-wide">
        {label}
      </span>
      <span className="font-medium text-foreground text-sm tabular">{value}</span>
    </div>
  );
}

/**
 * "Criativos que melhor performaram": cartões dos anúncios de topo. Mostra o gasto
 * e o CTR sempre; leads e CPL só quando a conta reporta o evento de lead (Lead Ads
 * do Plano de Saúde) — para o Consórcio (Pixel/CAPI na LP) esses campos vêm zerados
 * e a ênfase fica em gasto e CTR.
 */
export function BestCreatives({
  rows,
  showLeads = true,
}: {
  rows: CreativeRow[] | null;
  showLeads?: boolean;
}) {
  if (rows == null) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
        Gasto da Meta indisponível — o token não alcança a conta de anúncios deste segmento.
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card p-8 text-center text-muted-foreground text-sm">
        Nenhum anúncio com gasto no período selecionado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((c, i) => (
        <article
          key={c.id}
          className="flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="flex items-start gap-3 p-5 pb-0">
            {c.imageUrl ? (
              // biome-ignore lint/performance/noImgElement: imagem externa (fbcdn) fora do next/image
              <img
                src={c.imageUrl}
                alt={`Criativo: ${c.name}`}
                loading="lazy"
                className="size-14 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-secondary/40 text-[0.6rem] text-muted-foreground/60">
                sem img
              </span>
            )}
            <div className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary font-display font-semibold text-foreground text-xs tabular">
                {i + 1}
              </span>
              <span
                className="line-clamp-3 font-medium text-foreground text-sm leading-snug"
                title={c.name}
              >
                {c.name}
              </span>
            </div>
          </div>
          <div className="mx-5 mb-5 grid grid-cols-2 gap-3 border-border border-t pt-3">
            <Metric label="Investimento" value={fmtCurrency(c.spend)} />
            <Metric label="CTR" value={fmtPercent(c.ctr)} />
            {showLeads && (
              <>
                <Metric label="Leads" value={fmtInteger(c.leads)} />
                <Metric label="CPL" value={c.cpl != null ? fmtCurrency(c.cpl) : '—'} />
              </>
            )}
            {!showLeads && (
              <>
                <Metric label="Cliques" value={fmtInteger(c.clicks)} />
                <Metric label="Impressões" value={fmtInteger(c.impressions)} />
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
