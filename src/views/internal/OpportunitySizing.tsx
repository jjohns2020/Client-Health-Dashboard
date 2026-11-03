import { HBar } from '../../components/charts/HBar';
import { Chip } from '../../components/common/Chip';
import { Kpi, KpiRow } from '../../components/common/Kpi';
import { Card, InternalBanner, PageHead } from '../../components/common/Labels';
import { money, moneyFull } from '../../lib/format';
import { annualize, opportunityTotals } from '../../lib/roi';
import { useDashboard } from '../../state/DashboardContext';
import { C } from '../../theme/colors';

/** Internal only. Opportunity dollars are never added to the ROI or the client deck. */
export function OpportunitySizing() {
  const { ds, state, client: c } = useDashboard();
  const O = ds.opps[state.clientKey];
  const mo = ds.months[state.clientKey];
  const t = opportunityTotals(O, mo);
  return (
    <>
      <InternalBanner>
        Separate from the ROI: none of these dollars are in the ROI Summary, the ROI ratio or the client ROI deck. Hidden in presentation mode.
      </InternalBanner>
      <PageHead title="Opportunity Sizing" subtitle="value not yet captured — use to plan proposals and the Success Plan" />
      <KpiRow>
        <Kpi label="Open opportunity (period)" value={money(t.total)} note={c.period + ' basis, excl. declined'} color={C.purple} />
        <Kpi label="Annualized" value={money(t.annualized)} note={'× 12 ÷ ' + mo + ' months'} color={C.magenta} />
        <Kpi label="Opportunities open" value={t.live.length} note={t.declined + ' declined'} color={C.blue} />
        <Kpi label="Proposed / in discussion" value={t.proposedOrInDiscussion} note="Ready for next touchbase" color={C.teal} />
      </KpiRow>
      <div className="card">
        <table>
          <tbody>
            <tr>
              <th>Workflow</th>
              <th>Opportunity</th>
              <th className="num">Period value</th>
              <th className="num">Annualized</th>
              <th>Status</th>
              <th>Basis</th>
            </tr>
            {O.map((o, i) => (
              <tr key={i} style={o.st === 'Declined' ? { color: '#A7A9AC' } : undefined}>
                <td>{o.w}</td>
                <td>{o.o}</td>
                <td className="num">{moneyFull(o.v)}</td>
                <td className="num">{moneyFull(annualize(o.v, mo))}</td>
                <td>
                  <Chip status={o.st} />
                </td>
                <td style={{ fontSize: 12, color: '#8A8D91' }}>{o.src}</td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={2}>Total open (excl. declined)</td>
              <td className="num">{moneyFull(t.total)}</td>
              <td className="num">{moneyFull(t.annualized)}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <Card title="Annualized opportunity by workflow">
        <HBar
          rows={t.live
            .map((o) => [o.w + ': ' + o.o.split(' (')[0].slice(0, 32), annualize(o.v, mo)] as [string, number])
            .sort((a, b) => b[1] - a[1])}
          color={[C.purple, C.magenta, C.blue, C.teal, C.orange]}
          fmt={money}
        />
      </Card>
      <p className="note">Rows marked Illustrative are mockup placeholders. In the real build these come from the template's Opportunity Sizing tab.</p>
    </>
  );
}
