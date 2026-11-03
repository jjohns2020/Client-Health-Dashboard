import { VBars } from '../components/charts/VBars';
import { Card, PageHead } from '../components/common/Labels';
import { InsightBox } from '../components/insights/InsightBox';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

export function Segmentation() {
  const { client: c } = useDashboard();
  if (!c.seg) return null;
  return (
    <>
      <PageHead title="Segmentation Performance" subtitle="recoverability concentration by segment" />
      <Card title="% of volume vs. % of payments by segment">
        <VBars
          cats={['Seg 1', 'Seg 2', 'Seg 3', 'Seg 4', 'Seg 5']}
          series={[
            { n: '% Volume', c: C.blue, v: c.seg.vol },
            { n: '% Payments', c: C.magenta, v: c.seg.pay },
          ]}
          fmt={(v) => Math.round(v * 100) + '%'}
        />
      </Card>
      <InsightBox areas={['seg']} />
    </>
  );
}
