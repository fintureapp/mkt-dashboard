'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';

const STROKE = '#f8b96b'; // Peach Ribbon — matches TrendChart conversions line

export function Sparkline({
  data,
  ariaLabel,
}: {
  data: readonly number[];
  ariaLabel: string;
}) {
  if (data.length < 2) return null;

  const series = data.map((v, i) => ({ i, v }));

  return (
    <div className="h-6 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={STROKE}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
