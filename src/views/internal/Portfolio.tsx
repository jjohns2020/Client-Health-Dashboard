import { HBar } from '../../components/charts/HBar';
import { Card, InternalBanner } from '../../components/common/Labels';
import { moneyFull } from '../../lib/format';
import { roiRatio } from '../../lib/roi';
import { effectiveClient } from '../../state/dashboardState';
import { useDashboard } from '../../state/DashboardContext';
import { C } from '../../theme/colors';

/** Internal only. Cross-client view; never shown in presentation mode or exported. */
export function Portfolio() {
  const { ds, state } = useDashboard();
  const all = Object.keys(ds.clients).map((k) => effectiveClient(ds, state.profiles, k));
  return (
    <>
      <InternalBanner>Hidden in presentation mode and never included in any PowerPoint export.</InternalBanner>
      <p className="title">Portfolio View</p>
      <p className="subtitle">All clients loaded into the dashboard (periods differ by client)</p>
      <div className="card">
        <table>
          <tbody>
            <tr>
              <th>Client</th>
              <th>Period</th>
              <th className="num">Quantified benefit</th>
              <th className="num">Subscription</th>
              <th className="num">ROI</th>
              <th>PFC</th>
              <th>Agency</th>
              <th>Dialer</th>
            </tr>
            {all.map((x) => (
              <tr key={x.name}>
                <td>{x.name}</td>
                <td>{x.period}</td>
                <td className="num">{moneyFull(x.quantified)}</td>
                <td className="num">{moneyFull(x.sub)}</td>
                <td className="num">{roiRatio(x.quantified, x.sub).toFixed(1)} : 1</td>
                <td>{x.pfc !== false ? 'Yes' : 'No'}</td>
                <td>{x.agency ? 'Yes' : 'No'}</td>
                <td>{x.dialer ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="ROI by client">
        <HBar rows={all.map((x) => [x.name, roiRatio(x.quantified, x.sub)])} color={[C.blue, C.purple]} fmt={(v) => v.toFixed(1) + ' : 1'} />
      </Card>
    </>
  );
}
