import { Chip } from '../../components/common/Chip';
import { Kpi, KpiRow } from '../../components/common/Kpi';
import { InternalBanner, PageHead } from '../../components/common/Labels';
import { overallStatus, runChecks } from '../../lib/dataChecks';
import { useDashboard } from '../../state/DashboardContext';
import { C } from '../../theme/colors';

/** Internal only. Pre-export checklist. */
export function DataChecks() {
  const { ds, state, client } = useDashboard();
  const R = runChecks(state.clientKey, client, ds);
  const o = overallStatus(R);
  const n = (s: string) => R.filter((x) => x.s === s).length;
  return (
    <>
      <InternalBanner>Pre-export checklist. Resolve every FIX before a client deck is exported.</InternalBanner>
      <PageHead title="Data Checks" subtitle="is this client ready to present?" />
      <KpiRow>
        <Kpi label="Overall status" value={o} note="Before export" color={o === 'READY' ? C.teal : o === 'REVIEW' ? C.orange : C.magenta} />
        <Kpi label="Items to fix" value={n('FIX')} note="Blocks export" color={C.magenta} />
        <Kpi label="Items to review" value={n('REVIEW')} note="Consultant judgment" color={C.orange} />
        <Kpi label="Checks passed" value={n('PASS') + ' of ' + R.length} note="" color={C.blue} />
      </KpiRow>
      <div className="card">
        <table>
          <tbody>
            <tr>
              <th>Check</th>
              <th>Result</th>
              <th>Where / why</th>
            </tr>
            {R.map((x, i) => (
              <tr key={i}>
                <td>{x.t}</td>
                <td>
                  <Chip status={x.s} />
                </td>
                <td style={{ fontSize: 12, color: '#53565A' }}>{x.w}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">Toggle "Uses collection agencies" for MaineHealth to see a FIX appear.</p>
      </div>
    </>
  );
}
