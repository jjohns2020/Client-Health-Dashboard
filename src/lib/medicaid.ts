import type { MedicaidSplit, WorkflowDetail } from '../data/types';
import { int, money, moneyFull, pct } from './format';
import { MEDICAID_SOURCE_LABEL, type MedicaidSource } from './roi';

/**
 * Medicaid detail page content filtered to a delivery source (Experian / eInsights).
 * Without a split, or when eInsights is not on the client profile, the workbook slide content is used as-is.
 */
export function medicaidDetail(
  base: WorkflowDetail,
  m: MedicaidSplit | undefined,
  usesEin: boolean,
  src: MedicaidSource,
  medF: (kind: 'cov' | 'pay') => number,
): WorkflowDetail {
  if (!m || !usesEin) return base;
  const fc = medF('cov'),
    fp = medF('pay'),
    cov = Math.round(m.cov * fc),
    bal = Math.round(m.covBal * fc),
    pay = Math.round(m.pay * fp);
  const lbl = MEDICAID_SOURCE_LABEL[src];
  return {
    ...base,
    sub: base.sub + ' · ' + lbl,
    kpis: [
      ['Records scrubbed', int(m.rec), money(m.recBal) + ' balance'],
      ['Active coverage found', int(cov), pct(cov / m.rec) + ' of records'],
      ['Active balance', moneyFull(bal), pct(bal / m.recBal) + ' of balance'],
      ['Medicaid payments', moneyFull(pay), lbl],
    ],
    table: {
      h: ['Value lever', 'Workbook value'],
      r: [
        ['Medicaid payments (in ROI)', moneyFull(pay)],
        ['Statement cost savings (additional benefit)', moneyFull(Math.round(m.stmt * fc))],
      ],
    },
    charts: [
      { t: 'Medicaid payments, Jan–Jun', cats: m.yoy.map((r) => r[0].slice(-4)), v: m.yoy.map((r) => Math.round(r[1] * fp)), f: '$' },
      { t: 'Hit rate, Jan–Jun', cats: m.yoy.map((r) => r[0].slice(-4)), v: m.yoy.map((r) => r[2] * fc), f: 'p' },
    ],
  };
}
