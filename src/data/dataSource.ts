import type { Dataset, Insight, MonthlySeries, ScrubData, WorkflowDetail, WorkflowKey } from './types';
import { clients } from './sample/clients';
import { opps, months } from './sample/opportunities';
import { medSplit, loads, guarRatio } from './sample/misc';
import monthly from './sample/monthly.json';
import scrubData from './sample/scrubData.json';
import details from './sample/details.json';
import insights from './sample/insights.json';

/**
 * Seam for future real data sources (workbook uploads, Tableau extracts, etc.).
 * The dashboard only ever reads a `Dataset`; swap the implementation, not the views.
 */
export interface DataSource {
  load(): Dataset;
}

/** Development data source: the prototype's sample data, including values labelled illustrative. */
export const sampleDataSource: DataSource = {
  load: () => ({
    clients: structuredClone(clients),
    monthly: monthly as unknown as Record<string, MonthlySeries>,
    scrubData: scrubData as unknown as Record<string, ScrubData>,
    details: details as unknown as Record<string, Partial<Record<WorkflowKey, WorkflowDetail>>>,
    insights: insights as unknown as Record<string, Insight[]>,
    opps,
    months,
    medSplit,
    loads,
    guarRatio,
  }),
};
