import { Chip } from '../../components/common/Chip';
import { Kpi, KpiRow } from '../../components/common/Kpi';
import { Card, Grid2, InternalBanner, InternalNote, MockTag, PageHead } from '../../components/common/Labels';
import { buildExecutiveBrief, type BriefPoint } from '../../lib/executiveBrief';
import { useDashboard } from '../../state/DashboardContext';
import { C } from '../../theme/colors';

function PointList({ points }: { points: BriefPoint[] }) {
  if (!points.length) return <p className="note">None on this client.</p>;
  return points.map((point) => (
    <div key={point.title} style={{ padding: '10px 0', borderBlockEnd: '1px solid #EEE' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <b style={{ fontSize: 14 }}>{point.title}</b>
        <span className="spacer" />
        <span style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>{point.metric}</span>
      </div>
      <p style={{ margin: '6px 0 2px', fontSize: 13 }}>{point.observation}</p>
      <p style={{ margin: '2px 0', fontSize: 13, color: '#53565A' }}>
        <b>So what:</b> {point.soWhat}
      </p>
      <p style={{ margin: '2px 0', fontSize: 13, color: C.teal }}>
        <b>Recommendation:</b> {point.recommendation}
      </p>
    </div>
  ));
}

/** Internal only. A written brief for the consultant. Never shown in presentation mode or the client deck. */
export function ExecutiveBrief() {
  const dash = useDashboard();
  const { ds, state, client, insights, rangeLabel } = dash;
  const brief = buildExecutiveBrief(state.clientKey, client, ds, insights, state.range);
  return (
    <>
      <InternalBanner>Consultant prep for this client. Hidden in presentation mode and left out of the PowerPoint.</InternalBanner>
      <PageHead title="Executive Summary" subtitle="what to lead with, and what stays internal" />
      {brief.outsideReview && (
        <div className="card" style={{ background: '#FFF6EC' }}>
          <b>Note:</b> the headline ROI is from the {client.period} review, which falls outside the selected dates ({rangeLabel}).
        </div>
      )}
      <KpiRow>
        <Kpi label="ROI" value={brief.ratioLabel} note={'Benefit vs ' + brief.subscription + ' subscription'} color={C.teal} />
        <Kpi label="Quantified Benefit" value={brief.quantified} note="In the client ROI" color={C.purple} />
        <Kpi label="Total Value Creation" value={brief.total} note={'Includes ' + brief.additional + ' additional'} color={C.blue} />
        <Kpi label="Ready to present" value={brief.status} note="From Data Checks" color={brief.status === 'READY' ? C.teal : brief.status === 'REVIEW' ? C.orange : C.magenta} />
      </KpiRow>
      <InternalNote label="Lead with:"> {brief.message}</InternalNote>
      <Grid2>
        <Card title="Where the quantified benefit came from">
          <table>
            <tbody>
              {brief.sources.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td className="num">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Success plan">
          {brief.recommendations.map((item, index) => (
            <p key={item} style={{ margin: '8px 0', fontSize: 13 }}>
              <b>
                {index + 1}. {item}
              </b>
            </p>
          ))}
        </Card>
      </Grid2>
      <Grid2>
        <Card title="Say in the meeting">
          <PointList points={brief.say} />
        </Card>
        <Card title="Keep off the client deck">
          <PointList points={brief.hold} />
        </Card>
      </Grid2>
      <Card title="Open opportunities — not in the ROI">
        <table>
          <tbody>
            <tr>
              <th>Workflow</th>
              <th>Opportunity</th>
              <th className="num">Period value</th>
              <th>Status</th>
            </tr>
            {brief.opportunities.map((item) => (
              <tr key={item.workflow + item.name}>
                <td>{item.workflow}</td>
                <td>
                  {item.name}{' '}
                  {item.illustrative && (
                    <MockTag gray style={{ fontSize: 10 }}>
                      ILLUSTRATIVE
                    </MockTag>
                  )}
                </td>
                <td className="num">{item.value}</td>
                <td>
                  <Chip status={item.status} />
                </td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={2}>Total open (excl. declined)</td>
              <td className="num">{brief.opportunityTotal}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </Card>
      <Card title="Settle before the meeting">
        {brief.watches.map((check) => (
          <p key={check.t} style={{ margin: '8px 0', fontSize: 13 }}>
            <Chip status={check.s} /> {check.t}
            <span style={{ color: '#53565A' }}> — {check.w}</span>
          </p>
        ))}
      </Card>
    </>
  );
}
