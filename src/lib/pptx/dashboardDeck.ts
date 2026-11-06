/**
 * Figures and chart series for the Utilization Review deck.
 * Every number comes from the dashboard client that is open: the review, the selected
 * date range, workflow pages, and the year-over-year tables. Nothing is copied from the
 * template's example health system.
 */
import type { WorkflowChart, WorkflowDetail } from '../../data/types';
import { count, moneyFull, pct } from '../format';
import { returnMailScale, roiRatio } from '../roi';
import type { ChartPlot } from './chartCache';
import type { DeckInput } from './buildDeck';

const NOT = 'Not in this review';

function periodMonths(label: string, fallback = 12) {
  if (/jan\s*[–-]\s*jun|first half|\bh1\b/i.test(label)) return 6;
  if (/jul\s*[–-]\s*sep|\bq3\b/i.test(label)) return 3;
  if (/\d{1,2}\/\d{4}/.test(label) || /full year|jan\s*[–-]\s*dec/i.test(label)) return 12;
  return fallback > 0 ? fallback : 12;
}

function live(input: DeckInput, pattern: RegExp) {
  return input.details.find((detail) => !detail.empty && pattern.test(detail.name));
}

function kpi(detail: WorkflowDetail | undefined, pattern: RegExp) {
  return detail?.kpis?.find((row) => pattern.test(row[0]));
}

function tableValue(detail: WorkflowDetail | undefined, pattern: RegExp) {
  return detail?.table?.r.find((row) => pattern.test(row[0]))?.[1];
}

function chartMatching(detail: WorkflowDetail | undefined, pattern: RegExp) {
  return detail?.charts?.find((chart) => pattern.test(chart.t));
}

function last<T>(rows: T[]) {
  return rows.length ? rows[rows.length - 1] : undefined;
}

function shown(value: string | undefined) {
  return value && value.trim() ? value : NOT;
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  let number = Number(match[0]);
  if (/m\b/i.test(value)) number *= 1e6;
  else if (/k\b/i.test(value)) number *= 1e3;
  return number;
}

function hoursLine(detail: WorkflowDetail | undefined) {
  const hours = tableValue(detail, /hour/i);
  const fte = tableValue(detail, /fte/i);
  const note = kpi(detail, /automation/i)?.[2];
  const parts = [hours ? `${hours} hours` : '', fte ? `${fte} FTE` : '', note && note !== hours ? note : ''].filter(Boolean);
  return parts.length ? parts.join(', ') : NOT;
}

function dollarLine(detail: WorkflowDetail | undefined, pattern: RegExp, fallback?: string) {
  return tableValue(detail, pattern) || kpi(detail, pattern)?.[1] || fallback || NOT;
}

function formatOf(chart: WorkflowChart | undefined) {
  if (chart?.f === 'p') return '0%';
  if (chart?.f === '$') return '"$"#,##0';
  return '#,##0';
}

function oneSeries(name: string, chart: WorkflowChart | undefined, fallbackLabel: string): ChartPlot {
  if (!chart || !chart.cats.length) {
    return { categories: [fallbackLabel], series: [{ name, values: [0], format: '0%' }] };
  }
  return { categories: chart.cats, series: [{ name, values: chart.v, format: formatOf(chart) }] };
}

function yoyPlot(
  rows: (string | number | null)[][],
  series: { name: string; column: number; format?: string; scale?: (value: number) => number }[],
): ChartPlot {
  if (!rows.length) return { categories: [NOT], series: [{ name: series[0]?.name ?? NOT, values: [0] }] };
  return {
    categories: rows.map((row) => String(row[0])),
    series: series.map((spec) => ({
      name: spec.name,
      format: spec.format,
      values: rows.map((row) => {
        const raw = Number(row[spec.column] ?? 0);
        return spec.scale ? spec.scale(Number.isFinite(raw) ? raw : 0) : Number.isFinite(raw) ? raw : 0;
      }),
    })),
  };
}

function reviewMonths(input: DeckInput) {
  return input.client.trend.reviews.at(-1)?.m || 12;
}

/** Chart number in the template -> series taken from this dashboard client. */
export function dashboardChartPlots(input: DeckInput): Record<number, ChartPlot> {
  const yoy = input.scrub.yoy;
  const months = reviewMonths(input);
  const scaleCount = (value: number) => returnMailScale(value, input.rmLevel, input.guarRatio) ?? 0;
  const pfc = live(input, /financial clearance/i);
  const bk = live(input, /bankruptcy/i);
  const dc = live(input, /deceased/i);
  const mc = live(input, /medicaid/i);
  const ch = live(input, /charity/i);
  const period = input.client.period;

  const bkVolume = chartMatching(bk, /volume/i);
  const bkDollars = chartMatching(bk, /dollar/i);
  const bankruptcy =
    bkVolume && bkDollars
      ? {
          categories: bkVolume.cats,
          series: [
            { name: 'Bankruptcy volume', values: bkVolume.v, format: '#,##0' },
            { name: 'Bankruptcy dollars', values: bkDollars.v, format: '"$"#,##0' },
          ],
        }
      : yoyPlot(yoy.bk, [
          { name: 'Bankruptcy volume', column: 1, format: '#,##0' },
          { name: 'Bankruptcy dollars', column: 2, format: '"$"#,##0' },
        ]);

  const charityAccounts = chartMatching(ch, /account|volume/i);
  const charityBalance = chartMatching(ch, /balance|dollar/i);
  const charity =
    charityAccounts && charityBalance
      ? {
          categories: charityAccounts.cats,
          series: [
            { name: 'Volume', values: charityAccounts.v, format: '#,##0' },
            { name: 'Dollars', values: charityBalance.v, format: '"$"#,##0' },
          ],
        }
      : yoyPlot(yoy.ch, [
          { name: 'Volume', column: 1, format: '#,##0' },
          { name: 'Dollars', column: 2, format: '"$"#,##0' },
        ]);

  const payChart = chartMatching(mc, /payment/i);
  const hitChart = chartMatching(mc, /hit/i);
  const medicaid =
    payChart && hitChart
      ? {
          categories: payChart.cats,
          series: [
            { name: 'Payments', values: payChart.v, format: '"$"#,##0' },
            { name: 'Hit rate', values: hitChart.v, format: '0%' },
          ],
        }
      : yoyPlot(yoy.mc, [
          { name: 'Payments', column: 1, format: '"$"#,##0' },
          { name: 'Hit rate', column: 2, format: '0%' },
        ]);

  const dcVolume = chartMatching(dc, /volume/i);
  const dcCollections = chartMatching(dc, /collection/i);
  const collectionKpi = parseNumber(kpi(dc, /collection/i)?.[1]);

  const seg = input.client.seg;
  const trend = input.client.trend.seg;
  const segmentPlot = (index: number): ChartPlot => {
    if (trend?.years.length) {
      return {
        categories: trend.years,
        series: [{ name: `Segment ${index + 1}`, values: trend.vol[index] ?? [], format: '0%' }],
      };
    }
    return {
      categories: [period],
      series: [{ name: `Segment ${index + 1}`, values: [seg?.pay[index] ?? 0], format: '0%' }],
    };
  };

  const mix = input.client.scrubs.filter((row) => row[1] > 0);
  const scorecard: ChartPlot = {
    categories: mix.length ? mix.map((row) => row[0]) : ['Quantified benefit'],
    series: [
      {
        name: 'Quantified benefit',
        values: mix.length ? mix.map((row) => row[1]) : [input.client.quantified],
        format: '"$"#,##0',
      },
    ],
  };

  const piv = yoyPlot(yoy.piv, [
    { name: 'Total', column: 1, format: '#,##0' },
    { name: 'Monthly average', column: 1, format: '#,##0' },
    { name: 'New & improved', column: 2, format: '0%' },
  ]);
  if (yoy.piv.length) {
    piv.series[1] = {
      name: 'Monthly average',
      format: '#,##0',
      values: yoy.piv.map((row) => (Number(row[1]) || 0) / periodMonths(String(row[0]), months)),
    };
    piv.series[2] = {
      name: 'New & improved',
      format: '0%',
      values: yoy.piv.map((row) => (Number(row[2]) || 0) + (Number(row[3]) || 0)),
    };
  }

  return {
    1: piv,
    2: {
      categories: piv.categories,
      series: [piv.series[0], piv.series[1]],
    },
    3: oneSeries(period, chartMatching(pfc, /propensity/i), period),
    4: oneSeries(period, chartMatching(pfc, /fpl/i), period),
    5: bankruptcy,
    6: {
      categories: bankruptcy.categories,
      series: [{ name: 'Bankruptcy volume', values: bankruptcy.series[0]?.values ?? [], format: '#,##0' }],
    },
    7: dcVolume
      ? { categories: dcVolume.cats, series: [{ name: 'Deceased volume', values: dcVolume.v, format: '#,##0' }] }
      : yoyPlot(yoy.dc, [{ name: 'Deceased volume', column: 1, format: '#,##0' }]),
    8: dcCollections
      ? { categories: dcCollections.cats, series: [{ name: 'Collections', values: dcCollections.v, format: '"$"#,##0.00' }] }
      : {
          categories: [period],
          series: [{ name: 'Collections', values: [collectionKpi ?? 0], format: '"$"#,##0.00' }],
        },
    9: yoyPlot(yoy.rm, [
      { name: 'Return mail volume', column: 1, format: '#,##0', scale: scaleCount },
      { name: 'New', column: 2, format: '#,##0', scale: scaleCount },
      { name: 'Improved', column: 3, format: '#,##0', scale: scaleCount },
    ]),
    10: yoyPlot(yoy.rmc, [{ name: 'Collections', column: 1, format: '"$"#,##0.00' }]),
    11: medicaid,
    12: charity,
    13: { categories: ['Segment 1', 'Segment 2', 'Segment 3', 'Segment 4', 'Segment 5'], series: [{ name: '% of volume', values: seg?.vol ?? [], format: '0%' }] },
    14: { categories: ['Segment 1', 'Segment 2', 'Segment 3', 'Segment 4', 'Segment 5'], series: [{ name: '% of payments', values: seg?.pay ?? [], format: '0%' }] },
    15: segmentPlot(0),
    16: segmentPlot(1),
    17: segmentPlot(2),
    18: segmentPlot(3),
    19: segmentPlot(4),
    20: scorecard,
  };
}

interface Phrases {
  name: string;
  when: string;
  dates: string;
  searches: string;
  searchAvg: string;
  newPct: string;
  impPct: string;
  bothPct: string;
  statement: string;
  avHours: string;
  avCost: string;
  impacted: string;
  pfcSearches: string;
  pfcAvg: string;
  high: string;
  medium: string;
  low: string;
  unknown: string;
  fpl: string[];
  bkMonitored: string;
  bkFound: string;
  bkHours: string;
  bkCost: string;
  bkRecovery: string;
  dcScrubbed: string;
  dcResults: string;
  dcAvg: string;
  dcHours: string;
  dcCost: string;
  dcCollections: string;
  rmScrubbed: string;
  rmAvg: string;
  rmHours: string;
  rmCost: string;
  rmCollections: string;
  dialerAccounts: string;
  dialerAvg: string;
  dialerPay: string;
  mcScrubbed: string;
  mcAvg: string;
  mcFinds: string;
  mcRate: string;
  mcPay: string;
  mcPayAvg: string;
  mcHours: string;
  mcCost: string;
  mcStatement: string;
  chResults: string;
  chAvg: string;
  chHours: string;
  chCost: string;
  chStatement: string;
  vendor: string;
  take: Record<string, string>;
  volumeNote: string;
  shine: string;
  improve: string;
  area: string;
  roi: string;
  quantified: string;
  lift: string;
  fte: string;
  valueQueue: string[];
  deceasedQueue: string[];
  extraQueue: string[];
}

function band(chart: WorkflowChart | undefined, pattern: RegExp) {
  if (!chart) return NOT;
  const index = chart.cats.findIndex((cat) => pattern.test(cat));
  return index >= 0 ? pct(chart.v[index] ?? 0) : NOT;
}

function phrasesFor(input: DeckInput): Phrases {
  const months = reviewMonths(input);
  const pfc = live(input, /financial clearance/i);
  const av = live(input, /address verification/i) ?? pfc;
  const bk = live(input, /bankruptcy/i);
  const dc = live(input, /deceased/i);
  const rm = live(input, /return mail/i);
  const mc = live(input, /medicaid/i);
  const ch = live(input, /charity/i);
  const piv = last(input.scrub.yoy.piv);
  const pivMonths = periodMonths(String(piv?.[0] ?? input.client.period), months);
  const searchesN = Number(piv?.[1] ?? parseNumber(kpi(av, /search|transaction|volume/i)?.[1]) ?? 0);
  const newRate = Number(piv?.[2] ?? NaN);
  const impRate = Number(piv?.[3] ?? NaN);
  const rmRow = last(input.scrub.yoy.rm);
  const rmMonths = periodMonths(String(rmRow?.[0] ?? input.client.period), months);
  const rmCount = returnMailScale(rmRow?.[1] == null ? null : Number(rmRow[1]), input.rmLevel, input.guarRatio);
  const rmc = last(input.scrub.yoy.rmc);
  const rangeMonths = Math.max(1, input.range.tI - input.range.fI + 1);
  const attempts = input.monthly.dialer.attempts.slice(input.range.fI, input.range.tI + 1).reduce((sum, value) => sum + value, 0);
  const dialerPay = input.monthly.dialer.payments.slice(input.range.fI, input.range.tI + 1).reduce((sum, value) => sum + value, 0);
  const propensity = chartMatching(pfc, /propensity/i);
  const fpl = chartMatching(pfc, /fpl/i);
  const bkLast = last(input.scrub.yoy.bk);
  const dcLast = last(input.scrub.yoy.dc);
  const chLast = last(input.scrub.yoy.ch);
  const mcLast = last(input.scrub.yoy.mc);
  const takeOf = (detail: WorkflowDetail | undefined) => detail?.take || NOT;
  const prior = input.scrub.yoy.piv.at(-2);
  const volumeNote =
    piv && prior
      ? `Address searches ${count(Number(prior[1]) || 0)} (${prior[0]}) vs ${count(Number(piv[1]) || 0)} (${piv[0]}).`
      : takeOf(av);

  const statement = shown(tableValue(av, /statement/i) || tableValue(rm, /statement/i));
  const avHours = hoursLine(av);
  const avCost = dollarLine(av, /manual work|labor/i);
  const impacted = shown(kpi(av, /impacted|AR/i)?.[1] || tableValue(av, /impacted/i));
  const bkHours = hoursLine(bk);
  const bkCost = dollarLine(bk, /automation|labor|cost/i);
  const dcHours = hoursLine(dc);
  const dcCost = dollarLine(dc, /automation|labor|cost/i);
  const rmHours = hoursLine(rm);
  const rmCost = dollarLine(rm, /labor|cost|automation/i);
  const mcStatement = shown(tableValue(mc, /statement/i));
  const chStatement = shown(kpi(ch, /statement/i)?.[1] || tableValue(ch, /statement/i));
  const mcPay = mc ? shown(kpi(mc, /payment/i)?.[1] || (mcLast ? moneyFull(Number(mcLast[1]) || 0) : undefined)) : NOT;
  const dcCollections = shown(kpi(dc, /collection/i)?.[1]);
  const rmCollections = shown(rmc ? moneyFull(Number(rmc[1]) || 0) : kpi(rm, /collection/i)?.[1]);
  const roi = input.client.quantified === 0 ? '—' : roiRatio(input.client.quantified, input.client.sub).toFixed(1);

  const fteParts = input.details
    .filter((detail) => !detail.empty)
    .map((detail) => {
      const fte = tableValue(detail, /fte/i);
      return fte ? `${detail.name.split(' / ')[0]} ${fte} FTE` : '';
    })
    .filter(Boolean);
  const fte = input.client.fte != null ? `${input.client.fte} FTE` : fteParts.length ? fteParts.join('; ') : NOT;

  return {
    name: input.client.name,
    when: `${input.client.period} · ${input.rangeLabel}`,
    dates: input.rangeLabel,
    searches: count(searchesN),
    searchAvg: count(searchesN / pivMonths),
    newPct: Number.isFinite(newRate) ? pct(newRate) : shown(kpi(av, /new address/i)?.[1]),
    impPct: Number.isFinite(impRate) ? pct(impRate) : shown(kpi(av, /improved address/i)?.[1]),
    bothPct: Number.isFinite(newRate) && Number.isFinite(impRate) ? pct(newRate + impRate) : shown(kpi(av, /new \+|new &|total new/i)?.[1]),
    statement,
    avHours,
    avCost,
    impacted,
    pfcSearches: shown(kpi(pfc, /pfc search/i)?.[1] || kpi(pfc, /search/i)?.[1] || kpi(pfc, /transaction|volume/i)?.[1] || count(searchesN)),
    pfcAvg: shown(kpi(pfc, /avg monthly|average/i)?.[1] || count(searchesN / pivMonths)),
    high: band(propensity, /high/i),
    medium: band(propensity, /med/i),
    low: band(propensity, /^low/i),
    unknown: band(propensity, /nc|unknown|no credit/i),
    fpl: [/1\s*[–-]?\s*100/, /101/, /201/, /301/, /401/, /501/, /no fpl/i].map((pattern) => band(fpl, pattern)),
    bkMonitored: shown(kpi(bk, /monitor/i)?.[1]),
    bkFound: bkLast ? `${count(Number(bkLast[1]) || 0)} @ ${moneyFull(Number(bkLast[2]) || 0)}` : shown(kpi(bk, /result/i)?.[1]),
    bkHours,
    bkCost,
    bkRecovery: bkLast ? `${moneyFull(Number(bkLast[2]) || 0)} impacted balance (${bkLast[0]}). Contingency is not separated on this dashboard.` : NOT,
    dcScrubbed: shown(kpi(dc, /monitor|scrub/i)?.[1]),
    dcResults: shown(kpi(dc, /result/i)?.[1] || (dcLast ? count(Number(dcLast[1]) || 0) : undefined)),
    dcAvg: dcLast ? count((Number(dcLast[1]) || 0) / periodMonths(String(dcLast[0]), months)) : NOT,
    dcHours,
    dcCost,
    dcCollections,
    rmScrubbed: shown(rmCount == null ? kpi(rm, /account|result/i)?.[1] : count(rmCount)),
    rmAvg: rmCount == null ? NOT : count(rmCount / rmMonths),
    rmHours,
    rmCost,
    rmCollections,
    dialerAccounts: `${count(attempts)} (illustrative)`,
    dialerAvg: count(attempts / rangeMonths),
    dialerPay: `${moneyFull(dialerPay)} (illustrative)`,
    mcScrubbed: shown(kpi(mc, /record|scrub/i)?.[1]),
    mcAvg: shown(kpi(mc, /avg|average/i)?.[1]),
    mcFinds: shown(kpi(mc, /coverage|find/i)?.[1]),
    mcRate: mcLast ? `${pct(Number(mcLast[2]) || 0)} of the latest dashboard year` : NOT,
    mcPay,
    mcPayAvg: NOT,
    mcHours: hoursLine(mc),
    mcCost: dollarLine(mc, /labor|cost|automation/i),
    mcStatement,
    chResults: chLast ? `${count(Number(chLast[1]) || 0)} @ ${moneyFull(Number(chLast[2]) || 0)}` : shown(kpi(ch, /qualified account|identified|result/i)?.[1]),
    chAvg: shown(kpi(ch, /avg|average/i)?.[1]),
    chHours: hoursLine(ch),
    chCost: dollarLine(ch, /labor|cost|automation/i),
    chStatement,
    vendor: NOT,
    take: { pfc: takeOf(pfc), av: takeOf(av), bk: takeOf(bk), dc: takeOf(dc), rm: takeOf(rm), dialer: 'Dialer counts are illustrative sample data for the selected dates.', mc: takeOf(mc), ch: takeOf(ch), agency: NOT },
    volumeNote,
    shine: `${input.client.name} quantified benefit ${input.client.quantified === 0 ? 'is $0' : moneyFull(input.client.quantified)} for ${input.client.period}.`,
    improve: input.client.recs[0] || NOT,
    area: input.client.cash.liftLabel || 'this review',
    roi,
    quantified: moneyFull(input.client.quantified),
    lift: moneyFull(input.client.cash.lift),
    fte,
    valueQueue: [statement, avHours, avCost, bkHours, bkCost, bkLast ? moneyFull(Number(bkLast[2]) || 0) : NOT, dcHours, dcCost, dcCollections],
    deceasedQueue: [dcCollections, rmHours, rmCost, NOT, `${moneyFull(dialerPay)} (illustrative)`, mcPay, hoursLine(mc), dollarLine(mc, /labor|cost|automation/i), NOT],
    extraQueue: [rmCollections, `${moneyFull(dialerPay)} (illustrative)`],
  };
}

function sectionFrom(text: string) {
  if (/dialer/i.test(text)) return 'dialer';
  if (/patient financial clearance/i.test(text)) return 'pfc';
  if (/address verification/i.test(text)) return 'av';
  if (/bankruptcy/i.test(text)) return 'bk';
  if (/deceased/i.test(text)) return 'dc';
  if (/return mail/i.test(text)) return 'rm';
  if (/medicaid/i.test(text)) return 'mc';
  if (/charity|presumptive/i.test(text)) return 'ch';
  if (/agency/i.test(text)) return 'agency';
  if (/segmentation/i.test(text)) return 'seg';
  return '';
}

function named(text: string, name: string) {
  if (!/used by/i.test(text)) return null;
  const next = text.replace(/<<<Insert>>>|<<Insert>>|<<insert>>/g, name);
  return next === text ? null : next;
}

function swapPeriod(text: string, when: string) {
  if (!/<<Insert Period>{2,3}/i.test(text)) return null;
  return text.replace(/<<Insert Period>{2,3}/gi, when);
}

/** Fill leftover template placeholders on one slide from the open dashboard client. */
export function applyDashboardText(xml: string, input: DeckInput) {
  const phrase = phrasesFor(input);
  let section = '';
  let expectProcess = false;
  let queue: string[] | null = null;
  let queueIndex = 0;
  let statementIndex = 0;
  let actionIndex = 0;
  const actions = input.client.recs.length ? input.client.recs : [NOT];
  return xml.replace(/<a:t(\s[^>]*)?>([^<]*)<\/a:t>/g, (full, attrs: string | undefined, inner: string) => {
    const text = inner
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    const found = sectionFrom(text);
    if (found) section = found;
    if (text === 'Collection Optimization: Value Delivery') expectProcess = true;
    if (text.startsWith('Collection Optimization: Additional Benefits')) {
      queue = phrase.extraQueue;
      queueIndex = 0;
      expectProcess = false;
    }
    if (expectProcess && text && !/^(Process|Value Summary|Value|ROI Benefit)$/.test(text) && !/insert|xxxx/i.test(text)) {
      if (text === 'Address Verification') queue = phrase.valueQueue;
      else if (text === 'Deceased Scrub') queue = phrase.deceasedQueue;
      else queue = null;
      queueIndex = 0;
      expectProcess = false;
    }
    const next = fillRun(text, phrase, section, queue, () => {
      const value = queue![queueIndex] ?? NOT;
      queueIndex += 1;
      return value;
    }, () => {
      const value = statementIndex === 0 ? phrase.mcStatement : phrase.chStatement;
      statementIndex += 1;
      return value;
    }, () => {
      const value = actions[actionIndex] ?? actions[actionIndex % actions.length];
      actionIndex += 1;
      return value;
    });
    if (next == null) return full;
    return `<a:t${attrs ?? ''}>${next.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a:t>`;
  });
}

function fillRun(
  text: string,
  phrase: Phrases,
  section: string,
  queue: string[] | null,
  takeQueued: () => string,
  takeStatement: () => string,
  takeAction: () => string,
): string | null {
  const trimmed = text.trim();
  if (/^x+$/i.test(trimmed) && queue) return takeQueued();
  if (trimmed === '<<$ Statement Cost Avoidance>>') return takeStatement();
  const titled = named(text, phrase.name) ?? swapPeriod(text, phrase.when);
  if (titled) return titled;
  if (text.includes('University of Utah')) return text.split('University of Utah Health').join(phrase.name).split('University of Utah').join(phrase.name);
  if (trimmed === 'August 6, 2026') return phrase.when;
  if (/458k vs 498k/.test(text)) return phrase.volumeNote;
  if (/^Insert Observations/i.test(trimmed) || trimmed === 'Insert observations') return phrase.take[section] || NOT;
  if (/^FTE Hours or X+ FTE/i.test(trimmed)) return hoursFor(section, phrase);
  if (/contingency fee of xxx%/i.test(text)) return 'Contingency is not separated on this dashboard.';
  if (trimmed === '<<$' || trimmed === '>>') return '';
  if (trimmed === '>> - insert collections (Dashboard)') return 'collections';
  if (trimmed === '>> - insert Dialer Call Attribution') return 'dialer payments, illustrative';
  if (trimmed === 'Insert proposed action') return takeAction();
  if (trimmed === '<<<Insert>>> average monthly transaction') return `${section === 'pfc' ? phrase.pfcAvg : phrase.searchAvg} average monthly transaction`;
  if (trimmed === '<<Insert>>') return section === 'av' || section === 'pfc' ? phrase.statement : phrase.name;
  if (trimmed.startsWith('Recovery:')) return section === 'dc' ? `Recovery: ${phrase.dcCollections}. Contingency is not separated on this dashboard.` : phrase.bkRecovery;
  if (trimmed.startsWith('Recovery Since Go Live')) return 'Go-live date is not on this dashboard.';
  if (/HIS that has created efficiencies/i.test(text)) return phrase.shine;

  const exact: Record<string, string> = {
    '<<<Insert>>> total address searches': `${phrase.searches} total address searches`,
    '<<Insert>>> total address searches': `${phrase.searches} total address searches`,
    'New Addresses Results: <<Insert %>>': `New Addresses Results: ${phrase.newPct}`,
    'Improved Address Results: <<Insert %>>': `Improved Address Results: ${phrase.impPct}`,
    'Total New & Improved: <<Insert %>>': `Total New & Improved: ${phrase.bothPct}`,
    '<<Insert hours, FTE and wage impact>>': phrase.avHours,
    '<<Insert>> in initial patient responsibility': `${phrase.impacted} in initial patient responsibility`,
    'Insert observations for this': phrase.take.av || phrase.volumeNote,
    '<<Insert>>> total financial clearance searches': `${phrase.pfcSearches} total financial clearance searches`,
    'High: <<Insert %>>': `High: ${phrase.high}`,
    'Medium: <<Insert %>>': `Medium: ${phrase.medium}`,
    'Low: <<Insert %>>': `Low: ${phrase.low}`,
    'No Credit or Unknown: <<Insert %>>': `No Credit or Unknown: ${phrase.unknown}`,
    '1-100%: <<Insert %>>': `1-100%: ${phrase.fpl[0]}`,
    '101-200%: <<Insert %>>': `101-200%: ${phrase.fpl[1]}`,
    '201-300%: <<Insert %>>': `201-300%: ${phrase.fpl[2]}`,
    '301-400%: <<Insert %>>': `301-400%: ${phrase.fpl[3]}`,
    '401-500%: <<Insert %>>': `401-500%: ${phrase.fpl[4]}`,
    '501%+ <<Insert %>>': `501%+ ${phrase.fpl[5]}`,
    'Total accounts monitored for Bankruptcy: <<Insert>>': `Total accounts monitored for Bankruptcy: ${phrase.bkMonitored}`,
    'Total bankruptcies identified: <<Insert Volume @ Insert Dollars>>': `Total bankruptcies identified: ${phrase.bkFound}`,
    'Chapter 7: <<insert %>>': 'Chapter 7: not on this dashboard',
    'Chapter 13: <<Insert %>>': 'Chapter 13: not on this dashboard',
    '<<Insert %>> Petitioned': 'Petitioned: not on this dashboard',
    '<<Insert %>> Discharged': 'Discharged: not on this dashboard',
    '<<Insert %>> Dismissed': 'Dismissed: not on this dashboard',
    'Compliance Mitigation: <<Insert Bankruptcy Result Volume>>': `Compliance Mitigation: ${phrase.bkFound}`,
    '<<Insert>> hours or <<insert>> FTEs in automation': phrase.bkHours,
    '<<Insert>> FTE Cost Savings': phrase.bkCost,
    'Bankruptcy Scrub: <<Insert>>': `Bankruptcy Scrub: ${phrase.when}`,
    'Total accounts scrubbed for Deceased (recurring): <<Insert>>': `Total accounts scrubbed for Deceased (recurring): ${phrase.dcScrubbed}`,
    'Deceased results: <<Insert Volume>>': `Deceased results: ${phrase.dcResults}`,
    'Average monthly: <<Insert>>>': `Average monthly: ${section === 'dc' ? phrase.dcAvg : phrase.rmAvg}`,
    '<<insert>>hours or <<insert>> FTE’s': hoursFor(section, phrase),
    '<<insert>> FTE Cost savings': costFor(section, phrase),
    'Deceased Collections: $<<insert>>': `Deceased Collections: ${phrase.dcCollections}`,
    'Total accounts scrubbed for Return Mail: <<Insert>>': `Total accounts scrubbed for Return Mail: ${phrase.rmScrubbed}`,
    'Return Mail Collections: $<<insert>>': `Return Mail Collections: ${phrase.rmCollections}`,
    'Average monthly: <<Insert Volume>>>': `Average monthly: ${section === 'dialer' ? phrase.dialerAvg : phrase.rmAvg}`,
    'Campaign Attributed Payments: $<<insert>>': `Campaign Attributed Payments: ${phrase.dialerPay}`,
    'Total records scrubbed: <<Insert Volume @ $Insert Dollars>>': `Total records scrubbed: ${phrase.mcScrubbed}`,
    'Average monthly: <<Insert Volume @ $Insert Dollars>>': `Average monthly: ${section === 'mc' ? phrase.mcAvg : phrase.chAvg}`,
    'Total Active Medicaid Finds: <<Insert Volume @ $Insert Dollars>>': `Total Active Medicaid Finds: ${phrase.mcFinds}`,
    'Find Rate: <<insert %>> of volume / <<Insert %>> of dollars': `Find Rate: ${phrase.mcRate}`,
    'Medicaid Payments: $<<Insert>>': `Medicaid Payments: ${phrase.mcPay}`,
    'Average Monthly: $<<Insert>>': `Average Monthly: ${phrase.mcPayAvg}`,
    'Charity Results: <<Insert Volume @ $Insert Dollars>>': `Charity Results: ${phrase.chResults}`,
    'Statement Cost Avoidance: $<<insert>>': `Statement Cost Avoidance: ${phrase.chStatement}`,
    '<Insert Volume>': phrase.searches,
    'Insert % New, % Improved, Total New & Improved %': `${phrase.newPct} new, ${phrase.impPct} improved, ${phrase.bothPct} new and improved`,
    '<Insert $>': phrase.impacted,
    '<Insert volume>': phrase.pfcSearches,
    '<Insert volume monitored>': phrase.bkMonitored,
    '<Insert % Chapter 7 and % Chapter 13>': 'Chapter split is not on this dashboard.',
    '<Insert volume scrubbed>': phrase.dcScrubbed,
    '<Insert deceased hit volume>': phrase.dcResults,
    '<Insert Volume Scrubbed / Balance Scrubbed>': phrase.mcScrubbed,
    '<Insert active volume / balance>': phrase.mcFinds,
    '<Insert Find %>': phrase.mcRate,
    '<<Insert volume & charity amount>>': phrase.chResults,
    '<<Insert volume & dollars>>': phrase.vendor,
    '<<Insert where shine – example below>>': phrase.shine,
    '<<Insert where to improved – example below>>': phrase.improve,
    '<<Insert client name>>': phrase.name,
    '<<Insert area>>': phrase.area,
    '<<Insert lift>>>': phrase.lift,
    '<<insert sum of dollar value>>': phrase.quantified,
    '<<insert>> FTE  Hour Savings via Automation (insert # FTE)': `${phrase.fte} hour savings via automation`,
    '10 : 1 ROI': `${phrase.roi} : 1 ROI`,
    Insert: phrase.shine,
  };
  if (trimmed in exact) return exact[trimmed];
  if (/<<|<Insert|Insert |x{4,}|xxx%/i.test(text)) return NOT;
  return null;
}

function hoursFor(section: string, phrase: Phrases) {
  if (section === 'bk') return phrase.bkHours;
  if (section === 'dc') return phrase.dcHours;
  if (section === 'rm') return phrase.rmHours;
  if (section === 'mc') return phrase.mcHours;
  if (section === 'ch') return phrase.chHours;
  if (section === 'av' || section === 'pfc') return phrase.avHours;
  return NOT;
}

function costFor(section: string, phrase: Phrases) {
  if (section === 'bk') return phrase.bkCost;
  if (section === 'dc') return phrase.dcCost;
  if (section === 'rm') return phrase.rmCost;
  if (section === 'mc') return phrase.mcCost;
  if (section === 'ch') return phrase.chCost;
  if (section === 'av' || section === 'pfc') return phrase.avCost;
  return NOT;
}

/** Recommendations, then each workflow take, so every Success Plan bullet has dashboard text. */
export function successLines(input: DeckInput) {
  const lines = [
    ...input.client.recs,
    ...input.details.filter((detail) => !detail.empty && detail.take).map((detail) => `${detail.name.split(' / ')[0]}: ${detail.take}`),
  ];
  if (!lines.length) lines.push(`${input.client.name} · ${input.client.period}`);
  return lines;
}
