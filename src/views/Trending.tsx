import { PointLine } from '../components/charts/PointLine';
import { TrendLine } from '../components/charts/TrendLine';
import { VBars } from '../components/charts/VBars';
import { Kpi, KpiRow } from '../components/common/Kpi';
import { Card, Grid2, InternalNote, MockTag, PageHead, RangeChip } from '../components/common/Labels';
import { ScrubSection } from '../components/scrub/ScrubSection';
import { overlaps, priorYearAligned, rolling, sumRange } from '../lib/dateRange';
import { int, money, pct } from '../lib/format';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

export function Trending() {
  const { ds, state, client: c, rangeLabel, calendar } = useDashboard();
  const { fI, tI } = state.range;
  const t0 = c.trend;
  const inRange = t0.reviews.filter((r) => overlaps(r.s, r.e, state.range));
  const noReviews = !inRange.length;
  const reviews = noReviews ? [t0.reviews[t0.reviews.length - 1]] : inRange;
  const per = reviews.map((r) => r.b / r.m),
    rois = reviews.map((r) => r.b / r.sub);
  const lastReview = reviews[reviews.length - 1];
  const yl = t0.yoy[t0.yoy.length - 1];
  const M = ds.monthly[state.clientKey];
  const months = M.months.slice(fI, tI + 1);
  const sl = <T,>(a: T[]) => a.slice(fI, tI + 1);

  const P = M.pay;
  const cur3 = sumRange(P, Math.max(fI, tI - 2), tI + 1);
  const pri3 = tI - 5 >= 0 ? sumRange(P, Math.max(0, tI - 5), tI - 2) : null;
  const inR = sumRange(P, fI, tI + 1);
  const py = fI >= 12 ? sumRange(P, fI - 12, tI - 11) : null;

  return (
    <>
      <PageHead title="Trending" subtitle="how value and performance move from review to review and year over year" />
      {noReviews && (
        <div className="card">
          <p className="ph">No ROI review loaded for {rangeLabel}. Widen the date range to see review-level ROI.</p>
        </div>
      )}
      {!state.present && (
        <div className="card" style={{ borderInlineStart: '5px solid #53565A' }}>
          <h4 style={{ color: '#53565A' }}>🔒 Data loads for this client</h4>
          <table>
            <tbody>
              <tr>
                <th>File</th>
                <th>Covers</th>
                <th>In selected range?</th>
              </tr>
              {ds.loads[state.clientKey].map((l) => (
                <tr key={l.n}>
                  <td>{l.n}</td>
                  <td>{l.p}</td>
                  <td>{overlaps(l.s, l.e, state.range) ? '✔ Included' : '— Outside range'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">Each new workbook upload adds a row here; the date filter decides which loads feed the trend views.</p>
        </div>
      )}
      <KpiRow>
        <Kpi label="Reviews loaded" value={reviews.length} note="One per ROI workbook" color={C.blue} />
        <Kpi label="Latest benefit / month" value={money(per[per.length - 1])} note={lastReview.p} color={C.purple} />
        <Kpi label="Latest ROI" value={rois[rois.length - 1].toFixed(1) + ' : 1'} note={lastReview.p} color={C.teal} />
        <Kpi
          label="Collection rate change"
          value={((yl.rate[1] - yl.rate[0]) * 100).toFixed(2) + ' pts'}
          note={yl.p + ' ' + yl.cy + ' vs ' + yl.py}
          color={C.magenta}
        />
      </KpiRow>
      <Grid2>
        <Card title="Quantified benefit per month, by review">
          <PointLine cats={reviews.map((r) => r.p)} series={[{ n: 'Benefit / month', c: C.purple, v: per }]} fmt={money} />
        </Card>
        <Card title="ROI by review">
          <PointLine cats={reviews.map((r) => r.p)} series={[{ n: 'ROI (x : 1)', c: C.teal, v: rois }]} fmt={(v) => v.toFixed(1) + 'x'} />
        </Card>
      </Grid2>
      <Grid2>
        <Card title="Patient payments, year over year">
          <VBars
            cats={t0.yoy.map((y) => y.p)}
            series={[
              { n: t0.yoy[0].py, c: C.gray, v: t0.yoy.map((y) => y.pay[0]) },
              { n: t0.yoy[0].cy, c: C.blue, v: t0.yoy.map((y) => y.pay[1]) },
            ]}
            fmt={money}
          />
        </Card>
        <Card title="Collection rate, year over year">
          <VBars
            cats={t0.yoy.map((y) => y.p)}
            series={[
              { n: t0.yoy[0].py, c: C.gray, v: t0.yoy.map((y) => y.rate[0]) },
              { n: t0.yoy[0].cy, c: C.magenta, v: t0.yoy.map((y) => y.rate[1]) },
            ]}
            fmt={pct}
          />
        </Card>
      </Grid2>
      {t0.wf && (
        <Card title={`Workflow results, ${t0.wf.label}`}>
          <table>
            <tbody>
              <tr>
                <th>Workflow</th>
                <th className="num">2024</th>
                <th className="num">2025</th>
                <th className="num">Change</th>
              </tr>
              {t0.wf.rows.map((r) => (
                <tr key={r[0]}>
                  <td>{r[0]}</td>
                  <td className="num">{int(r[1])}</td>
                  <td className="num">{int(r[2])}</td>
                  <td className="num">{pct((r[2] - r[1]) / r[1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {t0.seg && (
        <Card title="Segment mix (% of volume) by year">
          <VBars
            cats={['Seg 1', 'Seg 2', 'Seg 3', 'Seg 4', 'Seg 5']}
            series={t0.seg.years.map((y, j) => ({ n: y, c: [C.gray, C.purple, C.blue][j], v: t0.seg!.vol.map((r) => r[j]) }))}
            fmt={(v) => Math.round(v * 100) + '%'}
          />
        </Card>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 10px' }}>
        <p className="title" style={{ fontSize: 19 }}>
          Monthly trend
        </p>
        <MockTag gray>ILLUSTRATIVE SAMPLE DATA</MockTag>
        <span className="spacer"></span>
        <RangeChip />
      </div>
      <KpiRow>
        <Kpi label="Patient payments in range" value={money(inR)} note={rangeLabel} color={C.blue} />
        <Kpi
          label="vs same months prior year"
          value={py ? (inR >= py ? '+' : '') + pct((inR - py) / py) : '—'}
          note={py ? calendar[fI - 12] + ' – ' + calendar[tI - 12] : 'Prior-year months not loaded'}
          color={py && inR < py ? C.magenta : C.teal}
        />
        <Kpi
          label="Last 3 months vs prior 3"
          value={pri3 ? (cur3 >= pri3 ? '+' : '') + pct((cur3 - pri3) / pri3) : '—'}
          note={'Ending ' + M.months[tI]}
          color={C.purple}
        />
        <Kpi label="Collection rate" value={pct(M.rate[tI])} note={M.months[tI]} color={C.orange} />
      </KpiRow>
      <Grid2>
        <Card title="Patient payments by month, with same month prior year">
          <TrendLine
            cats={months}
            series={[
              { n: 'Prior year', c: '#A7A9AC', v: priorYearAligned(P, state.range), dash: true, nolabel: true },
              { n: 'Selected range', c: C.blue, v: sl(P), w: 3 },
            ]}
            fmt={money}
          />
        </Card>
        <Card title="Collection rate by month, with 3-month average">
          <TrendLine
            cats={months}
            series={[
              { n: 'Monthly', c: '#C9B6DC', v: sl(M.rate), nolabel: true, w: 2 },
              { n: '3-month average', c: C.purple, v: sl(rolling(M.rate, 3)), w: 3 },
            ]}
            fmt={(v) => (v * 100).toFixed(1) + '%'}
          />
        </Card>
      </Grid2>
      <ScrubSection />
      {!state.present && (
        <>
          <p className="note">{M.known}</p>
          <InternalNote label="Internal note:"> {t0.note}</InternalNote>
        </>
      )}
    </>
  );
}
