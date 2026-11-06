import { describe, expect, it } from 'vitest';
import { roiTarget } from './roiClient';

describe('command center ROI target', () => {
  it('opens the working dashboard from the ROI module', () => {
    expect(roiTarget(null, null)).toEqual({ lockClient: false });
  });

  it('opens the built workbook for MaineHealth and WashU', () => {
    expect(roiTarget('maine', 'MaineHealth')).toEqual({ clientKey: 'maine', lockClient: true, organization: 'MaineHealth' });
    expect(roiTarget('washu', 'WashU')).toEqual({ clientKey: 'washu', lockClient: true, organization: 'WashU' });
  });

  it('opens a mock workbook for every other client health roster id', () => {
    expect(roiTarget('rush', 'Rush')).toEqual({ clientKey: 'rush', lockClient: true, organization: 'Rush' });
    expect(roiTarget('bjc', 'BJC HealthCare')).toEqual({ clientKey: 'bjc', lockClient: true, organization: 'BJC HealthCare' });
    expect(roiTarget('cone', 'Cone')).toEqual({ clientKey: 'cone', lockClient: true, organization: 'Cone' });
  });

  it('leaves an unknown client on the portfolio with a missing note', () => {
    expect(roiTarget('not-a-client', 'Somewhere')).toEqual({ lockClient: false, missingName: 'Somewhere' });
  });
});
