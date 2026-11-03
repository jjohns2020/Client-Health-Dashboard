import type { ValueFormat } from '../data/types';

const LOCALE = 'en-US';

/** Locale-formatted number, unrounded (matches `Number#toLocaleString`). */
export const int = (v: number) => v.toLocaleString(LOCALE);

/** Rounded, locale-formatted count. */
export const count = (v: number) => Math.round(v).toLocaleString(LOCALE);

/** Compact dollars: $1.2M / $485K / $422. */
export const money = (v: number) =>
  v >= 1e6
    ? '$' + (v / 1e6).toFixed(1) + 'M'
    : v >= 1e3
      ? '$' + Math.round(v / 1e3).toLocaleString(LOCALE) + 'K'
      : '$' + Math.round(v).toLocaleString(LOCALE);

/** Whole dollars: $485,089. */
export const moneyFull = (v: number) => '$' + Math.round(v).toLocaleString(LOCALE);

/** Percent with one decimal from a 0–1 ratio. */
export const pct = (v: number) => (v * 100).toFixed(1) + '%';

export const formatValue = (v: number, t: ValueFormat) => (t === '$' ? money(v) : t === 'p' ? pct(v) : count(v));

/** Chart-axis formatter for a workbook value format. */
export const chartFormatter = (f: ValueFormat): ((v: number) => string) =>
  f === 'p' ? (v) => (v * 100).toFixed(1) + '%' : f === '$' ? money : count;

/** "x.x : 1" ROI ratio label. */
export const ratio = (v: number) => v.toFixed(1) + ' : 1';
