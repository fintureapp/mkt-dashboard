import type { MediaTotals } from './ceo-data.ts';
import type { CreativeRow } from './creatives.ts';
import type { CeoSummary } from './plano-saude.ts';

/**
 * O que a IA recebe para o diagnóstico: só números agregados e nomes de anúncio.
 * Nenhum dado de lead (nome, telefone, id) entra aqui, por construção: as
 * entradas são o resumo do funil, os totais da Meta e o ranking de criativos.
 */
export type DiagnosisInput = {
  periodo: string;
  comparacao: string | null;
  funil: ReturnType<typeof funnelBlock>;
  funilAnterior: ReturnType<typeof funnelBlock> | null;
  midia: ReturnType<typeof mediaBlock> | null;
  midiaAnterior: ReturnType<typeof mediaBlock> | null;
  custoPorVenda: number | null;
  criativos: Array<{
    anuncio: string;
    investimento: number;
    leads: number;
    cpl: number | null;
    ctrPct: number;
  }> | null;
};

const r2 = (v: number) => Math.round(v * 100) / 100;
const pct = (v: number | null) => (v == null ? null : r2(v * 100));

function funnelBlock(s: CeoSummary) {
  return {
    leads: s.total,
    etapas: s.stages.map((st) => ({
      etapa: st.label,
      leads: st.count,
      pctDosLeads: pct(st.share),
      valorR$: Math.round(st.value),
    })),
    perdidos: s.perdidos.count,
    pctPerdidos: pct(s.perdidos.share),
    emAndamento: s.emAndamento,
    vendas: s.vendas,
    valorVendasR$: Math.round(s.vendasValor),
    conversaoEmVendasPct: pct(s.conversao),
    volumeEmNegociacaoR$: Math.round(s.volumeNegociacao),
    propostasEmNegociacao: s.emNegociacao,
    propostasComValorInformado: s.comValor,
  };
}

function mediaBlock(m: MediaTotals) {
  return {
    investimentoR$: r2(m.spend),
    leadsMeta: m.leads,
    cplR$: m.cpl == null ? null : r2(m.cpl),
    ctrPct: r2(m.ctr),
    cpmR$: r2(m.cpm),
    cliques: m.clicks,
    impressoes: m.impressions,
  };
}

export function buildDiagnosisInput(args: {
  periodo: string;
  comparacao: string | null;
  current: CeoSummary;
  prior: CeoSummary | null;
  media: MediaTotals | null;
  mediaPrior: MediaTotals | null;
  creatives: CreativeRow[] | null;
}): DiagnosisInput {
  const { current, media } = args;
  return {
    periodo: args.periodo,
    comparacao: args.comparacao,
    funil: funnelBlock(current),
    funilAnterior: args.prior ? funnelBlock(args.prior) : null,
    midia: media ? mediaBlock(media) : null,
    midiaAnterior: args.mediaPrior ? mediaBlock(args.mediaPrior) : null,
    custoPorVenda: media && current.vendas > 0 ? r2(media.spend / current.vendas) : null,
    criativos:
      args.creatives?.map((c) => ({
        anuncio: c.name,
        investimento: r2(c.spend),
        leads: c.leads,
        cpl: c.cpl == null ? null : r2(c.cpl),
        ctrPct: r2(c.ctr),
      })) ?? null,
  };
}
