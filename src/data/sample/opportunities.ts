import type { ClientKey, Opportunity } from '../types';

/**
 * Opportunity Sizing (internal only). These dollars are never part of the ROI.
 * Rows whose `src` says "Illustrative" are mockup placeholders, not validated values.
 */
export const opps: Record<ClientKey, Opportunity[]> = {
  maine: [
    { w: 'Return Mail', o: 'Automate improved/new address updates', v: 20734, src: 'Q3 deck sizing (901.5 hrs, 1.73 FTE)', st: 'Proposed' },
    { w: 'Bankruptcy', o: 'Automate bankruptcy adjustments', v: 422, src: 'Q3 deck sizing (18.3 hrs)', st: 'Not yet discussed' },
    { w: 'Deceased', o: 'Automate deceased handling', v: 157, src: 'Q3 deck sizing (6.8 hrs)', st: 'Not yet discussed' },
    { w: 'Segmentation', o: 'Segment-based dialer / early-out strategy (0.25% lift)', v: 59787354 * 0.0025, src: 'Illustrative assumption on Q3 patient payments', st: 'In discussion' },
    { w: 'Deceased', o: 'Probate vendor revenue stream', v: 15000, src: 'Illustrative estimate', st: 'Not yet discussed' },
  ],
  washu: [
    { w: 'Medicaid', o: '271 interface for partial automation', v: ((28642 * 15) / 60) * 23, src: 'Sized from workbook inputs (28,642 records × 15 min × $23/hr)', st: 'Proposed' },
    { w: 'Segmentation', o: 'Segment-based dialer / early-out strategy (0.25% lift)', v: 71350044 * 0.0025, src: 'Illustrative assumption on Jan–Jun patient payments', st: 'Not yet discussed' },
    { w: 'Agency', o: 'Re-place low-performing agency inventory toward benchmark', v: 120000, src: 'Illustrative estimate', st: 'In discussion' },
    { w: 'Bankruptcy', o: 'Bankruptcy vendor revenue stream', v: 25000, src: 'Illustrative estimate', st: 'Declined' },
  ],
};

export const months: Record<ClientKey, number> = { maine: 3, washu: 6 };
