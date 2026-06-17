import { differenceInDays, format, subDays } from 'date-fns';

export type Period = { since: string; until: string };

const fmt = (d: Date): string => format(d, 'yyyy-MM-dd');

/**
 * Default current period: last 30 complete days (yesterday inclusive, going back 30d).
 * Excludes today since Meta's stats are still settling for the current day.
 */
export function defaultCurrentPeriod(today: Date = new Date()): Period {
  const until = subDays(today, 1);
  const since = subDays(until, 29);
  return { since: fmt(since), until: fmt(until) };
}

/**
 * Given a current period, derive the prior window of the same length immediately preceding.
 */
export function priorPeriod(current: Period): Period {
  const sinceDate = new Date(`${current.since}T00:00:00Z`);
  const untilDate = new Date(`${current.until}T00:00:00Z`);
  const lengthDays = differenceInDays(untilDate, sinceDate) + 1;
  const priorUntil = subDays(sinceDate, 1);
  const priorSince = subDays(priorUntil, lengthDays - 1);
  return { since: fmt(priorSince), until: fmt(priorUntil) };
}

export function parsePeriodFromSearchParams(
  params: { since?: string; until?: string } | URLSearchParams,
): Period {
  const since = params instanceof URLSearchParams ? params.get('since') : params.since;
  const until = params instanceof URLSearchParams ? params.get('until') : params.until;
  if (since && until && /^\d{4}-\d{2}-\d{2}$/.test(since) && /^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return { since, until };
  }
  return defaultCurrentPeriod();
}

export function periodLabel(p: Period): string {
  const since = new Date(`${p.since}T00:00:00`);
  const until = new Date(`${p.until}T00:00:00`);
  return `${format(since, 'dd/MM/yyyy')} – ${format(until, 'dd/MM/yyyy')}`;
}
