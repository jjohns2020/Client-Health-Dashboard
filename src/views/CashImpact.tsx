import { VBars } from '../components/charts/VBars';
import { Kpi, KpiRow } from '../components/common/Kpi';
import { Card, Grid2, PageHead } from '../components/common/Labels';
import { money, pct } from '../lib/format';
import { pctChange } from '../lib/roi';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

export function CashImpact() {
  const { client } = useDashboard();
  const k = client.cash;
  return (
    <>
      <PageHead title="Cash Impact Analysis" subtitle="patient payment performance vs. prior period" />
      <KpiRow>
        <Kpi label="Patient payments" value={money(k.payCur)} note={k.cur} color={C.blue} />
        <Kpi label="Payment change" value={pct(pctChange(k.payPrior, k.payCur))} note="Versus prior period" color={C.purple} />
        <Kpi label="Collection rate" value={pct(k.rateCur)} note={'Prior: ' + pct(k.ratePrior)} color={C.magenta} />
        <Kpi label={k.liftLabel} value={money(k.lift)} note="ROI calculation" color={C.teal} />
      </KpiRow>
      <Grid2>
        <Card title="Patient payments">
          <VBars cats={[k.prior, k.cur]} series={[{ n: 'Patient payments', c: C.blue, v: [k.payPrior, k.payCur] }]} fmt={money} />
        </Card>
        <Card title="Collection rate">
          <VBars cats={[k.prior, k.cur]} series={[{ n: 'Collection rate', c: C.purple, v: [k.ratePrior, k.rateCur] }]} fmt={pct} />
        </Card>
      </Grid2>
    </>
  );
}
