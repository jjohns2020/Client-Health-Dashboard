import type { ReactNode } from 'react';
import { HBar } from '../components/charts/HBar';
import { StackedBars } from '../components/charts/StackedBars';
import { VBars } from '../components/charts/VBars';
import { Kpi, KpiRow } from '../components/common/Kpi';
import { Card, Grid2, InternalNote, PageHead, Takeaway } from '../components/common/Labels';
import { InsightBox } from '../components/insights/InsightBox';
import { ScrubSection } from '../components/scrub/ScrubSection';
import { MedicaidSourceToggle, ReturnMailLevelToggle } from '../components/scrub/Toggles';
import type { WorkflowKey } from '../data/types';
import { sumRange, truncateToMonth } from '../lib/dateRange';
import { chartFormatter, count, int, moneyFull, pct } from '../lib/format';
import { medicaidDetail } from '../lib/medicaid';
import { medicaidAttribution, returnMailScale } from '../lib/roi';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

const KPI_COLS = [C.blue, C.purple, C.magenta, C.teal];

export function WorkflowDetail({ k }: { k: WorkflowKey }) {
  const { state, dispatch, client: c, rangeLabel, details, usesEin, medSplit, medF } = useDashboard();
  const base = details[k];
  if (!base) return null;
  const d = k === 'mc' ? medicaidDetail(base, medSplit, usesEin, state.medSrc, medF) : base;

  const parts: ReactNode[] = [];
  if (d.table)
    parts.push(
      <div className="card" key="table">
        <table>
          <tbody>
            <tr>
              {d.table.h.map((x, i) => (
                <th key={i} className={i ? 'num' : ''}>
                  {x}
                </th>
              ))}
            </tr>
            {d.table.r.map((r, i) => (
              <tr key={i}>
                <td>
                  <b>{r[0]}</b>
                </td>
                <td className="num">{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
  (d.charts || []).forEach((ch, i) =>
    parts.push(
      <Card key={'chart' + i} title={ch.t}>
        <VBars cats={ch.cats} series={[{ n: ch.t.split(',')[0], c: [C.blue, C.purple][i % 2], v: ch.v }]} fmt={chartFormatter(ch.f)} />
      </Card>,
    ),
  );
  const rows: ReactNode[] = [];
  for (let p = 0; p < parts.length; p += 2)
    rows.push(
      <Grid2 key={p}>
        {parts[p]}
        {parts[p + 1]}
      </Grid2>,
    );

  return (
    <>
      <p style={{ margin: '0 0 10px' }}>
        <button type="button" className="btn back" style={{ border: '1px solid #005EB8', padding: '5px 12px' }} onClick={() => dispatch({ type: 'setView', view: 'ops' })}>
          ← Workflow Results
        </button>
        {d.trend && (
          <>
            {' '}
            <button
              type="button"
              className="btn totrend"
              style={{ border: '1px solid #662D91', color: '#662D91', padding: '5px 12px' }}
              onClick={() => dispatch({ type: 'openTrending', scrub: d.trend! })}
            >
              Open in Trending →
            </button>
          </>
        )}
      </p>
      <PageHead title={d.name + ' Results'} subtitle={d.sub} />
      <p className="note" style={{ marginTop: -10 }}>
        {state.present ? '' : 'Source: ' + d.src + ' · '}Slide figures cover {c.period}; trend charts below follow the date filter ({rangeLabel}).
      </p>
      {k === 'mc' && (
        <>
          <MedicaidSourceToggle />
          {usesEin && !medSplit && !state.present && <p className="note">No Medicaid results in this review, so there is nothing to split by source.</p>}
        </>
      )}
      {d.empty && (
        <div className="card">
          <p className="ph">{d.empty}</p>
        </div>
      )}
      {d.kpis && (
        <KpiRow>
          {d.kpis.map((x, i) => (
            <Kpi key={i} label={x[0]} value={x[1]} note={x[2]} color={KPI_COLS[i % 4]} />
          ))}
        </KpiRow>
      )}
      {rows}
      {k === 'rm' && <NewImprovedAddresses />}
      {d.take && <Takeaway label={(d.tl || 'Executive takeaway') + ':'}>{d.take}</Takeaway>}
      {k === 'mc' && medSplit && usesEin && !state.present && <MedicaidAttributionNote />}
      {d.trend && <ScrubSection embed />}
      <InsightBox areas={[k]} />
    </>
  );
}

function MedicaidAttributionNote() {
  const { client: c, medSplit } = useDashboard();
  const { einPay, roi, roiExperianOnly } = medicaidAttribution(c, medSplit!);
  return (
    <InternalNote label="🔒 Internal — attribution:">
      {' '}
      The ROI counts all {moneyFull(medSplit!.pay)} in Medicaid payments, including about {moneyFull(einPay)} delivered by eInsights (sample split).
      Counting Experian-delivered payments only, ROI would be {roiExperianOnly.toFixed(1)} : 1 instead of {roi.toFixed(1)} : 1. Decide whether
      eInsights-delivered value belongs in the ROI.
    </InternalNote>
  );
}

/** Return Mail New vs Improved breakdown (workbook periods + illustrative monthly sample). */
function NewImprovedAddresses() {
  const { ds, state } = useDashboard();
  const S = ds.scrubData[state.clientKey];
  const sc = (n: number | null) => returnMailScale(n, state.rmLevel, ds.guarRatio[state.clientKey]) as number;
  const unit = state.rmLevel === 'guar' ? 'guarantors' : 'accounts';
  const Y = S.yoy.rm.filter((r) => r[1] != null).map((r) => [r[0], sc(r[1]), sc(r[2]), sc(r[3])] as [string, number, number, number]);
  const T = truncateToMonth(S, state.range.tI).rm;
  const R = { new: T.new.map(sc), imp: T.imp.map(sc), eq: T.eq.map(sc), nh: T.nh.map(sc) };
  const L = R.new.length;
  const lq = { n: sumRange(R.new, L - 3, L), i: sumRange(R.imp, L - 3, L), e: sumRange(R.eq, L - 3, L), x: sumRange(R.nh, L - 3, L) };
  const a = Y[Y.length - 2],
    b = Y[Y.length - 1];
  const chg = (x: number, y: number) => ((y - x) / x >= 0 ? '+' : '') + pct((y - x) / x);
  return (
    <>
      <p className="title" style={{ fontSize: 19, marginTop: 20 }}>
        New &amp; Improved addresses
      </p>
      <p className="subtitle">New = a completely new address found · Improved = the existing address corrected or completed · counted by {unit}</p>
      <ReturnMailLevelToggle />
      <KpiRow>
        <Kpi label={'New (' + b[0] + ')'} value={int(b[2])} note={a ? chg(a[2], b[2]) + ' vs ' + a[0] : ''} color={C.purple} />
        <Kpi label={'Improved (' + b[0] + ')'} value={int(b[3])} note={a ? chg(a[3], b[3]) + ' vs ' + a[0] : ''} color={C.magenta} />
        <Kpi label="Improved share" value={pct(b[3] / b[1])} note={a ? 'was ' + pct(a[3] / a[1]) + ' in ' + a[0] : ''} color={C.teal} />
        <Kpi
          label="New + Improved (last 3 mo of range)"
          value={int(lq.n + lq.i)}
          note={pct((lq.n + lq.i) / (lq.n + lq.i + lq.e + lq.x)) + ' of searches · monthly sample'}
          color={C.blue}
        />
      </KpiRow>
      <Grid2>
        <Card title="New vs Improved by period (workbook)">
          <StackedBars
            cats={Y.map((r) => r[0])}
            series={[
              { n: 'New', c: C.purple, v: Y.map((r) => r[2]) },
              { n: 'Improved', c: C.magenta, v: Y.map((r) => r[3]) },
            ]}
            fmt={count}
          />
        </Card>
        <Card title="Last 3 months — search outcomes (sample)">
          <HBar
            rows={[
              ['New', lq.n],
              ['Improved', lq.i],
              ['Equal / verified', lq.e],
              ['No hit', lq.x],
            ]}
            color={[C.purple, C.magenta, '#9BC4E8', '#A7A9AC']}
            fmt={count}
          />
          <p className="note">Monthly split is illustrative; period totals are from the workbook.</p>
        </Card>
      </Grid2>
      <div className="card">
        <table>
          <tbody>
            <tr>
              <th>Period</th>
              <th className="num">Corrected {unit}</th>
              <th className="num">New</th>
              <th className="num">Improved</th>
              <th className="num">New share</th>
              <th className="num">Improved share</th>
            </tr>
            {Y.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td className="num">{int(r[1])}</td>
                <td className="num">{int(r[2])}</td>
                <td className="num">{int(r[3])}</td>
                <td className="num">{pct(r[2] / r[1])}</td>
                <td className="num">{pct(r[3] / r[1])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {S.yoy.rm.some((r) => r[1] == null) && !state.present && <p className="note">Jan–Jun 2025 New/Improved is blank in the workbook.</p>}
      </div>
    </>
  );
}
