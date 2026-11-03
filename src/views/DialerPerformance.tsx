import { TrendLine } from '../components/charts/TrendLine';
import { Kpi, KpiRow } from '../components/common/Kpi';
import { Card, Grid2, MockTag, PageHead } from '../components/common/Labels';
import { rolling, sumRange } from '../lib/dateRange';
import { count, money, pct } from '../lib/format';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

export function DialerPerformance() {
  const { ds, state, rangeLabel } = useDashboard();
  const { fI, tI } = state.range;
  const M = ds.monthly[state.clientKey];
  const D = {
    attempts: M.dialer.attempts.slice(fI, tI + 1),
    contacts: M.dialer.contacts.slice(fI, tI + 1),
    payments: M.dialer.payments.slice(fI, tI + 1),
  };
  const months = M.months.slice(fI, tI + 1);
  const total = (a: number[]) => sumRange(a, 0, a.length);
  const at = total(D.attempts),
    co = total(D.contacts),
    pa = total(D.payments);
  return (
    <>
      <PageHead title="Dialer Performance" subtitle="outbound campaign effectiveness" />
      <p>
        <MockTag gray>ILLUSTRATIVE SAMPLE DATA</MockTag> <span className="note">Real values come from the Dialer Performance tab.</span>
      </p>
      <KpiRow>
        <Kpi label="Call attempts" value={count(at)} note={rangeLabel} color={C.blue} />
        <Kpi label="Right-party contacts" value={count(co)} note={rangeLabel} color={C.purple} />
        <Kpi label="Contact rate" value={pct(co / at)} note="Contacts ÷ attempts" color={C.magenta} />
        <Kpi label="Payments from dialer" value={money(pa)} note={rangeLabel} color={C.teal} />
        <Kpi label="$ per contact" value={'$' + (pa / co).toFixed(2)} note="Payments ÷ contacts" color={C.orange} />
      </KpiRow>
      <Grid2>
        <Card title="Dialer payments by month">
          <TrendLine
            cats={months}
            series={[
              { n: 'Dialer payments', c: C.teal, v: D.payments, w: 3 },
              { n: '3-month average', c: C.gray, v: rolling(D.payments, 3), dash: true, nolabel: true },
            ]}
            fmt={money}
            zero
          />
        </Card>
        <Card title="Contact rate by month">
          <TrendLine
            cats={months}
            series={[{ n: 'Contact rate', c: C.magenta, v: D.contacts.map((x, i) => x / D.attempts[i]), w: 3 }]}
            fmt={(v) => (v * 100).toFixed(1) + '%'}
          />
        </Card>
      </Grid2>
    </>
  );
}
