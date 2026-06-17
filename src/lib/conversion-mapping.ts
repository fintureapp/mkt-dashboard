/**
 * Action types from Meta Insights API that count as leads, conversions, and revenue
 * — calibrated for the Criteria Seguros account (act_535285117171536).
 *
 * Configuração descoberta via scripts/discover-actions.ts em 2026-05-04:
 *
 * - A conta usa **Meta Lead Ads** (formulário nativo dentro do Facebook/Instagram),
 *   não Pixel + landing page externa.
 * - Os action_types `lead`, `onsite_conversion.lead_grouped`, e os
 *   `offsite_*_add_meta_leads` retornam o MESMO valor (são views/dimensões do
 *   mesmo evento). Somar daria contagem duplicada — usar só UM canônico.
 * - Escolhemos `onsite_conversion.lead_grouped` pois é o evento "grouped" oficial
 *   do Meta Lead Ads e o que aparece nos relatórios padrão da plataforma.
 * - **Não há eventos de Purchase com valor** — Pixel/CAPI não está configurado
 *   para revenue. ROAS, Receita e ROI ficam como "—" até que alguém configure
 *   o evento `Purchase` com `value` em BRL no Pixel/CAPI.
 *
 * Re-rode `npx tsx scripts/discover-actions.ts` periodicamente para detectar
 * mudanças (ex: campanha de conversão off-platform sendo ativada, Pixel
 * passando a enviar Purchase, etc.).
 */
export const LEAD_ACTION_TYPES: readonly string[] = ['onsite_conversion.lead_grouped'];

export const PURCHASE_ACTION_TYPES: readonly string[] = [
  'offsite_conversion.fb_pixel_purchase',
  'purchase',
  'onsite_web_purchase',
];

type ActionEntry = { action_type: string; value: number };

export function sumActionsByType(
  actions: readonly ActionEntry[] | undefined,
  types: readonly string[],
): number {
  if (!actions?.length) return 0;
  const set = new Set(types);
  let total = 0;
  for (const a of actions) {
    if (set.has(a.action_type)) total += a.value;
  }
  return total;
}
