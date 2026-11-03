import { Kpi, KpiRow } from '../components/common/Kpi';
import { PageHead } from '../components/common/Labels';
import { InsightBox } from '../components/insights/InsightBox';
import type { InsightType } from '../data/types';
import { audienceFilter } from '../lib/visibility';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

const AREA_NAMES: Record<string, string> = {
  roi: 'ROI & Cash Impact',
  pfc: 'Patient Financial Clearance',
  av: 'Address Verification',
  bk: 'Bankruptcy',
  dc: 'Deceased',
  rm: 'Return Mail',
  mc: 'Medicaid',
  ch: 'Charity',
  seg: 'Segmentation',
  agency: 'Agency Performance',
};

export function AnalystInsights() {
  const { insights, state } = useDashboard();
  const L = insights.filter(audienceFilter(state.present));
  const cnt = (t: InsightType) => L.filter((i) => i.type === t).length;
  return (
    <>
      <PageHead title="Analyst Insights" subtitle="observations and views from a senior revenue cycle lens" />
      <KpiRow>
        <Kpi label="Observations" value={cnt('Observation')} note="What the data shows" color={C.blue} />
        <Kpi label="Risks" value={cnt('Risk')} note="Needs a story or action" color={C.magenta} />
        <Kpi label="Opportunities" value={cnt('Opportunity')} note="Proposal-ready" color={C.teal} />
        {!state.present && <Kpi label="Data quality" value={cnt('Data quality')} note="Fix before presenting" color={C.orange} />}
      </KpiRow>
      {[...new Set(L.map((i) => i.area))].map((a) => (
        <InsightBox key={a} areas={[a]} title={AREA_NAMES[a] || a} />
      ))}
      {!state.present && (
        <p className="note">
          Client-facing insights stay visible in presentation mode; items marked Internal are hidden. In the live tool these come from the template's
          Analyst Observations tab plus automatic flags, and the consultant edits them before export.
        </p>
      )}
    </>
  );
}
