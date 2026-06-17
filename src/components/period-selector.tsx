'use client';

import { format, startOfMonth, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Preset = {
  label: string;
  value: string;
  build: () => { since: Date; until: Date };
};

const PRESETS: Preset[] = [
  {
    label: 'Últimos 7 dias',
    value: '7d',
    build: () => ({ since: subDays(new Date(), 7), until: subDays(new Date(), 1) }),
  },
  {
    label: 'Últimos 14 dias',
    value: '14d',
    build: () => ({ since: subDays(new Date(), 14), until: subDays(new Date(), 1) }),
  },
  {
    label: 'Últimos 30 dias',
    value: '30d',
    build: () => ({ since: subDays(new Date(), 30), until: subDays(new Date(), 1) }),
  },
  {
    label: 'Últimos 90 dias',
    value: '90d',
    build: () => ({ since: subDays(new Date(), 90), until: subDays(new Date(), 1) }),
  },
  {
    label: 'Mês atual',
    value: 'mtd',
    build: () => ({ since: startOfMonth(new Date()), until: subDays(new Date(), 1) }),
  },
  {
    label: 'Mês anterior',
    value: 'lastm',
    build: () => {
      const start = startOfMonth(subMonths(new Date(), 1));
      const end = subDays(startOfMonth(new Date()), 1);
      return { since: start, until: end };
    },
  },
];

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
const fmtBR = (d: Date) => format(d, 'dd/MM/yy');

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const since = searchParams.get('since');
  const until = searchParams.get('until');

  const currentLabel =
    since && until ? `${fmtBR(new Date(since))} – ${fmtBR(new Date(until))}` : 'Últimos 30 dias';

  const apply = (sinceDate: Date, untilDate: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('since', fmt(sinceDate));
    params.set('until', fmt(untilDate));
    startTransition(() => router.replace(`?${params.toString()}`, { scroll: false }));
    setOpen(false);
  };

  const handleRange = (range: DateRange | undefined) => {
    if (range?.from && range.to) {
      apply(range.from, range.to);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 tabular"
          aria-label={`Selecionar período. Atual: ${currentLabel}`}
        >
          <CalendarIcon />
          <span className="font-medium">{currentLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto p-0 shadow-floating border-border bg-popover"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="border-border border-b p-2 sm:min-w-44 sm:border-r sm:border-b-0">
            <ul className="flex flex-col gap-0.5">
              {PRESETS.map((p) => (
                <li key={p.value}>
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-left text-sm transition-colors duration-150',
                      'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      'focus-visible:bg-secondary focus-visible:text-foreground focus-visible:outline-none',
                    )}
                    onClick={() => {
                      const { since: s, until: u } = p.build();
                      apply(s, u);
                    }}
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={{
                from: since ? new Date(since) : undefined,
                to: until ? new Date(until) : undefined,
              }}
              onSelect={handleRange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
