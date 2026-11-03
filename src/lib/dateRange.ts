/** Date filtering over the shared monthly calendar (indexes into `months`). */

export type DatePreset = 'all' | '3' | '6' | '12' | 'ytd25' | 'y24' | 'custom';

export const DATE_PRESETS: [DatePreset, string][] = [
  ['all', 'All months'],
  ['3', 'Last 3 months'],
  ['6', 'Last 6 months'],
  ['12', 'Last 12 months'],
  ['ytd25', '2025 year to date'],
  ['y24', 'Calendar 2024'],
  ['custom', 'Custom…'],
];

export interface MonthRange {
  fI: number;
  tI: number;
}

/** Applies a preset. `custom` leaves the range unchanged. `lastIndex` is the final month index. */
export function applyPreset(preset: DatePreset, current: MonthRange, lastIndex: number): MonthRange {
  const L = lastIndex;
  if (preset === 'all') return { fI: 0, tI: L };
  if (preset === 'ytd25') return { fI: 12, tI: L };
  if (preset === 'y24') return { fI: 0, tI: 11 };
  if (preset === 'custom') return current;
  return { tI: L, fI: Math.max(0, L - Number(preset) + 1) };
}

export function setFrom(fI: number, current: MonthRange): MonthRange {
  return { fI, tI: fI > current.tI ? fI : current.tI };
}

export function setTo(tI: number, current: MonthRange): MonthRange {
  return { tI, fI: tI < current.fI ? tI : current.fI };
}

export const rangeLabel = (months: string[], r: MonthRange) => months[r.fI] + ' – ' + months[r.tI];

/** True when a load/review spanning month indexes [s, e] overlaps the selected range. */
export const overlaps = (s: number, e: number, r: MonthRange) => e >= r.fI && s <= r.tI;

const KEEP_UNTRUNCATED = new Set(['yoy', 'flags', 'known']);

/**
 * Cuts every numeric monthly series to end at the selected "to" month.
 * Year-over-year blocks, flags and notes are workbook period data and are left untouched.
 */
export function truncateToMonth<T>(o: T, tI: number): T {
  if (Array.isArray(o)) return (typeof o[0] === 'number' ? o.slice(0, tI + 1) : o) as T;
  if (o && typeof o === 'object') {
    const r: Record<string, unknown> = {};
    for (const k in o) {
      const v = (o as Record<string, unknown>)[k];
      r[k] = KEEP_UNTRUNCATED.has(k) ? v : truncateToMonth(v, tI);
    }
    return r as T;
  }
  return o;
}

export const sumRange = (a: number[], i: number, j: number) => a.slice(i, j).reduce((x, y) => x + y, 0);

/** Trailing k-month average; null until k points are available. */
export const rolling = (a: number[], k: number) =>
  a.map((_, i) => (i < k - 1 ? null : a.slice(i - k + 1, i + 1).reduce((x, y) => x + y, 0) / k));

/** Same-month-prior-year values aligned to the selected range (null when not loaded). */
export const priorYearAligned = (series: number[], r: MonthRange) =>
  series.slice(r.fI, r.tI + 1).map((_, i) => (r.fI + i - 12 >= 0 ? series[r.fI + i - 12] : null));
