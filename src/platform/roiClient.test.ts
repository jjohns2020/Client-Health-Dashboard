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

  it('does not invent a workbook for other command-center clients', () => {
    expect(roiTarget('rush', 'Rush')).toEqual({ lockClient: false, missingName: 'Rush' });
  });
});
