import type { ClientKey, DataLoad, MedicaidSplit } from '../types';

/** Medicaid source split. `expCov` / `expPay` (Experian share) are illustrative sample values. */
export const medSplit: Record<ClientKey, MedicaidSplit | undefined> = {
  washu: {
    expCov: 0.62,
    expPay: 0.6,
    rec: 281558,
    recBal: 21724074,
    cov: 28642,
    covBal: 3112404,
    pay: 608915,
    stmt: 45827,
    yoy: [
      ['Jan–Jun 2023', 368073, 0.105],
      ['Jan–Jun 2024', 1417255, 0.08],
      ['Jan–Jun 2025', 608915, 0.102],
    ],
  },
};

export const loads: Record<ClientKey, DataLoad[]> = {
  maine: [
    { n: 'Maine Health January-June 2025 ROI Workbook v2.xlsx', p: 'Jan–Jun 2025', s: 12, e: 17 },
    { n: 'MaineHealth_Q3_2025_Utilization_Review_Executive_Final.pptx', p: 'Jul–Sep 2025', s: 18, e: 20 },
    { n: 'Monthly Trend + Scrub Trends (sample months)', p: 'Jan 2024 – Sep 2025', s: 0, e: 20 },
  ],
  washu: [
    { n: 'WashU Jan - June 2025 ROI Workbook V2.xlsx', p: 'Jan–Jun 2025', s: 12, e: 17 },
    { n: 'Monthly Trend + Scrub Trends (sample months)', p: 'Jan 2024 – Sep 2025', s: 0, e: 20 },
  ],
};

export const guarRatio: Record<ClientKey, number> = { maine: 3, washu: 3 };
