const LOCALE = 'pt-BR';

const currency = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const decimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function fmtCurrency(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return currency.format(v);
}

export function fmtInteger(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return integer.format(v);
}

export function fmtDecimal(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return decimal.format(v);
}

export function fmtPercent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${percent.format(v)}%`;
}

export function fmtCompact(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return compact.format(v);
}

export function fmtDelta(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${decimal.format(v)}%`;
}

export function fmtMultiplier(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${decimal.format(v)}x`;
}
