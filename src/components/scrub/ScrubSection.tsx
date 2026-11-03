import type { ReactNode } from 'react';
import type { ScrubData } from '../../data/types';
import { sumRange, truncateToMonth } from '../../lib/dateRange';
import { count, moneyFull, money, pct } from '../../lib/format';
import { MEDICAID_SOURCE_LABEL, returnMailScale } from '../../lib/roi';
import { scrubTabs } from '../../state/dashboardState';
import { useDashboard } from '../../state/DashboardContext';
import { C } from '../../theme/colors';
import { StackedBars } from '../charts/StackedBars';
import { TrendLine } from '../charts/TrendLine';
import { NumericTable } from '../common/DataTable';
import { Kpi, KpiRow } from '../common/Kpi';
import { Card, Grid2, InternalNote, MockTag, RangeChip } from '../common/Labels';
import { ToggleButton } from '../common/ToggleGroup';
import { MedicaidSourceToggle, ReturnMailLevelToggle } from './Toggles';

const n0 = (v: number | null) => (v == null ? '—' : count(v));
const last3 = (a: number[]) => sumRange(a, a.length - 3, a.length);
const prior3 = (a: number[]) => sumRange(a, a.length - 6, a.length - 3);

/**
 * Scrub trends: monthly series (illustrative sample) plus workbook year-over-year blocks.
 * `embed` is the compact form shown at the bottom of a workflow detail page (no tabs, no internal flags box).
 */
export function ScrubSection({ embed }: { embed?: boolean }) {
  const { ds, state, dispatch, client, calendar, usesEin, medF, guarRatio } = useDashboard();
  const { fI, tI } = state.range;
  const scrub = state.scrub;
  const S: ScrubData = truncateToMonth(ds.scrubData[state.clientKey], tI);
  const months = calendar.slice(fI, tI + 1);
  const sl = <T,>(a: T[]) => a.slice(fI, tI + 1);
  const Y = S.yoy;
  const tabs = scrubTabs(client);

  const header = embed ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 10px', flexWrap: 'wrap' }}>
      <p className="title" style={{ fontSize: 19 }}>
        Scrub trends
      </p>
      {!state.present && <MockTag gray>MONTHLY = ILLUSTRATIVE · YEAR-OVER-YEAR = WORKBOOK</MockTag>}
      <span className="spacer"></span>
      <RangeChip />
    </div>
  ) : (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 10px', flexWrap: 'wrap' }}>
        <p className="title" style={{ fontSize: 19 }}>
          Scrub trends
        </p>
        <MockTag gray>MONTHLY = ILLUSTRATIVE · YEAR-OVER-YEAR = WORKBOOK</MockTag>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {tabs.map((t) => (
          <ToggleButton key={t[0]} kind="scb" value={t[0]} active={scrub === t[0]} color="#662D91" onClick={() => dispatch({ type: 'setScrub', scrub: t[0] })}>
            {t[1]}
          </ToggleButton>
        ))}
      </div>
    </>
  );

  const simple = (a: number[], label: string, col: string, yhd: string[], yrows: ReactNode[][]) => (
    <Grid2>
      <Card title={`${label} by month`}>
        <StackedBars cats={months} series={[{ n: label, c: col, v: sl(a) }]} fmt={count} />
      </Card>
      <Card title="Year-over-year detail (workbook)">
        <NumericTable headers={yhd} rows={yrows} />
      </Card>
    </Grid2>
  );

  let body: ReactNode = null;
  if (scrub === 'rm') {
    const sc = (n: number) => returnMailScale(n, state.rmLevel, guarRatio) as number;
    const R = { new: S.rm.new.map(sc), imp: S.rm.imp.map(sc), eq: S.rm.eq.map(sc), nh: S.rm.nh.map(sc) };
    const vol = R.new.map((_, i) => R.new[i] + R.imp[i] + R.eq[i] + R.nh[i]);
    const ni = R.new.map((x, i) => (x + R.imp[i]) / vol[i]);
    const hit = R.new.map((x, i) => (x + R.imp[i] + R.eq[i]) / vol[i]);
    const L = R.new.length;
    const qni = (last3(R.new) + last3(R.imp)) / last3(vol);
    const pni = (prior3(R.new) + prior3(R.imp)) / prior3(vol);
    const unit = state.rmLevel === 'guar' ? 'Guarantors' : 'Accounts';
    body = (
      <>
        <ReturnMailLevelToggle />
        <KpiRow>
          <Kpi label="New (last 3 mo of range)" value={n0(last3(R.new))} note={unit + ' with a new address'} color={C.purple} />
          <Kpi label="Improved (last 3 mo of range)" value={n0(last3(R.imp))} note={unit + ' with an improved address'} color={C.magenta} />
          <Kpi
            label="New + Improved rate"
            value={pct(qni)}
            note={L < 6 ? 'No prior quarter in data' : (qni >= pni ? '▲ ' : '▼ ') + ((qni - pni) * 100).toFixed(1) + ' pts vs prior qtr'}
            color={C.teal}
          />
          <Kpi label="Hit rate" value={pct(last3(hit.map((x, i) => x * vol[i])) / last3(vol))} note="New + improved + equal" color={C.blue} />
        </KpiRow>
        <Grid2>
          <Card title="Return mail results by month">
            <StackedBars
              cats={months}
              series={[
                { n: 'New', c: C.purple, v: sl(R.new) },
                { n: 'Improved', c: C.magenta, v: sl(R.imp) },
                { n: 'Equal / verified', c: '#9BC4E8', v: sl(R.eq) },
                { n: 'No hit', c: '#D0D3D8', v: sl(R.nh) },
              ]}
              fmt={count}
            />
          </Card>
          <Card title="New + Improved rate and hit rate">
            <TrendLine
              cats={months}
              series={[
                { n: 'New + Improved %', c: C.purple, v: sl(ni), w: 3 },
                { n: 'Hit rate', c: C.blue, v: sl(hit), w: 2, dash: true },
              ]}
              fmt={(v) => (v * 100).toFixed(0) + '%'}
            />
          </Card>
        </Grid2>
        {!embed && (
          <Grid2>
            <Card title="Year over year — New vs Improved (workbook)">
              <StackedBars
                cats={Y.rm.map((r) => r[0])}
                series={[
                  { n: 'New', c: C.purple, v: Y.rm.map((r) => r[2] || 0) },
                  { n: 'Improved', c: C.magenta, v: Y.rm.map((r) => r[3] || 0) },
                ]}
                fmt={count}
              />
            </Card>
            <Card title="Year-over-year detail (workbook)">
              <NumericTable
                headers={['Period', 'Volume', 'New', 'Improved', 'Improved share']}
                rows={Y.rm.map((r) => [r[0], n0(r[1]), n0(r[2]), n0(r[3]), r[1] ? pct((r[3] as number) / r[1]) : '—'])}
              />
              <br />
              <NumericTable headers={['Period', 'Return mail collections']} rows={Y.rmc.map((r) => [r[0], moneyFull(r[1])])} />
            </Card>
          </Grid2>
        )}
      </>
    );
  }
  if (scrub === 'piv') {
    const P = S.piv,
      ni = P.new.map((x, i) => x + P.imp[i]);
    body = (
      <>
        <KpiRow>
          <Kpi label="Volume (last 3 mo of range)" value={n0(last3(P.vol))} note="PIV transactions" color={C.blue} />
          <Kpi label="New %" value={pct(P.new[P.new.length - 1])} note="Latest month" color={C.purple} />
          <Kpi label="Improved %" value={pct(P.imp[P.imp.length - 1])} note="Latest month" color={C.magenta} />
          <Kpi label="New + Improved %" value={pct(ni[ni.length - 1])} note="Latest month" color={C.teal} />
        </KpiRow>
        <Grid2>
          <Card title="New % and Improved % by month">
            <TrendLine
              cats={months}
              series={[
                { n: 'New %', c: C.purple, v: sl(P.new), w: 3 },
                { n: 'Improved %', c: C.magenta, v: sl(P.imp), w: 3 },
                { n: 'New + Improved %', c: C.teal, v: sl(ni), w: 2, dash: true },
              ]}
              fmt={(v) => (v * 100).toFixed(1) + '%'}
              zero
            />
          </Card>
          <Card title="PIV volume by month">
            <StackedBars
              cats={months}
              series={[{ n: 'PIV transactions', c: C.blue, v: sl(P.vol) }]}
              fmt={(v) => count(v / 1000) + 'K'}
            />
          </Card>
        </Grid2>
        <Card title="Year-over-year detail (workbook)">
          <NumericTable
            headers={['Period', 'Volume', 'New %', 'Improved %', 'New + Improved %']}
            rows={Y.piv.map((r) => [r[0], n0(r[1]), pct(r[2]), pct(r[3]), pct(r[2] + r[3])])}
          />
        </Card>
      </>
    );
  }
  if (scrub === 'bk') {
    body = (
      <>
        <KpiRow>
          <Kpi label="Results (last 3 mo of range)" value={n0(last3(S.bk))} note="Bankruptcy hits" color={C.magenta} />
          <Kpi label="Prior 3 months" value={n0(prior3(S.bk))} note="For comparison" color={C.gray} />
        </KpiRow>
        {simple(S.bk, 'Bankruptcy results', C.magenta, ['Period', 'Results', 'Balance'], Y.bk.map((r) => [r[0], n0(r[1]), moneyFull(r[2])]))}
      </>
    );
  }
  if (scrub === 'dc') {
    body = (
      <>
        <KpiRow>
          <Kpi label="Results (last 3 mo of range)" value={n0(last3(S.dc))} note="Deceased hits" color={C.gray} />
          <Kpi label="Prior 3 months" value={n0(prior3(S.dc))} note="For comparison" color={C.blue} />
        </KpiRow>
        {simple(S.dc, 'Deceased results', C.gray, ['Period', 'Results'], Y.dc.map((r) => [r[0], n0(r[1])]))}
      </>
    );
  }
  if (scrub === 'mc') {
    const f = medF('cov');
    const cov = S.mc.cov.map((x) => Math.round(x * f));
    const hr = cov.map((x, i) => x / S.mc.rec[i]);
    const payHeader = 'Medicaid payments' + (state.medSrc !== 'all' && usesEin ? ' (' + MEDICAID_SOURCE_LABEL[state.medSrc] + ')' : '');
    body = (
      <>
        <MedicaidSourceToggle />
        <KpiRow>
          <Kpi label="Coverage found (last 3 mo of range)" value={n0(last3(cov))} note="Active Medicaid" color={C.blue} />
          <Kpi label="Hit rate" value={pct(hr[hr.length - 1])} note="Latest month" color={C.teal} />
        </KpiRow>
        <Grid2>
          <Card title="Active coverage found by month">
            <StackedBars cats={months} series={[{ n: 'Coverage found', c: C.blue, v: sl(cov) }]} fmt={count} />
          </Card>
          <Card title="Medicaid hit rate by month">
            <TrendLine cats={months} series={[{ n: 'Hit rate', c: C.teal, v: sl(hr), w: 3 }]} fmt={(v) => (v * 100).toFixed(1) + '%'} />
          </Card>
        </Grid2>
        <Card title="Year-over-year detail (workbook)">
          <NumericTable
            headers={['Period', payHeader, 'Hit rate']}
            rows={Y.mc.map((r) => [r[0], moneyFull(r[1] * medF('pay')), pct(r[2] * medF('cov'))])}
          />
        </Card>
      </>
    );
  }
  if (scrub === 'ch') {
    body = (
      <>
        <KpiRow>
          <Kpi label="Qualified (last 3 mo of range)" value={n0(last3(S.ch))} note="Charity accounts" color={C.orange} />
        </KpiRow>
        {simple(S.ch, 'Charity accounts qualified', C.orange, ['Period', 'Accounts', 'Balance'], Y.ch.map((r) => [r[0], n0(r[1]), money(r[2])]))}
      </>
    );
  }

  return (
    <>
      {header}
      {body}
      {!state.present && <p className="note">{S.known}</p>}
      {!state.present && !embed && (
        <InternalNote label="Internal data flags:">
          <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
            {S.flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </InternalNote>
      )}
    </>
  );
}
