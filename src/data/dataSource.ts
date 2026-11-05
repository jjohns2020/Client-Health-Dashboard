import type { Dataset, Insight, MonthlySeries, ScrubData, WorkflowDetail, WorkflowKey } from './types';
import { clients } from './sample/clients';
import { opps, months } from './sample/opportunities';
import { medSplit, loads, guarRatio } from './sample/misc';
import monthly from './sample/monthly.json';
import scrubData from './sample/scrubData.json';
import details from './sample/details.json';
import insights from './sample/insights.json';
import { buildHealthMocks } from './sample/fromHealth';

/**
 * Seam for future real data sources (workbook uploads, Tableau extracts, etc.).
 * The dashboard only ever reads a `Dataset`; swap the implementation, not the views.
 */
export interface DataSource {
  load(): Dataset;
}

/**
 * Development data source: MaineHealth and WashU from the prototype workbooks, plus a mock workbook
 * for every other active client on the command center's 2025 ROI Stats roster.
 */
export const sampleDataSource: DataSource = {
  load: () => {
    const health = buildHealthMocks();
    return {
      clients: { ...structuredClone(clients), ...health.clients },
      monthly: { ...(monthly as unknown as Record<string, MonthlySeries>), ...health.monthly },
      scrubData: { ...(scrubData as unknown as Record<string, ScrubData>), ...health.scrubData },
      details: { ...(details as unknown as Record<string, Partial<Record<WorkflowKey, WorkflowDetail>>>), ...health.details },
      insights: { ...(insights as unknown as Record<string, Insight[]>), ...health.insights },
      opps: { ...opps, ...health.opps },
      months: { ...months, ...health.months },
      medSplit,
      loads: { ...loads, ...health.loads },
      guarRatio: { ...guarRatio, ...health.guarRatio },
    };
  },
};
