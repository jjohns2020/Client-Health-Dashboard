/**
 * ROI and value calculations, ported unchanged from the prototype.
 * Do not alter these formulas without sign-off: they mirror the ROI workbook template.
 */
import type { Client, MedicaidSplit, Opportunity } from '../data/types';

export const roiRatio = (benefit: number, subscription: number) => benefit / subscription;

export const totalValueCreation = (c: Pick<Client, 'quantified' | 'additional'>) => c.quantified + c.additional;

/** (current − prior) ÷ prior */
export const pctChange = (prior: number, current: number) => (current - prior) / prior;

export const annualize = (periodValue: number, periodMonths: number) => (periodValue * 12) / periodMonths;

export function opportunityTotals(O: Opportunity[], periodMonths: number) {
  const live = O.filter((o) => o.st !== 'Declined');
  const tot = live.reduce((a, o) => a + o.v, 0);
  return {
    live,
    declined: O.length - live.length,
    total: tot,
    annualized: annualize(tot, periodMonths),
    proposedOrInDiscussion: O.filter((o) => o.st === 'Proposed' || o.st === 'In discussion').length,
  };
}

export type MedicaidSource = 'all' | 'exp' | 'ein';

export const MEDICAID_SOURCE_LABEL: Record<MedicaidSource, string> = {
  all: 'All sources',
  exp: 'Delivered by Experian',
  ein: 'Delivered by eInsights',
};

/** Share of Medicaid coverage ("cov") or payments ("pay") attributed to the selected delivery source. */
export function medicaidFactor(
  kind: 'cov' | 'pay',
  split: MedicaidSplit | undefined,
  usesEin: boolean,
  src: MedicaidSource,
): number {
  if (!split || !usesEin || src === 'all') return 1;
  const e = kind === 'pay' ? split.expPay : split.expCov;
  return src === 'exp' ? e : 1 - e;
}

/** Internal attribution check: ROI with eInsights-delivered Medicaid payments removed. */
export function medicaidAttribution(c: Pick<Client, 'quantified' | 'sub'>, split: MedicaidSplit) {
  const einPay = Math.round(split.pay * (1 - split.expPay));
  return { einPay, roi: c.quantified / c.sub, roiExperianOnly: (c.quantified - einPay) / c.sub };
}

export type ReturnMailLevel = 'acct' | 'guar';

/** Converts Return Mail account counts to guarantors using the workbook guarantor-to-account ratio. */
export const returnMailScale = (n: number | null, level: ReturnMailLevel, guarRatio: number) =>
  n == null ? n : level === 'guar' ? Math.round(n / guarRatio) : n;
