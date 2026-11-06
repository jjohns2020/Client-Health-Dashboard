import type {
  Client,
  DataLoad,
  Insight,
  MonthlySeries,
  Opportunity,
  ScrubData,
  ValueFormat,
  WorkflowDetail,
  WorkflowKey,
} from '../types';
import monthlySample from './monthly.json';
import rosterJson from './healthRoster.json';

/**
 * Active clients from the command center's 2025 ROI Stats roster.
 * MaineHealth and WashU stay on their hand-built workbooks; every other row becomes a mock workbook.
 * Free-text notes on the roster are not copied: several describe email and personal follow-ups.
 */
export interface HealthRosterRow {
  id: string;
  name: string;
  g: string;
  h1d: boolean;
  h2d: boolean;
  total: number | null;
  ratio: number | null;
  seg: number | null;
  med: number | null;
  db: number | null;
  rm: number | null;
  oth: number | null;
  char: number | null;
  fte: number | null;
  ftec: number | null;
}

export const healthRoster = rosterJson as HealthRosterRow[];

const HAND_BUILT = new Set(['maine', 'washu']);
const MONTHS = (monthlySample as { maine: { months: string[] } }).maine.months;
const N = MONTHS.length;

const dollars = (v: number | null) => (typeof v === 'number' && v > 0 ? v : 0);
const moneyLabel = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scaleTo(weights: number[], target: number) {
  const safe = Math.max(0, Math.round(target));
  if (safe === 0 || weights.length === 0) return weights.map(() => 0);
  const sum = weights.reduce((a, b) => a + b, 0);
  const rounded = weights.map((w) => Math.floor((w / sum) * safe));
  let left = safe - rounded.reduce((a, b) => a + b, 0);
  let i = 0;
  while (left > 0) {
    rounded[i % rounded.length] += 1;
    left -= 1;
    i += 1;
  }
  return rounded;
}

function sum(values: number[], start: number, end: number) {
  return values.slice(start, end).reduce((a, b) => a + b, 0);
}

interface BuiltClient {
  client: Client;
  monthly: MonthlySeries;
  scrub: ScrubData;
  details: Partial<Record<WorkflowKey, WorkflowDetail>>;
  insights: Insight[];
  opps: Opportunity[];
  months: number;
  loads: DataLoad[];
  guarRatio: number;
}

function buildOne(row: HealthRosterRow): BuiltClient {
  const rand = mulberry32(hash(row.id));
  const total = dollars(row.total);
  const ratio = dollars(row.ratio);
  const seg = dollars(row.seg);
  const med = dollars(row.med);
  const db = dollars(row.db);
  const rm = dollars(row.rm);
  const oth = dollars(row.oth);
  const char = dollars(row.char);
  const full = row.h2d;
  const reviewMonths = full ? 12 : 6;
  const windowEnd = full ? 9 : 6;
  const currentStart = 12;
  const currentEnd = full ? 21 : 18;
  const quantified = total;
  let sub = 1;
  let investmentNote = 'No quantified ROI in the 2025 ROI Stats. The subscription is a $1 placeholder so the ratio can render.';
  if (total > 0 && ratio > 0) {
    sub = Math.round(total / ratio);
    investmentNote = 'Subscription is the 2025 ROI Stats benefit divided by the stated ratio.';
  } else if (total > 0 && dollars(row.ftec) > 0) {
    sub = Math.round(dollars(row.ftec));
    investmentNote = 'The ROI ratio was not in the stats file. FTE cost is used as the investment figure.';
  }

  const scrubs: [string, number][] = [];
  if (seg > 0) scrubs.push(['Segmentation', seg]);
  if (med > 0) scrubs.push(['Medicaid', med]);
  if (db > 0) scrubs.push(['Deceased / Bankruptcy', db]);
  if (rm > 0) scrubs.push(['Return Mail', rm]);
  if (oth > 0) scrubs.push(['Other', oth]);
  const shown = scrubs.reduce((a, r) => a + r[1], 0);
  const gap = total - shown;
  if (total > 0 && shown === 0) scrubs.push(['Quantified benefit', total]);
  else if (gap >= 1) scrubs.push(['Other quantified value', gap]);

  const payTarget = Math.round(Math.max(total, 250000) * (full ? 6 : 4));
  const priorWeights = Array.from({ length: windowEnd }, () => 0.7 + rand());
  const currentWeights = Array.from({ length: currentEnd - currentStart }, () => 0.7 + rand());
  const pay = Array(N).fill(0);
  scaleTo(priorWeights, payTarget).forEach((v, i) => {
    pay[i] = v;
  });
  scaleTo(currentWeights, Math.round(payTarget * (1.04 + rand() * 0.08))).forEach((v, i) => {
    pay[currentStart + i] = v;
  });
  const fill = Math.max(1000, Math.round(payTarget / reviewMonths));
  for (let i = 0; i < N; i++) if (pay[i] === 0) pay[i] = Math.round(fill * (0.75 + rand() * 0.5));
  const payPrior = sum(pay, 0, windowEnd);
  const payCur = sum(pay, currentStart, currentEnd);
  const ratePrior = 0.07 + rand() * 0.04;
  const rateCur = Math.min(0.22, Math.max(0.04, ratePrior + (rand() - 0.45) * 0.02));
  const rate = Array.from({ length: N }, () => Math.min(0.25, Math.max(0.03, ratePrior + (rand() - 0.5) * 0.02)));
  const priorLabel = (full ? 'Jan–Sep 2024' : 'Jan–Jun 2024') + ' (illustrative)';
  const currentLabel = (full ? 'Jan–Sep 2025' : 'Jan–Jun 2025') + ' (illustrative)';
  const period = !total
    ? row.g === 'Implementation'
      ? 'In implementation — no quantified ROI yet'
      : 'No quantified ROI yet'
    : full
      ? '2025 full year'
      : row.h1d
        ? '2025 first half'
        : row.g;

  const size = Math.max(1, Math.sqrt(Math.max(total, 250000) / 1e6));
  const counts = (lo: number, hi: number) => Array.from({ length: N }, () => Math.max(1, Math.round((lo + (hi - lo) * rand()) * size)));
  const rmNew = counts(40, 120);
  const rmImp = counts(30, 90);
  const rmEq = counts(20, 70);
  const rmNh = counts(15, 50);
  const bk = counts(4, 24);
  const dc = counts(2, 14);
  const ch = counts(20, 80);
  const rec = counts(30, 90);
  const cov = rec.map((r) => Math.max(1, Math.min(r - 1, Math.round(r * (0.08 + rand() * 0.12)))));
  const pivVol = counts(800, 2400);
  const pivNew = Array.from({ length: N }, () => 0.08 + rand() * 0.12);
  const pivImp = Array.from({ length: N }, () => 0.05 + rand() * 0.1);
  const attempts = counts(400, 900);
  const contacts = attempts.map((a) => Math.max(1, Math.round(a * (0.18 + rand() * 0.2))));
  const dialerPay = attempts.map((a) => Math.round(a * (8 + rand() * 12)));

  const yoyWindow = (start: number) => ({
    rmVol: sum(rmNew, start, start + 6) + sum(rmImp, start, start + 6) + sum(rmEq, start, start + 6) + sum(rmNh, start, start + 6),
    rmNew: sum(rmNew, start, start + 6),
    rmImp: sum(rmImp, start, start + 6),
    bk: sum(bk, start, start + 6),
    dc: sum(dc, start, start + 6),
    ch: sum(ch, start, start + 6),
  });
  const y24 = yoyWindow(0);
  const y25 = yoyWindow(12);
  const rmShare = rm > 0 ? rm : 0;

  const ops: [string, number, ValueFormat][] = scrubs.map(([label, value]) => [label, value, '$']);
  if (char > 0) ops.push(['Charity identified', char, '$']);

  const details: Partial<Record<WorkflowKey, WorkflowDetail>> = {};
  const take = 'Headline dollars are the 2025 ROI Stats figure for this client. Monthly charts are illustrative.';
  if (med > 0)
    details.mc = {
      name: 'Medicaid',
      sub: 'Coverage found and payments counted in the ROI',
      src: '2025 ROI Stats',
      kpis: [['Medicaid benefit', moneyLabel(med), 'From the client health ROI roster']],
      trend: 'mc',
      take,
    };
  if (rm > 0)
    details.rm = {
      name: 'Return Mail',
      sub: 'Collections counted in the ROI',
      src: '2025 ROI Stats',
      kpis: [['Return mail benefit', moneyLabel(rm), 'From the client health ROI roster']],
      trend: 'rm',
      take,
    };
  if (db > 0)
    details.bk = {
      name: 'Deceased / Bankruptcy',
      sub: 'Combined deceased and bankruptcy benefit',
      src: '2025 ROI Stats',
      kpis: [['Deceased / bankruptcy benefit', moneyLabel(db), 'The roster stores these as one figure']],
      trend: 'bk',
      take,
    };
  if (char > 0)
    details.ch = {
      name: 'Charity',
      sub: 'Identified balance, not added to the ROI total',
      src: '2025 ROI Stats',
      kpis: [['Charity identified', moneyLabel(char), 'Balance identified; not part of quantified benefit']],
      trend: 'ch',
      take,
    };

  const top = scrubs[0];
  const insights: Insight[] = [];
  if (total > 0 && ratio > 0) {
    insights.push({
      area: 'roi',
      type: 'Observation',
      aud: 'client',
      title: `${row.name} ${period} ROI is ${ratio.toFixed(1)} : 1`,
      obs: `Quantified benefit is ${moneyLabel(total)}${top ? `, led by ${top[0].toLowerCase()} at ${moneyLabel(top[1])}` : ''}.`,
      so: 'Use this as the headline until a full workbook is loaded.',
      rec: 'Keep the next ROI review on the cadence already agreed with the client.',
      metric: `${ratio.toFixed(1)} : 1`,
    });
  } else if (total > 0) {
    insights.push({
      area: 'roi',
      type: 'Observation',
      aud: 'client',
      title: `${row.name} has a benefit figure and no stated ratio`,
      obs: `The roster lists ${moneyLabel(total)} of quantified benefit. ${investmentNote}`,
      so: 'Do not present the ratio as a workbook result.',
      rec: 'Confirm the subscription before the next review.',
      metric: moneyLabel(total),
    });
  } else {
    insights.push({
      area: 'roi',
      type: 'Observation',
      aud: 'client',
      title: 'No quantified ROI yet',
      obs: `${row.name} is ${row.g.toLowerCase()} in the client health roster, so this workspace has no benefit to show.`,
      so: 'Health and success views still apply. ROI starts at the first baseline.',
      rec: 'Agree when the first ROI baseline starts and which workflows it will count.',
      metric: '—',
    });
  }
  if (total > 0 && Math.abs(gap) >= 1 && shown > 0) {
    insights.push({
      area: 'roi',
      type: 'Data quality',
      aud: 'internal',
      title: 'Workflow mix does not equal the quantified total',
      obs: `Segmentation, Medicaid, deceased/bankruptcy, return mail, and other dollars ${gap > 0 ? 'fall short of' : 'exceed'} the roster total by ${moneyLabel(Math.abs(gap))}.`,
      so: 'The summary total is the figure client health uses. The mix is shown as reported.',
      rec: 'Reconcile the mix to the total before a client presentation.',
      metric: moneyLabel(Math.abs(gap)),
    });
  }
  insights.push({
    area: 'roi',
    type: 'Data quality',
    aud: 'internal',
    title: 'Monthly trends are illustrative',
    obs: investmentNote + ' Cash-impact payments and every monthly series are generated so the charts render. They are not workbook extracts.',
    so: 'Present the headline benefit and ratio. Do not present the monthly shape as client data.',
    rec: 'Replace this mock workbook when the client’s ROI file is loaded.',
    metric: 'Illustrative',
  });

  const opps: Opportunity[] = [];
  if (total > 0 && top) {
    opps.push({
      w: top[0],
      o: `Extend ${top[0].toLowerCase()} beyond the current review`,
      v: Math.round(total * 0.05),
      src: 'Illustrative — not part of the ROI',
      st: 'Not yet discussed',
    });
  }

  const recs = total
    ? [top ? `Review the ${top[0].toLowerCase()} result in the next ROI` : 'Review the quantified benefit in the next ROI', 'Keep the ROI review on its cadence']
    : ['Agree when the first ROI baseline starts', 'Confirm which workflows the first review will count'];

  const reviewLabel = full ? '2025 full year' : 'Jan–Jun 2025';
  const client: Client = {
    name: row.name,
    period,
    source: `2025 ROI Stats · ${row.g}. ${investmentNote}`,
    agency: false,
    dialer: false,
    pfc: true,
    ein: false,
    decision: row.g,
    quantified,
    sub,
    additional: 0,
    ...(row.fte && row.fte > 0 ? { fte: row.fte } : {}),
    scrubs,
    addl: [],
    ops,
    cash: {
      prior: priorLabel,
      cur: currentLabel,
      payPrior,
      payCur,
      ratePrior,
      rateCur,
      lift: seg > 0 ? seg : quantified,
      liftLabel: seg > 0 ? 'Segmentation lift' : 'Quantified benefit',
    },
    seg: null,
    trend: {
      reviews: [{ p: reviewLabel, m: reviewMonths, b: quantified, sub, s: currentStart, e: currentEnd - 1 }],
      yoy: [{ p: full ? 'Jan–Sep' : 'Jan–Jun', py: '2024', cy: '2025', pay: [payPrior, payCur], rate: [ratePrior, rateCur] }],
      note: 'Loaded from the client health 2025 ROI Stats roster. Monthly payments, rates, and scrub counts are illustrative.',
    },
    recs,
  };

  const monthly: MonthlySeries = {
    months: MONTHS,
    pay,
    rate,
    wf: {
      'Charity qualified accounts': ch,
      'Bankruptcy results': bk,
      'Deceased results': dc,
      'Return Mail collections ($)': scaleTo(
        Array.from({ length: N }, () => 0.5 + rand()),
        Math.max(rmShare, 0),
      ),
    },
    known: 'Illustrative monthly series for a client health roster workbook. Headline dollars are the 2025 ROI Stats.',
    dialer: { attempts, contacts, payments: dialerPay },
  };

  const scrub: ScrubData = {
    rm: { new: rmNew, imp: rmImp, eq: rmEq, nh: rmNh },
    piv: { vol: pivVol, new: pivNew, imp: pivImp },
    bk,
    dc,
    mc: { rec, cov },
    ch,
    yoy: {
      rm: [
        ['Jan–Jun 2024', y24.rmVol, y24.rmNew, y24.rmImp],
        ['Jan–Jun 2025', y25.rmVol, y25.rmNew, y25.rmImp],
      ],
      rmc: [
        ['Jan–Jun 2024', Math.round(rmShare * 0.45)],
        ['Jan–Jun 2025', rmShare],
      ],
      piv: [
        ['Jan–Jun 2024', y24.rmVol, 0.12, 0.08],
        ['Jan–Jun 2025', y25.rmVol, 0.14, 0.09],
      ],
      bk: [
        ['Jan–Jun 2024', y24.bk, Math.round(db * 0.4)],
        ['Jan–Jun 2025', y25.bk, db],
      ],
      dc: [
        ['Jan–Jun 2024', y24.dc],
        ['Jan–Jun 2025', y25.dc],
      ],
      mc: [
        ['Jan–Jun 2024', Math.round(med * 0.8), 0.09],
        ['Jan–Jun 2025', med, 0.11],
      ],
      ch: [
        ['Jan–Jun 2024', y24.ch, Math.round(char * 0.85)],
        ['Jan–Jun 2025', y25.ch, char],
      ],
    },
    flags: ['Illustrative monthly series generated from the client health 2025 ROI Stats roster. Headline dollars are the roster figures.'],
    known: 'Monthly scrub counts are illustrative. Year-over-year dollars for Medicaid, return mail, charity, and deceased/bankruptcy use the roster totals.',
  };

  return {
    client,
    monthly,
    scrub,
    details,
    insights,
    opps,
    months: reviewMonths,
    loads: [{ n: '2025 ROI Stats (client health roster)', p: period, s: currentStart, e: currentEnd - 1 }],
    guarRatio: 3,
  };
}

export interface HealthMocks {
  clients: Record<string, Client>;
  monthly: Record<string, MonthlySeries>;
  scrubData: Record<string, ScrubData>;
  details: Record<string, Partial<Record<WorkflowKey, WorkflowDetail>>>;
  insights: Record<string, Insight[]>;
  opps: Record<string, Opportunity[]>;
  months: Record<string, number>;
  loads: Record<string, DataLoad[]>;
  guarRatio: Record<string, number>;
}

/** Mock ROI workbooks for command-center clients other than MaineHealth and WashU. */
export function buildHealthMocks(rows: HealthRosterRow[] = healthRoster): HealthMocks {
  const out: HealthMocks = {
    clients: {},
    monthly: {},
    scrubData: {},
    details: {},
    insights: {},
    opps: {},
    months: {},
    loads: {},
    guarRatio: {},
  };
  for (const row of rows) {
    if (HAND_BUILT.has(row.id)) continue;
    const built = buildOne(row);
    out.clients[row.id] = built.client;
    out.monthly[row.id] = built.monthly;
    out.scrubData[row.id] = built.scrub;
    out.details[row.id] = built.details;
    out.insights[row.id] = built.insights;
    out.opps[row.id] = built.opps;
    out.months[row.id] = built.months;
    out.loads[row.id] = built.loads;
    out.guarRatio[row.id] = built.guarRatio;
  }
  return out;
}
