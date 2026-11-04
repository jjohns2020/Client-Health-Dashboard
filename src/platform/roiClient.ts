/** Command-center clients whose ROI workspace is the dashboard in this repository. */
const WORKBOOKS: Record<string, string> = {
  maine: 'MaineHealth',
  washu: 'WashU',
};

export interface RoiTarget {
  /** Workbook to open. Omitted for the portfolio entrance and for clients without a workbook. */
  clientKey?: string;
  /** A client drill-in stays on that health system. */
  lockClient: boolean;
  organization?: string;
  /** Command-center client that has no workbook in this build. */
  missingName?: string;
}

export function roiTarget(clientId: string | null, name: string | null): RoiTarget {
  if (!clientId) return { lockClient: false };
  const organization = WORKBOOKS[clientId];
  if (organization) return { clientKey: clientId, lockClient: true, organization };
  return { lockClient: false, missingName: name || clientId };
}
