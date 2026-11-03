import type { ComponentType } from 'react';
import type { WorkflowKey } from '../data/types';
import type { ViewKey } from '../lib/visibility';
import { useDashboard } from '../state/DashboardContext';
import { AgencyPerformance } from './AgencyPerformance';
import { AnalystInsights } from './AnalystInsights';
import { CashImpact } from './CashImpact';
import { DialerPerformance } from './DialerPerformance';
import { ExecutiveSummary } from './ExecutiveSummary';
import { DataChecks } from './internal/DataChecks';
import { OpportunitySizing } from './internal/OpportunitySizing';
import { Portfolio } from './internal/Portfolio';
import { RoiDetail } from './RoiDetail';
import { Segmentation } from './Segmentation';
import { SuccessPlan } from './SuccessPlan';
import { Trending } from './Trending';
import { WorkflowDetail } from './WorkflowDetail';
import { WorkflowResults } from './WorkflowResults';

const VIEWS: Record<ViewKey, ComponentType> = {
  exec: ExecutiveSummary,
  roi: RoiDetail,
  ops: WorkflowResults,
  cash: CashImpact,
  trend: Trending,
  seg: Segmentation,
  agency: AgencyPerformance,
  dialer: DialerPerformance,
  insights: AnalystInsights,
  recs: SuccessPlan,
  opps: OpportunitySizing,
  checks: DataChecks,
  portfolio: Portfolio,
};

export function ViewRouter() {
  const { state } = useDashboard();
  if (state.view.startsWith('d_')) return <WorkflowDetail k={state.view.slice(2) as WorkflowKey} />;
  const View = VIEWS[state.view as ViewKey];
  return <View />;
}
