import { VBars } from '../components/charts/VBars';
import { Card, Grid2, PageHead } from '../components/common/Labels';
import { InsightBox } from '../components/insights/InsightBox';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

export function AgencyPerformance() {
  const { client: c } = useDashboard();
  const a = c.agencyData;
  return (
    <>
      <PageHead title="Agency Performance" subtitle="agency recovery rate vs. Experian benchmark, by balance tier" />
      {!a ? (
        <div className="card">
          <p className="ph">No agency data yet — populates from the Agency Benchmarking tab of this client's workbook.</p>
        </div>
      ) : (
        <>
          <Grid2>
            {Object.entries(a.periods).map(([p, d]) => (
              <Card key={p} title={`${p} placements`}>
                <VBars
                  cats={a.buckets}
                  series={Object.entries(d).map(([n, v], i) => ({ n, c: [C.gray, C.blue, C.magenta][i], v }))}
                  fmt={(v) => (v * 100).toFixed(1) + '%'}
                />
              </Card>
            ))}
          </Grid2>
          <p className="note">Agency names are hidden in this mockup; the live version shows each agency by name.</p>
          <InsightBox areas={['agency']} />
        </>
      )}
    </>
  );
}
