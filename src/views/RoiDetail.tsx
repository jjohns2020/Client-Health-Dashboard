import { InsightBox } from '../components/insights/InsightBox';
import { PageHead } from '../components/common/Labels';
import { moneyFull } from '../lib/format';
import { roiRatio, totalValueCreation } from '../lib/roi';
import { visibleScrubs } from '../lib/visibility';
import { useDashboard } from '../state/DashboardContext';

export function RoiDetail() {
  const { client: c } = useDashboard();
  const roi = roiRatio(c.quantified, c.sub);
  return (
    <>
      <PageHead title="ROI Summary" subtitle="value delivered against subscription investment" />
      <div className="card">
        <table>
          <tbody>
            <tr>
              <th>Value lever</th>
              <th className="num">Dollars</th>
            </tr>
            {visibleScrubs(c).map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td className="num">{moneyFull(r[1])}</td>
              </tr>
            ))}
            <tr className="total">
              <td>Total Quantified Benefit</td>
              <td className="num">{moneyFull(c.quantified)}</td>
            </tr>
            {c.addl.map((r) => (
              <tr key={r[0]}>
                <td>Additional: {r[0]}</td>
                <td className="num">{moneyFull(r[1])}</td>
              </tr>
            ))}
            <tr className="total">
              <td>Total Value Creation</td>
              <td className="num">{moneyFull(totalValueCreation(c))}</td>
            </tr>
            <tr>
              <td>Subscription investment</td>
              <td className="num">{moneyFull(c.sub)}</td>
            </tr>
            <tr className="total">
              <td>ROI</td>
              <td className="num">{roi.toFixed(1)} : 1</td>
            </tr>
          </tbody>
        </table>
        {c.fte ? <p className="note">FTE hours equivalent: {c.fte}</p> : null}
      </div>
      <InsightBox areas={['roi']} />
    </>
  );
}
