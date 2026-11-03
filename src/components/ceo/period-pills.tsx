'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { CEO_PRESETS, type CeoPreset } from '@/lib/ceo-period';
import { cn } from '@/lib/utils';

type Props = {
  preset: CeoPreset | null;
  since: string | null;
  until: string | null;
};

/**
 * Atalhos de período (Tudo / Hoje / 7 dias / 30 dias) + intervalo livre "de/até".
 * Tudo vive na URL (`?p=` ou `?since&until`), então o link compartilhado abre no
 * mesmo recorte que o CEO está vendo.
 */
export function PeriodPills({ preset, since, until }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (query: string) =>
    startTransition(() => router.replace(query ? `/?${query}` : '/', { scroll: false }));

  const onDate = (field: 'since' | 'until', value: string) => {
    const next = { since: since ?? '', until: until ?? '', [field]: value };
    if (next.since && next.until) {
      go(new URLSearchParams(next).toString());
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 transition-opacity duration-150',
        pending && 'opacity-60',
      )}
    >
      <fieldset className="flex rounded-full border border-border bg-card p-1">
        <legend className="sr-only">Período</legend>
        {CEO_PRESETS.map((p) => {
          const active = preset === p.value;
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={active}
              onClick={() => go(p.value === '30d' ? '' : `p=${p.value}`)}
              className={cn(
                'rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors duration-150',
                'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          );
        })}
      </fieldset>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <label className="flex items-center gap-2">
          de
          <input
            type="date"
            value={since ?? ''}
            max={until ?? undefined}
            onChange={(e) => onDate('since', e.target.value)}
            className="tabular h-9 rounded-md border border-border bg-card px-2.5 text-foreground text-sm [color-scheme:dark] focus-visible:border-primary focus-visible:outline-none"
          />
        </label>
        <label className="flex items-center gap-2">
          até
          <input
            type="date"
            value={until ?? ''}
            min={since ?? undefined}
            onChange={(e) => onDate('until', e.target.value)}
            className="tabular h-9 rounded-md border border-border bg-card px-2.5 text-foreground text-sm [color-scheme:dark] focus-visible:border-primary focus-visible:outline-none"
          />
        </label>
      </div>
    </div>
  );
}
