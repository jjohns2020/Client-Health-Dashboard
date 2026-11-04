import type { Client, ClientKey, Dataset, Insight } from '../data/types';
import type { MonthRange } from './dateRange';
import { overlaps } from './dateRange';
import { overallStatus, runChecks, type CheckResult, type OverallStatus } from './dataChecks';
import { money, moneyFull } from './format';
import { opportunityTotals, roiRatio, totalValueCreation } from './roi';
import { visibleScrubs } from './visibility';

export interface BriefPoint {
  type: Insight['type'];
  title: string;
  /** What the figures show. */
  observation: string;
  /** Why it matters in the meeting. */
  soWhat: string;
  recommendation: string;
  metric: string;
}

export interface ExecutiveBrief {
  ratioLabel: string;
  quantified: string;
  additional: string;
  total: string;
  subscription: string;
  /** Same sentence as the client Executive Highlights page. */
  message: string;
  sources: { name: string; value: string }[];
  say: BriefPoint[];
  hold: BriefPoint[];
  watches: CheckResult[];
  status: OverallStatus;
  opportunities: { workflow: string; name: string; value: string; status: string; illustrative: boolean }[];
  opportunityTotal: string;
  recommendations: string[];
  outsideReview: boolean;
}

function point(insight: Insight): BriefPoint {
  return {
    type: insight.type,
    title: insight.title,
    observation: insight.obs,
    soWhat: insight.so,
    recommendation: insight.rec,
    metric: insight.metric,
  };
}

/**
 * Consultant prep for one client. Built only from workbook figures, analyst notes,
 * data checks, and opportunity rows. Opportunity dollars stay out of the ROI sentence.
 */
export function buildExecutiveBrief(
  key: ClientKey,
  client: Client,
  ds: Pick<Dataset, 'opps' | 'months' | 'scrubData' | 'medSplit'>,
  insights: Insight[],
  range: MonthRange,
): ExecutiveBrief {
  const roi = roiRatio(client.quantified, client.sub);
  const open = opportunityTotals(ds.opps[key], ds.months[key]);
  const checks = runChecks(key, client, ds);
  const latest = client.trend.reviews[client.trend.reviews.length - 1];
  return {
    ratioLabel: roi.toFixed(1) + ' : 1',
    quantified: money(client.quantified),
    additional: money(client.additional),
    total: money(totalValueCreation(client)),
    subscription: moneyFull(client.sub),
    message: `For every $1 invested, ${client.name} realized approximately $${roi.toFixed(2)} in measurable financial benefit during the review period.`,
    sources: visibleScrubs(client).map(([name, value]) => ({ name, value: moneyFull(value) })),
    say: insights.filter((insight) => insight.aud === 'client').map(point),
    hold: insights.filter((insight) => insight.aud === 'internal').map(point),
    watches: checks.filter((check) => check.s === 'FIX' || check.s === 'REVIEW'),
    status: overallStatus(checks),
    opportunities: open.live.map((item) => ({
      workflow: item.w,
      name: item.o,
      value: moneyFull(item.v),
      status: item.st,
      illustrative: /illustrative/i.test(item.src),
    })),
    opportunityTotal: moneyFull(open.total),
    recommendations: client.recs,
    outsideReview: !overlaps(latest.s, latest.e, range),
  };
}
