/**
 * Client ROI PowerPoint.
 *
 * The slide list is the Utilization Review plan from `buildSlidePlan`. Slide geometry follows
 * `Utilization Review Template_2025.pptx`: 20 × 11.25 inches, Arial, and that deck's Experian colors.
 * Positions below are authored on a 13.33 × 7.5 canvas and scaled onto the template when drawn.
 * The file uses the dashboard figures and never includes internal-only pages, other clients,
 * internal insights, data-load notes, or the Medicaid attribution note.
 * Illustrative sample figures keep that label. Example figures printed in the template are not copied.
 */
import PptxGenJS from 'pptxgenjs';
import type { Client, Insight, MedicaidSplit, MonthlySeries, ScrubData, WorkflowDetail, WorkflowKey } from '../../data/types';
import { overlaps, sumRange, type MonthRange } from '../dateRange';
import { buildSlidePlan } from '../exportPlan';
import { chartFormatter, formatValue, int, money, moneyFull, pct } from '../format';
import { medicaidDetail } from '../medicaid';
import { pctChange, returnMailScale, roiRatio, totalValueCreation, type MedicaidSource, type ReturnMailLevel } from '../roi';
import { audienceFilter, usesPfc, visibleScrubs } from '../visibility';

const FONT = 'Arial';
/** Experian colors from the Utilization Review template theme and ExperianColorPalette.pptx. */
const BLUE = '1D4F91';
const PURPLE = '6D2077';
const MAGENTA = 'E63888';
const TEAL = '0081A6';
const ORANGE = 'FF8D1B';
const GRAY = '63666A';
const MUTED = '8A8D91';
const INK = '262626';
const LINE = 'E1E3E6';
const WHITE = 'FFFFFF';
const TOTAL = 'F0EAF6';
const TAKE_BG = 'F7F2FB';
const ROW_H = 0.3;
/** Authored canvas. Drawing multiplies inches and type sizes onto the 20 × 11.25 template. */
const SCALE = 1.5;
const PAGE_W = 20;
const PAGE_H = 11.25;
const CONTENT_X = 0.4;
const CONTENT_W = 12.53;

type Slide = PptxGenJS.Slide;
type Row = PptxGenJS.TableRow;

export interface DeckInput {
  client: Client;
  range: MonthRange;
  rangeLabel: string;
  monthly: MonthlySeries;
  /** Profile-filtered workflow slides, with the Medicaid source split already applied. */
  details: WorkflowDetail[];
  /** Profile-filtered insights. Internal-audience items are dropped while building the file. */
  insights: Insight[];
  scrub: ScrubData;
  medSrc: MedicaidSource;
  usesEin: boolean;
  rmLevel: ReturnMailLevel;
  guarRatio: number;
}

/** Workflow slides in deck order, with Medicaid figures restated for the selected delivery source. */
export function presentationDetails(
  details: Partial<Record<WorkflowKey, WorkflowDetail>>,
  medSplit: MedicaidSplit | undefined,
  ein: boolean,
  medSrc: MedicaidSource,
  medF: (kind: 'cov' | 'pay') => number,
): WorkflowDetail[] {
  return Object.entries(details)
    .filter((entry): entry is [string, WorkflowDetail] => !!entry[1])
    .map(([k, d]) => (k === 'mc' ? medicaidDetail(d, medSplit, ein, medSrc, medF) : d));
}

function scaleOptions<T extends Record<string, unknown> | undefined>(options: T): T {
  if (!options) return options;
  const next = { ...options } as Record<string, unknown>;
  for (const key of ['x', 'y', 'w', 'h', 'rowH'] as const) {
    if (typeof next[key] === 'number') next[key] = (next[key] as number) * SCALE;
  }
  if (typeof next.fontSize === 'number') next.fontSize = Math.round((next.fontSize as number) * SCALE);
  if (Array.isArray(next.colW)) next.colW = (next.colW as number[]).map((n) => n * SCALE);
  return next as T;
}

/** Scale authored inches onto the Utilization Review template page. */
function onTemplate(slide: Slide): Slide {
  return new Proxy(slide, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'addText' || prop === 'addShape' || prop === 'addTable') {
        return (content: unknown, options?: Record<string, unknown>) =>
          (value as (content: unknown, options?: Record<string, unknown>) => unknown).call(target, content, scaleOptions(options));
      }
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
    },
  });
}

export function buildClientDeck(input: DeckInput): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'UTILIZATION_REVIEW', width: PAGE_W, height: PAGE_H });
  pptx.layout = 'UTILIZATION_REVIEW';
  pptx.author = 'Experian Health';
  pptx.company = 'Experian Health';
  pptx.title = `${input.client.name} ROI Review`;
  pptx.subject = `${input.client.period} — sample data`;
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };
  defineMaster(pptx, input.client);

  const titles = deckTitles(input.client, input.details);
  for (const item of titles) addPlannedSlide(pptx, item, titles, input);
  return pptx;
}

function deckTitles(client: Client, details: WorkflowDetail[]) {
  const plan = buildSlidePlan(client, details);
  return [
    ...plan.slides.map((title) => ({ title, profile: false })),
    ...plan.profileSlides.map((title) => ({ title, profile: true })),
  ];
}

function defineMaster(pptx: PptxGenJS, client: Client) {
  pptx.defineSlideMaster({
    title: 'CONTENT',
    background: { color: WHITE },
    objects: [
      { rect: { x: 0, y: 0, w: PAGE_W, h: 0.12, fill: { color: BLUE } } },
      { rect: { x: 0, y: 10.83, w: PAGE_W, h: 0.42, fill: { color: 'F4F6F9' } } },
      {
        text: {
          text: 'Experian Health  ·  Collections Optimization  ·  Utilization Review',
          options: { x: 0.6, y: 10.86, w: 11.1, h: 0.36, fontFace: FONT, fontSize: 15, color: MUTED, margin: 0 },
        },
      },
      {
        text: {
          text: `${client.name}  ·  ${client.period}`,
          options: { x: 11.4, y: 10.86, w: 6.75, h: 0.36, fontFace: FONT, fontSize: 15, color: MUTED, align: 'right', margin: 0 },
        },
      },
    ],
    slideNumber: { x: 18.45, y: 10.86, w: 1.05, h: 0.36, fontFace: FONT, fontSize: 15, color: MUTED, align: 'right' },
  });
}

function addPlannedSlide(
  pptx: PptxGenJS,
  item: { title: string; profile: boolean },
  titles: { title: string; profile: boolean }[],
  input: DeckInput,
) {
  const { title } = item;
  if (title === 'Title') return addTitleSlide(pptx, input);
  const slide = onTemplate(pptx.addSlide({ masterName: 'CONTENT' }));
  if (title === 'Agenda') return addAgenda(slide, titles);
  if (title === 'Executive Highlights') return addExecutive(slide, input);
  if (title === 'ROI Summary') return addRoi(slide, input);
  if (title === 'Collection Optimization Overview') return addOverview(slide, input);
  if (title === 'Segmentation Performance') return addSegmentation(slide, input);
  if (title === 'Cash Impact Analysis') return addCash(slide, input);
  if (title === 'Performance Trend (review over review, YoY)') return addTrend(slide, input);
  if (title === 'Agency Performance vs. Benchmark') return addAgency(slide, input);
  if (title === 'Dialer Performance') return addDialer(slide, input);
  if (title === 'Value Delivery Summary') return addValueSummary(slide, input);
  if (title === 'Success Plan & Recommendations') return addSuccess(slide, input);
  const workflow = input.details.find((d) => !d.empty && d.name + ' Results' === title);
  if (!workflow) throw new Error(`No content for slide "${title}"`);
  addWorkflow(slide, input, workflow);
}

function heading(slide: Slide, title: string, subtitle: string) {
  slide.addText(title, {
    x: CONTENT_X, y: 0.2, w: CONTENT_W, h: 0.4,
    fontFace: FONT, fontSize: 24, bold: true, color: BLUE, margin: 0,
  });
  slide.addText(subtitle, {
    x: CONTENT_X, y: 0.6, w: CONTENT_W, h: 0.28,
    fontFace: FONT, fontSize: 13, color: GRAY, margin: 0,
  });
  return 1.02;
}

function cells(values: string[], kind: 'header' | 'body' | 'total'): Row {
  return values.map((text, i) => ({
    text,
    options: {
      fill: { color: kind === 'header' ? BLUE : kind === 'total' ? TOTAL : WHITE },
      color: kind === 'header' ? WHITE : INK,
      bold: kind !== 'body',
      align: i === 0 ? 'left' : 'right',
      valign: 'middle',
      margin: [3, 7, 3, 7],
    },
  }));
}

function placeTable(slide: Slide, rows: Row[], x: number, y: number, colW: number[]) {
  const w = colW.reduce((a, b) => a + b, 0);
  slide.addTable(rows, {
    x, y, w, colW, rowH: ROW_H,
    border: { pt: 0.5, color: LINE },
    fontFace: FONT, fontSize: 12, color: INK, valign: 'middle',
  });
  return y + rows.length * ROW_H;
}

function addKpis(slide: Slide, items: { label: string; value: string; note: string; color: string }[], y: number) {
  const gap = 0.12;
  const w = (CONTENT_W - gap * (items.length - 1)) / items.length;
  const h = 0.98;
  items.forEach((item, i) => {
    const x = CONTENT_X + i * (w + gap);
    slide.addShape('rect', {
      x, y, w, h, fill: { color: WHITE }, line: { color: LINE, width: 1 }, rectRadius: 0.06,
    });
    slide.addShape('rect', { x, y, w, h: 0.06, fill: { color: item.color } });
    slide.addText(item.label, { x: x + 0.1, y: y + 0.12, w: w - 0.2, h: 0.22, fontFace: FONT, fontSize: 11, bold: true, color: GRAY, margin: 0 });
    slide.addText(item.value, { x: x + 0.1, y: y + 0.34, w: w - 0.2, h: 0.34, fontFace: FONT, fontSize: 20, bold: true, color: item.color, margin: 0 });
    slide.addText(item.note, { x: x + 0.1, y: y + 0.7, w: w - 0.2, h: 0.22, fontFace: FONT, fontSize: 10, color: MUTED, margin: 0 });
  });
  return y + h;
}

function addTakeaway(slide: Slide, label: string, body: string, y: number, h = 0.62) {
  slide.addShape('rect', { x: CONTENT_X, y, w: CONTENT_W, h, fill: { color: TAKE_BG } });
  slide.addShape('rect', { x: CONTENT_X, y, w: 0.08, h, fill: { color: PURPLE } });
  slide.addText(
    [
      { text: label + ' ', options: { bold: true, color: PURPLE } },
      { text: body, options: { color: INK } },
    ],
    { x: 0.62, y, w: CONTENT_W - 0.34, h, fontFace: FONT, fontSize: 13, valign: 'middle', margin: 0 },
  );
  return y + h;
}

function clientInsights(input: DeckInput, areas: string[]) {
  return input.insights.filter(audienceFilter(true)).filter((i) => areas.includes(i.area));
}

function addTitleSlide(pptx: PptxGenJS, input: DeckInput) {
  const { client: c, rangeLabel } = input;
  const roi = roiRatio(c.quantified, c.sub);
  const slide = onTemplate(pptx.addSlide());
  slide.addShape('rect', { x: 0, y: 0, w: 6.35, h: 7.5, fill: { color: BLUE } });
  slide.addShape('rect', { x: 6.35, y: 0, w: 0.1, h: 7.5, fill: { color: PURPLE } });
  slide.addShape('rect', { x: 0.45, y: 0.55, w: 1.15, h: 0.32, fill: { color: ORANGE }, rectRadius: 0.08 });
  slide.addText('MOCKUP', {
    x: 0.45, y: 0.55, w: 1.15, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText('COLLECTIONS OPTIMIZATION', {
    x: 0.45, y: 1.7, w: 5.5, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: 'D6E6F7', margin: 0,
  });
  slide.addText('Utilization Review', {
    x: 0.45, y: 2.05, w: 5.5, h: 0.7, fontFace: FONT, fontSize: 36, bold: true, color: WHITE, margin: 0,
  });
  slide.addText(c.name, { x: 0.45, y: 3.0, w: 5.5, h: 0.5, fontFace: FONT, fontSize: 26, color: WHITE, margin: 0 });
  slide.addText(c.period, { x: 0.45, y: 3.55, w: 5.5, h: 0.35, fontFace: FONT, fontSize: 16, color: 'D6E6F7', margin: 0 });
  slide.addText('Date range for trend slides\n' + rangeLabel, {
    x: 0.45, y: 4.3, w: 5.5, h: 0.6, fontFace: FONT, fontSize: 13, color: 'D6E6F7', margin: 0,
  });
  slide.addText('Experian Health', { x: 0.45, y: 6.85, w: 5.5, h: 0.3, fontFace: FONT, fontSize: 13, color: WHITE, margin: 0 });

  slide.addText('In this review', {
    x: 6.85, y: 0.55, w: 6, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: BLUE, margin: 0,
  });
  const facts: [string, string][] = [
    ['Quantified benefit', money(c.quantified)],
    ['Additional value', money(c.additional)],
    ['Total value creation', money(totalValueCreation(c))],
    ['ROI', roi.toFixed(1) + ' : 1'],
    ['Subscription', moneyFull(c.sub)],
  ];
  facts.forEach(([label, value], i) => {
    const y = 1.1 + i * 0.55;
    slide.addText(label, { x: 6.85, y, w: 3.1, h: 0.4, fontFace: FONT, fontSize: 14, color: GRAY, valign: 'middle', margin: 0 });
    slide.addText(value, { x: 9.9, y, w: 2.9, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: INK, align: 'right', valign: 'middle', margin: 0 });
  });
  slide.addShape('rect', { x: 6.85, y: 4.15, w: 5.95, h: 1.35, fill: { color: 'FFF6EC' } });
  slide.addShape('rect', { x: 6.85, y: 4.15, w: 0.08, h: 1.35, fill: { color: ORANGE } });
  slide.addText('Sample data. Figures marked illustrative are sample data, not validated production results. Workbook figures are the sample client extract loaded in this dashboard.', {
    x: 7.1, y: 4.25, w: 5.5, h: 1.15, fontFace: FONT, fontSize: 13, color: INK, margin: 0,
  });
  slide.addText('Source: ' + c.source, {
    x: 6.85, y: 5.7, w: 5.95, h: 0.7, fontFace: FONT, fontSize: 12, color: MUTED, margin: 0,
  });
}

function addAgenda(slide: Slide, titles: { title: string; profile: boolean }[]) {
  heading(slide, 'Agenda', 'Slides in this review');
  const items = titles.filter((t) => t.title !== 'Title' && t.title !== 'Agenda');
  slide.addText(
    items.map((item, i) => ({
      text: `${i + 1}.   ${item.title}${item.profile ? '    ·  included for this client’s profile' : ''}`,
      options: { breakLine: true, color: item.profile ? TEAL : INK, bold: item.profile },
    })),
    { x: 0.55, y: 1.2, w: 12, h: 5.7, fontFace: FONT, fontSize: 16, paraSpaceAfter: 6, valign: 'top', margin: 0 },
  );
}

function executiveMessage(c: Client) {
  const roi = roiRatio(c.quantified, c.sub);
  return `For every $1 invested, ${c.name} realized approximately $${roi.toFixed(2)} in measurable financial benefit during the review period.`;
}

function addExecutive(slide: Slide, input: DeckInput) {
  const { client: c } = input;
  const roi = roiRatio(c.quantified, c.sub);
  let y = heading(slide, 'Executive Highlights', `${c.name} · ${c.period} — performance snapshot for executive and operational stakeholders`);
  y = addKpis(slide, [
    { label: 'Quantified Benefit', value: money(c.quantified), note: 'Workbook ROI value', color: PURPLE },
    { label: 'Additional Value', value: money(c.additional), note: 'Supporting value identified', color: MAGENTA },
    { label: 'Total Value Creation', value: money(totalValueCreation(c)), note: 'Quantified + additional', color: BLUE },
    { label: 'ROI', value: roi.toFixed(1) + ' : 1', note: 'Benefit vs subscription', color: TEAL },
  ], y + 0.08);
  const levers = visibleScrubs(c);
  y = placeTable(slide, [
    cells(['Where the value came from', 'Dollars'], 'header'),
    ...levers.map((r) => cells([r[0], moneyFull(r[1])], 'body')),
    cells(['Quantified benefit', moneyFull(c.quantified)], 'total'),
    cells(['Subscription', moneyFull(c.sub)], 'body'),
  ], CONTENT_X, y + 0.16, [8.2, 4.33]) + 0.14;
  y = addTakeaway(slide, 'Executive message:', executiveMessage(c), y);
  const highlights = clientInsights(input, input.insights.map((i) => i.area)).slice(0, 3);
  // Skip the highlights when the value table already fills the slide (WashU has seven levers).
  if (highlights.length && y < 5.2) {
    slide.addText('Analyst highlights', {
      x: CONTENT_X, y: y + 0.08, w: CONTENT_W, h: 0.26, fontFace: FONT, fontSize: 13, bold: true, color: PURPLE, margin: 0,
    });
    slide.addText(
      highlights.map((i) => ({ text: i.title + '.  ' + i.obs, options: { breakLine: true } })),
      { x: CONTENT_X, y: y + 0.34, w: CONTENT_W, h: 6.95 - (y + 0.34), fontFace: FONT, fontSize: 12, color: INK, paraSpaceAfter: 4, margin: 0, valign: 'top' },
    );
  }
}

function addRoi(slide: Slide, input: DeckInput) {
  const { client: c } = input;
  const roi = roiRatio(c.quantified, c.sub);
  let y = heading(slide, 'ROI Summary', `${c.name} · ${c.period} — value delivered against subscription investment`);
  const rows: Row[] = [
    cells(['Process', 'Value'], 'header'),
    ...visibleScrubs(c).map((r) => cells([r[0], moneyFull(r[1])], 'body')),
    cells(['Total Quantified Benefit', moneyFull(c.quantified)], 'total'),
    ...c.addl.map((r) => cells(['Additional: ' + r[0], moneyFull(r[1])], 'body')),
    cells(['Total Value Creation', moneyFull(totalValueCreation(c))], 'total'),
    cells(['Subscription investment', moneyFull(c.sub)], 'body'),
    cells(['ROI', roi.toFixed(1) + ' : 1'], 'total'),
  ];
  y = placeTable(slide, rows, CONTENT_X, y + 0.1, [8.2, 4.33]);
  if (c.fte != null) {
    slide.addText('FTE hours equivalent: ' + c.fte, {
      x: CONTENT_X, y: y + 0.08, w: CONTENT_W, h: 0.24, fontFace: FONT, fontSize: 12, color: MUTED, margin: 0,
    });
    y += 0.32;
  }
  addInsightLines(slide, clientInsights(input, ['roi']), y + 0.1);
}

function addInsightLines(slide: Slide, items: Insight[], y: number) {
  items.slice(0, 2).forEach((i) => {
    if (y > 6.55) return;
    slide.addText(i.title, { x: CONTENT_X, y, w: CONTENT_W, h: 0.24, fontFace: FONT, fontSize: 13, bold: true, color: PURPLE, margin: 0 });
    slide.addText(i.obs, { x: CONTENT_X, y: y + 0.24, w: CONTENT_W, h: 0.4, fontFace: FONT, fontSize: 12, color: INK, margin: 0 });
    y += 0.68;
  });
}

function addOverview(slide: Slide, input: DeckInput) {
  const included = input.details.filter((d) => !d.empty);
  let y = heading(slide, 'Collection Optimization Overview', `${input.client.name} · ${input.client.period} — workflows included for this client's profile`);
  y = placeTable(
    slide,
    [
      cells(['Workflow', 'Headline result', ''], 'header'),
      ...included.map((d) => cells([d.name, d.kpis ? d.kpis[0][1] : '—', d.kpis ? d.kpis[0][0] : 'Not in deck'], 'body')),
    ],
    CONTENT_X, y + 0.12, [5.4, 3.1, 4.03],
  );
  if (usesPfc(input.client)) {
    const ops = input.client.ops;
    if (y + 0.5 < 6.4 && ops.length) {
      slide.addText('Operational measures', {
        x: CONTENT_X, y: y + 0.16, w: CONTENT_W, h: 0.26, fontFace: FONT, fontSize: 14, bold: true, color: BLUE, margin: 0,
      });
      placeTable(
        slide,
        [cells(['Measure', 'Value'], 'header'), ...ops.map((r) => cells([r[0], formatValue(r[1], r[2])], 'body'))],
        CONTENT_X, y + 0.46, [8.2, 4.33],
      );
    }
  }
}

function addWorkflow(slide: Slide, input: DeckInput, d: WorkflowDetail) {
  const { client: c } = input;
  let y = heading(slide, d.name + ' Results', `${c.name} · ${c.period} — ${d.sub}`);
  // Own row under the subtitle. The previous y-0.02 placement sat on the KPI card borders.
  slide.addText(`Slide figures cover ${c.period}.`, {
    x: CONTENT_X, y, w: CONTENT_W, h: 0.22, fontFace: FONT, fontSize: 11, color: MUTED, margin: 0, valign: 'middle',
  });
  y += 0.32;
  if (d.name === 'Medicaid' && input.usesEin && input.medSrc !== 'all') {
    slide.addText('SOURCE SPLIT = ILLUSTRATIVE', {
      x: CONTENT_X, y, w: 3.4, h: 0.26, fontFace: FONT, fontSize: 11, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0,
      fill: { color: MUTED },
    });
    y += 0.34;
  }
  if (d.kpis) {
    const cols = [BLUE, PURPLE, MAGENTA, TEAL];
    y = addKpis(
      slide,
      d.kpis.map((k, i) => ({ label: k[0], value: k[1], note: k[2], color: cols[i % 4] })),
      y,
    );
    y += 0.14;
  }
  if (d.table) {
    y = placeTable(
      slide,
      [cells(d.table.h, 'header'), ...d.table.r.map((r) => cells(r, 'body'))],
      CONTENT_X, y, d.table.h.length === 2 ? [8.2, 4.33] : evenCols(d.table.h.length),
    );
    y += 0.14;
  }
  for (const chart of d.charts ?? []) {
    if (y > 6.15) break;
    const fmt = chartFormatter(chart.f);
    slide.addText(chart.t, { x: CONTENT_X, y, w: CONTENT_W, h: 0.24, fontFace: FONT, fontSize: 13, bold: true, color: BLUE, margin: 0 });
    y = placeTable(
      slide,
      [cells(chart.cats, 'header'), cells(chart.v.map((v) => fmt(v)), 'body')],
      CONTENT_X, y + 0.26, evenCols(chart.cats.length),
    );
    y += 0.12;
  }
  if (d.trend === 'rm') y = addReturnMail(slide, input, y);
  if (d.take && y < 6.45) addTakeaway(slide, (d.tl || 'Executive takeaway') + ':', d.take, y, 0.58);
}

function evenCols(n: number) {
  return Array.from({ length: n }, () => CONTENT_W / n);
}

function addReturnMail(slide: Slide, input: DeckInput, y: number) {
  const scale = (n: number | null) => returnMailScale(n, input.rmLevel, input.guarRatio) as number;
  const unit = input.rmLevel === 'guar' ? 'guarantors' : 'accounts';
  const rows = input.scrub.yoy.rm
    .filter((r) => r[1] != null)
    .map((r) => [r[0], scale(r[1]), scale(r[2]), scale(r[3])] as [string, number, number, number]);
  if (!rows.length || y > 5.7) return y;
  slide.addText('New & Improved addresses · counted by ' + unit, {
    x: CONTENT_X, y, w: CONTENT_W, h: 0.24, fontFace: FONT, fontSize: 14, bold: true, color: BLUE, margin: 0,
  });
  y = placeTable(
    slide,
    [
      cells(['Period', 'Corrected ' + unit, 'New', 'Improved', 'New share', 'Improved share'], 'header'),
      ...rows.map((r) => cells([r[0], int(r[1]), int(r[2]), int(r[3]), pct(r[2] / r[1]), pct(r[3] / r[1])], 'body')),
    ],
    CONTENT_X, y + 0.26, [3.13, 2.2, 1.7, 1.8, 1.85, 1.85],
  );
  slide.addText('Monthly split is illustrative; period totals are from the workbook.', {
    x: CONTENT_X, y: y + 0.04, w: CONTENT_W, h: 0.22, fontFace: FONT, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });
  return y + 0.28;
}

function addSegmentation(slide: Slide, input: DeckInput) {
  const seg = input.client.seg;
  let y = heading(slide, 'Segmentation Performance', `${input.client.name} · ${input.client.period} — recoverability concentration by segment`);
  if (!seg) return;
  y = placeTable(
    slide,
    [
      cells(['Segment', '% of volume', '% of payments'], 'header'),
      ...seg.vol.map((_, i) => cells(['Seg ' + (i + 1), Math.round(seg.vol[i] * 100) + '%', Math.round(seg.pay[i] * 100) + '%'], 'body')),
    ],
    CONTENT_X, y + 0.12, [4.2, 4.16, 4.17],
  );
  addInsightLines(slide, clientInsights(input, ['seg']), y + 0.16);
}

function addCash(slide: Slide, input: DeckInput) {
  const k = input.client.cash;
  let y = heading(slide, 'Cash Impact Analysis', `${input.client.name} · ${input.client.period} — patient payment performance vs. prior period`);
  y = addKpis(slide, [
    { label: 'Patient payments', value: money(k.payCur), note: k.cur, color: BLUE },
    { label: 'Payment change', value: pct(pctChange(k.payPrior, k.payCur)), note: 'Versus prior period', color: PURPLE },
    { label: 'Collection rate', value: pct(k.rateCur), note: 'Prior: ' + pct(k.ratePrior), color: MAGENTA },
    { label: k.liftLabel, value: money(k.lift), note: 'ROI calculation', color: TEAL },
  ], y + 0.1);
  placeTable(
    slide,
    [
      cells(['', k.prior, k.cur], 'header'),
      cells(['Patient payments', moneyFull(k.payPrior), moneyFull(k.payCur)], 'body'),
      cells(['Collection rate', pct(k.ratePrior), pct(k.rateCur)], 'body'),
    ],
    CONTENT_X, y + 0.2, [4.2, 4.16, 4.17],
  );
}

function addTrend(slide: Slide, input: DeckInput) {
  const { client: c, range, rangeLabel } = input;
  const t0 = c.trend;
  const inRange = t0.reviews.filter((r) => overlaps(r.s, r.e, range));
  const reviews = inRange.length ? inRange : [t0.reviews[t0.reviews.length - 1]];
  let y = heading(slide, 'Performance Trend', `${c.name} · ${c.period} — review over review and year over year · ${rangeLabel}`);
  if (!inRange.length) {
    slide.addText(`No ROI review loaded for ${rangeLabel}. Widen the date range to see review-level ROI.`, {
      x: CONTENT_X, y, w: CONTENT_W, h: 0.28, fontFace: FONT, fontSize: 13, color: 'B35F00', margin: 0,
    });
    y += 0.32;
  }
  const last = reviews[reviews.length - 1];
  const yl = t0.yoy[t0.yoy.length - 1];
  slide.addText(
    `Latest benefit / month  ${money(last.b / last.m)}     Latest ROI  ${(last.b / last.sub).toFixed(1)} : 1     Collection rate change  ${((yl.rate[1] - yl.rate[0]) * 100).toFixed(2)} pts (${yl.p} ${yl.cy} vs ${yl.py})`,
    { x: CONTENT_X, y, w: CONTENT_W, h: 0.28, fontFace: FONT, fontSize: 13, color: INK, margin: 0 },
  );
  y += 0.38;
  const half = (CONTENT_W - 0.2) / 2;
  placeTable(
    slide,
    [
      cells(['Review', 'Benefit / month', 'ROI'], 'header'),
      ...reviews.map((r) => cells([r.p, money(r.b / r.m), (r.b / r.sub).toFixed(1) + ' : 1'], 'body')),
    ],
    CONTENT_X, y, [half * 0.46, half * 0.3, half * 0.24],
  );
  const py = t0.yoy[0].py;
  const cy = t0.yoy[0].cy;
  const yoyBottom = placeTable(
    slide,
    [
      cells(['Period', py + ' payments', cy + ' payments', 'Rate ' + py, 'Rate ' + cy], 'header'),
      ...t0.yoy.map((row) => cells([row.p, money(row.pay[0]), money(row.pay[1]), pct(row.rate[0]), pct(row.rate[1])], 'body')),
    ],
    CONTENT_X + half + 0.2, y, [half * 0.22, half * 0.22, half * 0.22, half * 0.17, half * 0.17],
  );
  y = Math.max(y + reviews.length * ROW_H + ROW_H, yoyBottom) + 0.16;
  if (t0.wf && y < 5.6) {
    slide.addText('Workflow results, ' + t0.wf.label, {
      x: CONTENT_X, y, w: CONTENT_W, h: 0.24, fontFace: FONT, fontSize: 13, bold: true, color: BLUE, margin: 0,
    });
    y = placeTable(
      slide,
      [
        cells(['Workflow', '2024', '2025', 'Change'], 'header'),
        ...t0.wf.rows.map((r) => cells([r[0], int(r[1]), int(r[2]), pct((r[2] - r[1]) / r[1])], 'body')),
      ],
      CONTENT_X, y + 0.26, [5.2, 2.4, 2.4, 2.53],
    );
    y += 0.12;
  }
  if (t0.seg && y < 5.5) {
    slide.addText('Segment mix (% of volume) by year', {
      x: CONTENT_X, y, w: CONTENT_W, h: 0.24, fontFace: FONT, fontSize: 13, bold: true, color: BLUE, margin: 0,
    });
    placeTable(
      slide,
      [
        cells(['Segment', ...t0.seg.years], 'header'),
        ...t0.seg.vol.map((row, i) => cells(['Seg ' + (i + 1), ...t0.seg!.years.map((_, j) => Math.round(row[j] * 100) + '%')], 'body')),
      ],
      CONTENT_X, y + 0.26, evenCols(t0.seg.years.length + 1),
    );
  }
}

function addAgency(slide: Slide, input: DeckInput) {
  const a = input.client.agencyData;
  let y = heading(slide, 'Agency Performance vs. Benchmark', `${input.client.name} · ${input.client.period} — agency recovery rate vs. Experian benchmark, by balance tier`);
  if (!a) {
    slide.addText("No agency data yet — populates from the Agency Benchmarking tab of this client's workbook.", {
      x: CONTENT_X, y, w: CONTENT_W, h: 0.4, fontFace: FONT, fontSize: 14, color: MUTED, italic: true, margin: 0,
    });
    return;
  }
  const entries = Object.entries(a.periods);
  const colW = 6.15;
  entries.forEach(([period, series], i) => {
    const x = CONTENT_X + (i % 2) * (colW + 0.23);
    const top = y + Math.floor(i / 2) * 2.15;
    slide.addText(period + ' placements', { x, y: top, w: colW, h: 0.24, fontFace: FONT, fontSize: 13, bold: true, color: BLUE, margin: 0 });
    const labelW = 1.35;
    const rest = (colW - labelW) / a.buckets.length;
    placeTable(
      slide,
      [
        cells(['', ...a.buckets], 'header'),
        ...Object.entries(series).map(([name, values]) => cells([name, ...values.map((v) => (v * 100).toFixed(1) + '%')], 'body')),
      ],
      x, top + 0.26, [labelW, ...a.buckets.map(() => rest)],
    );
  });
  slide.addText('Agency names are hidden in this mockup; the live version shows each agency by name.', {
    x: CONTENT_X, y: 6.62, w: CONTENT_W, h: 0.24, fontFace: FONT, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });
}

function addDialer(slide: Slide, input: DeckInput) {
  const { fI, tI } = input.range;
  const dialer = input.monthly.dialer;
  const attempts = dialer.attempts.slice(fI, tI + 1);
  const contacts = dialer.contacts.slice(fI, tI + 1);
  const payments = dialer.payments.slice(fI, tI + 1);
  const at = sumRange(attempts, 0, attempts.length);
  const co = sumRange(contacts, 0, contacts.length);
  const pa = sumRange(payments, 0, payments.length);
  let y = heading(slide, 'Dialer Performance', `${input.client.name} · ${input.client.period} — outbound campaign effectiveness · ${input.rangeLabel}`);
  slide.addText('ILLUSTRATIVE SAMPLE DATA    Real values come from the Dialer Performance tab.', {
    x: CONTENT_X, y, w: CONTENT_W, h: 0.28, fontFace: FONT, fontSize: 13, bold: true, color: WHITE, fill: { color: MUTED }, margin: 0, align: 'center', valign: 'middle',
  });
  addKpis(slide, [
    { label: 'Call attempts', value: Math.round(at).toLocaleString('en-US'), note: input.rangeLabel, color: BLUE },
    { label: 'Right-party contacts', value: Math.round(co).toLocaleString('en-US'), note: input.rangeLabel, color: PURPLE },
    { label: 'Contact rate', value: pct(co / at), note: 'Contacts ÷ attempts', color: MAGENTA },
    { label: 'Payments from dialer', value: money(pa), note: input.rangeLabel, color: TEAL },
    { label: '$ per contact', value: '$' + (pa / co).toFixed(2), note: 'Payments ÷ contacts', color: ORANGE },
  ], y + 0.42);
}

function addValueSummary(slide: Slide, input: DeckInput) {
  const { client: c } = input;
  const roi = roiRatio(c.quantified, c.sub);
  let y = heading(slide, 'Value Delivery Summary', `${c.name} · ${c.period}`);
  y = addKpis(slide, [
    { label: 'Quantified Benefit', value: money(c.quantified), note: 'Workbook ROI value', color: PURPLE },
    { label: 'Additional Value', value: money(c.additional), note: 'Supporting value identified', color: MAGENTA },
    { label: 'Total Value Creation', value: money(totalValueCreation(c)), note: 'Quantified + additional', color: BLUE },
    { label: 'ROI', value: roi.toFixed(1) + ' : 1', note: 'Benefit vs subscription', color: TEAL },
  ], y + 0.12);
  slide.addText('Subscription investment  ' + moneyFull(c.sub), {
    x: CONTENT_X, y: y + 0.16, w: CONTENT_W, h: 0.3, fontFace: FONT, fontSize: 14, color: INK, margin: 0,
  });
  addTakeaway(slide, 'Executive message:', executiveMessage(c), y + 0.6);
}

function addSuccess(slide: Slide, input: DeckInput) {
  const colors = [BLUE, PURPLE, MAGENTA, TEAL, ORANGE];
  let y = heading(slide, 'SUCCESS PLAN', `${input.client.name} · ${input.client.period} — recommendations`);
  input.client.recs.forEach((rec, i) => {
    slide.addText(`${i + 1}.   ${rec}`, {
      x: 0.55, y, w: 12, h: 0.42, fontFace: FONT, fontSize: 20, bold: true, color: colors[i % colors.length], margin: 0,
    });
    y += 0.5;
  });
  slide.addText("Pulled from the workbook's Notes / Value Statements; edited by the consultant before export.", {
    x: CONTENT_X, y: y + 0.15, w: CONTENT_W, h: 0.3, fontFace: FONT, fontSize: 12, italic: true, color: MUTED, margin: 0,
  });
}
