'use client';

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fmtCompact,
  fmtCurrency,
  fmtDecimal,
  fmtDelta,
  fmtInteger,
  fmtMultiplier,
  fmtPercent,
} from '@/lib/format';
import { deltaPct, type KpiSet } from '@/lib/kpi-calc';
import { cn } from '@/lib/utils';

export type InsightsTableRow = {
  id: string;
  name: string;
  current: KpiSet;
  prior: KpiSet | null;
};

type ColumnKey =
  | 'name'
  | 'spend'
  | 'impressions'
  | 'reach'
  | 'frequency'
  | 'clicks'
  | 'ctr'
  | 'cpc'
  | 'cpm'
  | 'leads'
  | 'cpl'
  | 'convRate'
  | 'revenue'
  | 'roas'
  | 'roi';

type Column = {
  key: ColumnKey;
  label: string;
  align?: 'left' | 'right';
  format?: 'currency' | 'integer' | 'decimal' | 'percent' | 'multiplier' | 'compact';
  sortAccessor?: (r: InsightsTableRow) => number | null;
};

const COLUMNS: Column[] = [
  { key: 'name', label: 'Nome', align: 'left' },
  { key: 'spend', label: 'Investimento', format: 'currency', sortAccessor: (r) => r.current.spend },
  {
    key: 'impressions',
    label: 'Impr.',
    format: 'compact',
    sortAccessor: (r) => r.current.impressions,
  },
  { key: 'reach', label: 'Alcance', format: 'compact', sortAccessor: (r) => r.current.reach },
  { key: 'frequency', label: 'Freq.', format: 'decimal', sortAccessor: (r) => r.current.frequency },
  { key: 'clicks', label: 'Cliques', format: 'integer', sortAccessor: (r) => r.current.clicks },
  { key: 'ctr', label: 'CTR', format: 'percent', sortAccessor: (r) => r.current.ctr },
  { key: 'cpc', label: 'CPC', format: 'currency', sortAccessor: (r) => r.current.cpc },
  { key: 'cpm', label: 'CPM', format: 'currency', sortAccessor: (r) => r.current.cpm },
  { key: 'leads', label: 'Conv.', format: 'integer', sortAccessor: (r) => r.current.leads },
  { key: 'cpl', label: 'CPL', format: 'currency', sortAccessor: (r) => r.current.cpl },
  {
    key: 'convRate',
    label: 'Tx Conv.',
    format: 'percent',
    sortAccessor: (r) => r.current.convRate,
  },
  { key: 'revenue', label: 'Receita', format: 'currency', sortAccessor: (r) => r.current.revenue },
  { key: 'roas', label: 'ROAS', format: 'multiplier', sortAccessor: (r) => r.current.roas },
  { key: 'roi', label: 'ROI', format: 'percent', sortAccessor: (r) => roiAsPercent(r.current.roi) },
];

const formatters = {
  currency: fmtCurrency,
  integer: fmtInteger,
  decimal: fmtDecimal,
  percent: fmtPercent,
  multiplier: fmtMultiplier,
  compact: fmtCompact,
};

function roiAsPercent(roi: number | null): number | null {
  return roi == null ? null : roi * 100;
}

export function InsightsTable({ rows }: { rows: InsightsTableRow[] }) {
  const [sortKey, setSortKey] = useState<ColumnKey>('spend');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (!col) return rows;
    if (sortKey === 'name') {
      const list = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      return direction === 'asc' ? list : list.reverse();
    }
    const accessor = col.sortAccessor;
    if (!accessor) return rows;
    return [...rows].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return direction === 'asc' ? av - bv : bv - av;
    });
  }, [rows, sortKey, direction]);

  const toggleSort = (key: ColumnKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
        Sem dados no período. Tente um intervalo mais amplo.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                aria-sort={
                  sortKey === col.key ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
                }
                className={cn(
                  'h-11 cursor-pointer select-none whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground',
                  'label !tracking-[0.06em]',
                  col.align === 'left' ? 'sticky left-0 z-10 bg-card text-left' : 'text-right',
                )}
                onClick={() => toggleSort(col.key)}
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1',
                    col.align !== 'left' && 'flex-row-reverse',
                  )}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} direction={direction} />
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow
              key={row.id}
              className="group border-border transition-colors duration-150 hover:bg-secondary"
            >
              <TableCell className="sticky left-0 z-10 max-w-[280px] truncate bg-card font-medium text-foreground group-hover:bg-secondary">
                {row.name}
              </TableCell>
              {COLUMNS.slice(1).map((col) => (
                <TableCell key={col.key} className="text-right tabular align-middle">
                  <ValueCell row={row} col={col} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ValueCell({ row, col }: { row: InsightsTableRow; col: Column }) {
  if (!col.sortAccessor || !col.format) return null;
  const current = col.sortAccessor(row);
  const priorVal =
    row.prior == null
      ? null
      : col.key === 'roi'
        ? roiAsPercent(row.prior.roi)
        : ((row.prior[col.key as keyof KpiSet] as number | null | undefined) ?? null);
  const delta = deltaPct(current, priorVal);
  const fn = formatters[col.format];
  const direction = delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  return (
    <div className="flex flex-col items-end gap-0.5 leading-tight">
      <span className="text-foreground">{fn(current)}</span>
      {delta != null && (
        <span
          className={cn(
            'text-[11px] tabular',
            direction === 'up' && 'delta-up',
            direction === 'down' && 'delta-down',
            direction === 'flat' && 'delta-flat',
          )}
        >
          {fmtDelta(delta)}
        </span>
      )}
    </div>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active)
    return <ChevronsUpDown className="size-3 text-muted-foreground/60" aria-hidden="true" />;
  return direction === 'asc' ? (
    <ArrowUp className="size-3 text-foreground" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3 text-foreground" aria-hidden="true" />
  );
}
