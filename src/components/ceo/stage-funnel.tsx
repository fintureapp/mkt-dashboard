'use client';

import { FunnelChart, type FunnelStage } from '@/components/ui/funnel-chart';
import { fmtInteger } from '@/lib/format';
import type { FunnelStep, FunnelStepKey } from '@/lib/plano-saude';

/** Mesmas cores das etapas no resto da página (DESIGN.md). */
const STEP_COLOR: Record<FunnelStepKey, string> = {
  total: '#b0a89c',
  atendidos: '#6fb1a1',
  cotacao: '#f8b96b',
  negociacao: '#ea622d',
  vendas: '#b7c68b',
};

const fmtPct = (p: number) =>
  `${p.toLocaleString('pt-BR', { maximumFractionDigits: p > 0 && p < 10 ? 1 : 0 })}%`;

/**
 * Funil acumulado com a conversão de cada etapa sobre a anterior na pílula.
 * Horizontal a partir de `md`; no celular vira vertical (5 colunas não cabem).
 * O SVG é decorativo: a lista `sr-only` carrega os números para leitores de tela.
 */
export function StageFunnel({ steps }: { steps: FunnelStep[] }) {
  const data: FunnelStage[] = steps.map((s) => ({
    label: s.label,
    value: s.count,
    displayValue: fmtInteger(s.count),
    color: STEP_COLOR[s.key],
  }));
  const common = {
    data,
    layers: 3,
    percentMode: 'previous' as const,
    formatPercentage: fmtPct,
    edges: 'curved' as const,
  };

  return (
    <div>
      <ol className="sr-only">
        {steps.map((s) => (
          <li key={s.key}>
            {s.label}: {fmtInteger(s.count)}
            {s.fromPrev != null ? `, ${fmtPct(s.fromPrev * 100)} da etapa anterior` : ''}
          </li>
        ))}
      </ol>
      <div aria-hidden="true">
        <div className="hidden md:block">
          <FunnelChart {...common} orientation="horizontal" style={{ aspectRatio: '3 / 1' }} />
        </div>
        <div className="md:hidden">
          <FunnelChart {...common} orientation="vertical" style={{ aspectRatio: '1 / 1.4' }} />
        </div>
      </div>
    </div>
  );
}
