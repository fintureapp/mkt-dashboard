'use client';

/**
 * FunnelChart: funil em SVG com camadas e animação de entrada.
 * Adaptado do componente enviado pelo usuário (03/11/2026):
 * - `cn` do projeto e tokens Finture (sem `--chart-*` inexistentes);
 * - `percentMode="previous"`: a pílula mostra a conversão da etapa anterior;
 * - `formatPercentage` recebe `null` na 1ª etapa e a pílula some;
 * - tipografia do DESIGN.md (Space Grotesk + tabular nos números);
 * - molas sem overshoot (DESIGN.md proíbe bounce) e `prefers-reduced-motion`
 *   respeitado (sem crescimento nem stagger);
 * - divisão por zero protegida (1ª etapa com valor 0);
 * - altura do desenho 0.34 (era 0.44) para não encostar nos números.
 */

import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface FunnelStage {
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
}

export interface FunnelChartProps {
  data: FunnelStage[];
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  layers?: number;
  className?: string;
  style?: CSSProperties;
  showPercentage?: boolean;
  showValues?: boolean;
  showLabels?: boolean;
  /** 'first' = % do topo do funil; 'previous' = % da etapa anterior. */
  percentMode?: 'first' | 'previous';
  formatPercentage?: (pct: number) => string;
  formatValue?: (value: number) => string;
  staggerDelay?: number;
  gap?: number;
  edges?: 'curved' | 'straight';
}

const fmtPct = (p: number) => `${Math.round(p)}%`;
const fmtVal = (v: number) => v.toLocaleString('pt-BR');

// Amortecimento crítico ou acima: sem overshoot.
const springConfig = { stiffness: 120, damping: 24, mass: 1 };
const hoverSpring = { stiffness: 300, damping: 36 };

function hSegmentPath(
  normStart: number,
  normEnd: number,
  segW: number,
  H: number,
  layerScale: number,
  straight: boolean,
) {
  const my = H / 2;
  const h0 = normStart * H * 0.34 * layerScale;
  const h1 = normEnd * H * 0.34 * layerScale;
  if (straight) {
    return `M 0 ${my - h0} L ${segW} ${my - h1} L ${segW} ${my + h1} L 0 ${my + h0} Z`;
  }
  const cx = segW * 0.55;
  const top = `M 0 ${my - h0} C ${cx} ${my - h0}, ${segW - cx} ${my - h1}, ${segW} ${my - h1}`;
  const bot = `L ${segW} ${my + h1} C ${segW - cx} ${my + h1}, ${cx} ${my + h0}, 0 ${my + h0}`;
  return `${top} ${bot} Z`;
}

function vSegmentPath(
  normStart: number,
  normEnd: number,
  segH: number,
  W: number,
  layerScale: number,
  straight: boolean,
) {
  const mx = W / 2;
  const w0 = normStart * W * 0.34 * layerScale;
  const w1 = normEnd * W * 0.34 * layerScale;
  if (straight) {
    return `M ${mx - w0} 0 L ${mx - w1} ${segH} L ${mx + w1} ${segH} L ${mx + w0} 0 Z`;
  }
  const cy = segH * 0.55;
  const left = `M ${mx - w0} 0 C ${mx - w0} ${cy}, ${mx - w1} ${segH - cy}, ${mx - w1} ${segH}`;
  const right = `L ${mx + w1} ${segH} C ${mx + w1} ${segH - cy}, ${mx + w0} ${cy}, ${mx + w0} 0`;
  return `${left} ${right} Z`;
}

function Ring({
  d,
  color,
  opacity,
  hovered,
  ringIndex,
  totalRings,
  axis,
}: {
  d: string;
  color: string;
  opacity: number;
  hovered: boolean;
  ringIndex: number;
  totalRings: number;
  axis: 'x' | 'y';
}) {
  const extraScale = 1 + (ringIndex / Math.max(totalRings - 1, 1)) * 0.12;
  const scale = useSpring(1, hoverSpring);
  useEffect(() => {
    scale.set(hovered ? extraScale : 1);
  }, [hovered, scale, extraScale]);
  return (
    <motion.path
      d={d}
      fill={color}
      opacity={opacity}
      style={
        axis === 'y'
          ? { scaleY: scale, transformOrigin: 'center center' }
          : { scaleX: scale, transformOrigin: 'center center' }
      }
    />
  );
}

function Segment({
  index,
  normStart,
  normEnd,
  segLen,
  fullCross,
  color,
  layers,
  staggerDelay,
  hovered,
  dimmed,
  straight,
  horizontal,
  reduced,
}: {
  index: number;
  normStart: number;
  normEnd: number;
  segLen: number;
  fullCross: number;
  color: string;
  layers: number;
  staggerDelay: number;
  hovered: boolean;
  dimmed: boolean;
  straight: boolean;
  horizontal: boolean;
  reduced: boolean;
}) {
  const growProgress = useSpring(reduced ? 1 : 0, springConfig);
  const entranceScale = useTransform(growProgress, [0, 1], [0, 1]);
  const dimOpacity = useSpring(1, hoverSpring);

  useEffect(() => {
    dimOpacity.set(dimmed ? 0.4 : 1);
  }, [dimmed, dimOpacity]);

  useEffect(() => {
    if (reduced) {
      growProgress.jump(1);
      return;
    }
    const t = setTimeout(() => growProgress.set(1), index * staggerDelay * 1000);
    return () => clearTimeout(t);
  }, [growProgress, index, staggerDelay, reduced]);

  const rings = Array.from({ length: layers }, (_, l) => {
    const scale = 1 - (l / layers) * 0.35;
    const opacity = 0.18 + (l / (layers - 1 || 1)) * 0.65;
    return {
      d: horizontal
        ? hSegmentPath(normStart, normEnd, segLen, fullCross, scale, straight)
        : vSegmentPath(normStart, normEnd, segLen, fullCross, scale, straight),
      opacity,
    };
  });
  const w = horizontal ? segLen : fullCross;
  const h = horizontal ? fullCross : segLen;

  return (
    <motion.div
      className="pointer-events-none relative shrink-0 overflow-visible"
      style={{ width: w, height: h, zIndex: hovered ? 10 : 1, opacity: dimOpacity }}
    >
      <motion.div
        className="absolute inset-0 overflow-visible"
        style={{
          scaleX: entranceScale,
          scaleY: entranceScale,
          transformOrigin: horizontal ? 'left center' : 'center top',
        }}
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full overflow-visible"
          preserveAspectRatio="none"
          role="presentation"
          viewBox={`0 0 ${w} ${h}`}
        >
          {rings.map((r, i) => (
            <Ring
              axis={horizontal ? 'y' : 'x'}
              color={color}
              d={r.d}
              hovered={hovered}
              key={`ring-${r.opacity.toFixed(2)}`}
              opacity={r.opacity}
              ringIndex={i}
              totalRings={layers}
            />
          ))}
        </svg>
      </motion.div>
    </motion.div>
  );
}

function SegmentLabel({
  stage,
  pct,
  horizontal,
  showValues,
  showPercentage,
  showLabels,
  formatPercentage,
  formatValue,
  index,
  staggerDelay,
  reduced,
}: {
  stage: FunnelStage;
  pct: number | null;
  horizontal: boolean;
  showValues: boolean;
  showPercentage: boolean;
  showLabels: boolean;
  formatPercentage: (p: number) => string;
  formatValue: (v: number) => string;
  index: number;
  staggerDelay: number;
  reduced: boolean;
}) {
  const display = stage.displayValue ?? formatValue(stage.value);
  const valueEl = showValues && (
    <span className="tabular whitespace-nowrap font-display font-semibold text-2xl text-foreground sm:text-3xl">
      {display}
    </span>
  );
  const pctEl = showPercentage && pct != null && (
    <span className="tabular whitespace-nowrap rounded-full bg-foreground px-3 py-1 font-semibold text-background text-sm">
      {formatPercentage(pct)}
    </span>
  );
  const labelEl = showLabels && (
    <span className="whitespace-nowrap font-medium text-muted-foreground text-sm">
      {stage.label}
    </span>
  );

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={cn(
        'absolute inset-0 flex',
        horizontal ? 'flex-col items-center' : 'flex-row items-center',
      )}
      initial={{ opacity: reduced ? 1 : 0 }}
      transition={
        reduced ? { duration: 0 } : { delay: index * staggerDelay + 0.25, duration: 0.35, ease: 'easeOut' }
      }
    >
      {horizontal ? (
        <>
          <div className="flex h-[18%] items-end justify-center pb-1">{valueEl}</div>
          <div className="flex flex-1 items-center justify-center">{pctEl}</div>
          <div className="flex h-[18%] items-start justify-center pt-1">{labelEl}</div>
        </>
      ) : (
        <>
          <div className="flex w-[22%] items-center justify-end pr-2">{valueEl}</div>
          <div className="flex flex-1 items-center justify-center">{pctEl}</div>
          <div className="flex w-[22%] items-center justify-start pl-2">{labelEl}</div>
        </>
      )}
    </motion.div>
  );
}

export function FunnelChart({
  data,
  orientation = 'horizontal',
  color = 'var(--color-primary)',
  layers = 3,
  className,
  style,
  showPercentage = true,
  showValues = true,
  showLabels = true,
  percentMode = 'first',
  formatPercentage = fmtPct,
  formatValue = fmtVal,
  staggerDelay = 0.12,
  gap = 4,
  edges = 'curved',
}: FunnelChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [sz, setSz] = useState({ w: 0, h: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reduced = useReducedMotion() ?? false;

  const measure = useCallback(() => {
    if (!ref.current) return;
    const { width: w, height: h } = ref.current.getBoundingClientRect();
    if (w > 0 && h > 0) setSz({ w, h });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [measure]);

  const first = data[0];
  if (!first) return null;

  const max = first.value > 0 ? first.value : 1;
  const n = data.length;
  const norms = data.map((d) => d.value / max);
  const horizontal = orientation === 'horizontal';
  const { w: W, h: H } = sz;
  const totalGap = gap * (n - 1);
  const segW = (W - (horizontal ? totalGap : 0)) / n;
  const segH = (H - (horizontal ? 0 : totalGap)) / n;

  return (
    <div
      className={cn('relative w-full select-none overflow-visible', className)}
      ref={ref}
      style={{ aspectRatio: horizontal ? '2.2 / 1' : '1 / 1.8', ...style }}
    >
      {W > 0 && H > 0 && (
        <>
          <div
            className={cn(
              'absolute inset-0 flex overflow-visible',
              horizontal ? 'flex-row' : 'flex-col',
            )}
            style={{ gap }}
          >
            {data.map((stage, i) => (
              <Segment
                color={stage.color ?? color}
                dimmed={hoveredIndex !== null && hoveredIndex !== i}
                fullCross={horizontal ? H : W}
                horizontal={horizontal}
                hovered={hoveredIndex === i}
                index={i}
                key={stage.label}
                layers={layers}
                normEnd={norms[Math.min(i + 1, n - 1)] ?? 0}
                normStart={norms[i] ?? 0}
                reduced={reduced}
                segLen={horizontal ? segW : segH}
                staggerDelay={staggerDelay}
                straight={edges === 'straight'}
              />
            ))}
          </div>

          {data.map((stage, i) => {
            const prev = data[i - 1];
            const pct =
              percentMode === 'previous'
                ? prev && prev.value > 0
                  ? (stage.value / prev.value) * 100
                  : null
                : first.value > 0
                  ? (stage.value / first.value) * 100
                  : null;
            const posStyle: CSSProperties = horizontal
              ? { left: (segW + gap) * i, width: segW, top: 0, height: H }
              : { top: (segH + gap) * i, height: segH, left: 0, width: W };
            const isDimmed = hoveredIndex !== null && hoveredIndex !== i;
            return (
              <motion.div
                animate={{ opacity: isDimmed ? 0.4 : 1 }}
                className="absolute"
                key={`lbl-${stage.label}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ ...posStyle, zIndex: 20 }}
                transition={{ type: 'spring', ...hoverSpring }}
              >
                <SegmentLabel
                  formatPercentage={formatPercentage}
                  formatValue={formatValue}
                  horizontal={horizontal}
                  index={i}
                  pct={i === 0 && percentMode === 'previous' ? null : pct}
                  reduced={reduced}
                  showLabels={showLabels}
                  showPercentage={showPercentage}
                  showValues={showValues}
                  stage={stage}
                  staggerDelay={staggerDelay}
                />
              </motion.div>
            );
          })}
        </>
      )}
    </div>
  );
}

FunnelChart.displayName = 'FunnelChart';

export default FunnelChart;
