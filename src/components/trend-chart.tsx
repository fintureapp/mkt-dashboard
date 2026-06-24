'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtCompact, fmtCurrency, fmtInteger } from '@/lib/format';

export type TrendPoint = {
  date: string; // ISO date
  spend: number;
  conversions: number;
  revenue?: number;
};

type LineMetric = 'conversions' | 'revenue';

// Tokens from DESIGN.md — kept inline for Recharts SVG attrs
const COLOR = {
  chart1: '#ea622d', // Finture Sienna — investimento
  chart2: '#f8b96b', // Peach Ribbon — conversões
  border: '#3a3938', // Hairline Sepia
  axis: '#b0a89c', // Warm Ash
  card: '#232220', // Soft Ink
  hover: '#2a292880', // Lifted Charcoal w/ alpha
} as const;

export function TrendChart({
  data,
  lineMetric = 'conversions',
  height = 'h-80',
}: {
  data: TrendPoint[];
  lineMetric?: LineMetric;
  height?: string;
}) {
  const lineLabel = lineMetric === 'revenue' ? 'Receita' : 'Conversões';

  if (data.length === 0) {
    return (
      <div
        className={`flex ${height} items-center justify-center rounded-lg border border-border bg-card text-muted-foreground text-sm`}
        role="img"
        aria-label="Sem dados de tendência no período selecionado"
      >
        Sem dados para exibir no período
      </div>
    );
  }

  return (
    <div
      className={`${height} rounded-lg border border-border bg-card p-4`}
      role="img"
      aria-label={`Gráfico de tendência diária: investimento e ${lineLabel.toLowerCase()}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={COLOR.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            stroke={COLOR.axis}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickMargin={8}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v: number) => fmtCompact(v) ?? ''}
            stroke={COLOR.axis}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={56}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v: number) => fmtCompact(v) ?? ''}
            stroke={COLOR.axis}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={48}
          />
          <Tooltip
            cursor={{ fill: COLOR.hover }}
            contentStyle={{
              background: COLOR.card,
              border: `1px solid ${COLOR.border}`,
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              fontVariantNumeric: 'tabular-nums',
              boxShadow: 'var(--shadow-floating)',
            }}
            labelStyle={{ color: COLOR.axis, fontWeight: 500, marginBottom: 4 }}
            itemStyle={{ color: '#f8f1e7' }}
            labelFormatter={(label) => shortDate(String(label ?? ''))}
            formatter={(value, name) => {
              const num = typeof value === 'number' ? value : Number(value);
              if (name === 'spend') return [fmtCurrency(num), 'Investimento'];
              if (name === 'revenue') return [fmtCurrency(num), 'Receita'];
              if (name === 'conversions') return [fmtInteger(num), 'Conversões'];
              return [String(value ?? ''), String(name ?? '')];
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="spend"
            fill={COLOR.chart1}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={lineMetric}
            stroke={COLOR.chart2}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: COLOR.chart2, stroke: COLOR.card, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortDate(d: string): string {
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
