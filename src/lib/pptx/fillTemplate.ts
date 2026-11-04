import JSZip from 'jszip';
import { overlaps, sumRange } from '../dateRange';
import { int, money, moneyFull } from '../format';
import { returnMailScale, roiRatio, totalValueCreation } from '../roi';
import { visibleScrubs } from '../visibility';
import type { DeckInput } from './buildDeck';

const TEMPLATE_FILE = 'Utilization Review Template_2025.pptx';

/** Slides whose printed dollars belong to the template's example, not this client. */
const EXAMPLE_FIGURE_SLIDES = [28, 30, 38];

async function templateBytes(): Promise<Uint8Array> {
  if (typeof window === 'undefined') {
    const { readFileSync } = await import(/* @vite-ignore */ 'node:fs');
    const { fileURLToPath } = await import(/* @vite-ignore */ 'node:url');
    const path = fileURLToPath(new URL(/* @vite-ignore */ `../../../${TEMPLATE_FILE}`, import.meta.url));
    return new Uint8Array(readFileSync(path));
  }
  const base = new URL('.', window.location.href);
  const response = await fetch(new URL('utilization-review-template.pptx', base));
  if (!response.ok) throw new Error('The Utilization Review template could not be loaded.');
  return new Uint8Array(await response.arrayBuffer());
}

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function decodeText(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Replace whole text runs. Placeholders are matched after XML decoding, so `&lt;&lt;insert&gt;&gt;` hits `<<insert>>`. */
function replaceTextNodes(xml: string, replacer: (text: string) => string | null) {
  return xml.replace(/<a:t(\s[^>]*)?>([^<]*)<\/a:t>/g, (full, attrs: string | undefined, inner: string) => {
    const next = replacer(decodeText(inner));
    if (next == null) return full;
    return `<a:t${attrs ?? ''}>${escapeText(next)}</a:t>`;
  });
}

function replaceExact(xml: string, from: string, to: string) {
  return replaceTextNodes(xml, (text) => (text === from ? to : null));
}

function replaceTrimmed(xml: string, from: string, to: string) {
  return replaceTextNodes(xml, (text) => (text.trim() === from ? to : null));
}

function replaceNthExact(xml: string, from: string, values: string[]) {
  let index = 0;
  return replaceTextNodes(xml, (text) => {
    if (text !== from) return null;
    const value = index < values.length ? values[index] : text;
    index += 1;
    return value;
  });
}

function hasWorkflow(input: DeckInput, pattern: RegExp) {
  return input.details.some((detail) => !detail.empty && pattern.test(detail.name));
}

function slidesToRemove(input: DeckInput) {
  const drop = new Set<number>([2, ...EXAMPLE_FIGURE_SLIDES]);
  if (!hasWorkflow(input, /financial clearance|address verification/i)) [4, 5, 6, 7, 8].forEach((n) => drop.add(n));
  if (!hasWorkflow(input, /bankruptcy/i)) [9, 10, 11, 12].forEach((n) => drop.add(n));
  if (!hasWorkflow(input, /deceased/i)) [13, 14, 15, 16].forEach((n) => drop.add(n));
  if (!hasWorkflow(input, /return mail/i)) [17, 18, 20].forEach((n) => drop.add(n));
  if (!input.client.dialer) drop.add(19);
  if (!hasWorkflow(input, /medicaid/i)) [21, 22, 23].forEach((n) => drop.add(n));
  if (!hasWorkflow(input, /charity/i)) [24, 25, 26].forEach((n) => drop.add(n));
  if (!input.client.seg) [27, 29].forEach((n) => drop.add(n));
  if (!input.client.agency) [32, 33, 34, 35, 36, 37].forEach((n) => drop.add(n));
  return drop;
}

function fillSlide1(xml: string, input: DeckInput) {
  let next = replaceExact(xml, 'Health System', input.client.name);
  next = replaceNthExact(next, 'xxxx', [input.client.period, '', 'Sample data, not validated production results.']);
  return replaceExact(next, ' – ', '');
}

function fillValue(xml: string, input: DeckInput) {
  const roi = roiRatio(input.client.quantified, input.client.sub);
  let next = replaceExact(xml, '<<insert sum of dollar value>>', moneyFull(input.client.quantified));
  next = replaceExact(next, '10 : 1 ROI', `${roi.toFixed(1)} : 1 ROI`);
  if (input.client.cash.lift > 0) next = replaceExact(next, '<<Insert lift>>>', moneyFull(input.client.cash.lift));
  if (input.client.fte != null) {
    next = replaceExact(next, '<<insert>> FTE  Hour Savings via Automation (insert # FTE)', `${input.client.fte} FTE hour savings via automation`);
  }
  return next;
}

function fillSegmentation(xml: string, input: DeckInput) {
  const seg = input.client.seg;
  if (!seg) return xml;
  const line = (count: number) => {
    const volume = seg.vol.slice(0, count).reduce((sum, value) => sum + value, 0);
    const payments = seg.pay.slice(0, count).reduce((sum, value) => sum + value, 0);
    return `${Math.round(volume * 100)}% of volume / ${Math.round(payments * 100)}% of payments`;
  };
  let next = replaceExact(xml, '52% of volume / 66% of payments', line(2));
  next = replaceExact(next, '78% of volume / 94% of payments', line(3));
  return next;
}

function fillReturnMail(xml: string, input: DeckInput) {
  const scaled = input.scrub.yoy.rm
    .filter((row) => row[1] != null)
    .map((row) => int(returnMailScale(row[1], input.rmLevel, input.guarRatio) as number));
  const unit = input.rmLevel === 'guar' ? `counted by guarantors ${scaled[0] ?? ''}` : 'Monthly split is illustrative; period totals are from the workbook.';
  let next = replaceExact(xml, 'Insert Observations and/or proposals', unit);
  return replaceExact(next, 'Return Mail results: <<Insert Volume>>', `Return Mail results: ${unit}`);
}

function fillMedicaid(xml: string, input: DeckInput) {
  const detail = input.details.find((item) => /medicaid/i.test(item.name) && !item.empty);
  const workbook = input.client.scrubs.find((row) => row[0] === 'Medicaid');
  const figures = [
    ...(detail?.kpis ?? []).flat(),
    ...(detail?.table?.r ?? []).flat(),
    workbook ? moneyFull(workbook[1]) : '',
  ].filter(Boolean);
  const split = input.medSrc !== 'all' && input.usesEin ? `SOURCE SPLIT = ILLUSTRATIVE. ${figures.join('. ')}` : figures.join('. ');
  return replaceTrimmed(xml, 'Insert summary', split || 'Insert summary');
}

function fillAgency(xml: string, input: DeckInput) {
  const data = input.client.agencyData;
  if (!data) return xml;
  const names = Object.keys(Object.values(data.periods)[0] ?? {});
  return replaceTrimmed(xml, 'Insert summary', `Agency Performance vs. Benchmark. ${names.join(', ')}.`);
}

function fillDialer(xml: string, input: DeckInput) {
  const { fI, tI } = input.range;
  const dialer = input.monthly.dialer;
  const attempts = sumRange(dialer.attempts.slice(fI, tI + 1), 0, tI - fI + 1);
  const payments = sumRange(dialer.payments.slice(fI, tI + 1), 0, tI - fI + 1);
  return replaceExact(
    xml,
    'Total accounts in campaign: <<Insert>>',
    `Dialer Performance. ILLUSTRATIVE SAMPLE DATA. Attempts ${Math.round(attempts).toLocaleString('en-US')}. Payments ${money(payments)}.`,
  );
}

function fillSuccess(xml: string, input: DeckInput) {
  const recommendations = input.client.recs.length ? input.client.recs : ['Sample recommendation'];
  let index = 0;
  return xml.replaceAll('<a:t>Bullet</a:t>', () => {
    const text = recommendations[index] ?? '';
    index += 1;
    return `<a:t>${escapeText(text)}</a:t>`;
  });
}

function fillBenefitSummary(xml: string, input: DeckInput) {
  const inRange = input.client.trend.reviews.some((review) => overlaps(review.s, review.e, input.range));
  if (inRange) return xml;
  return replaceExact(xml, '(ROI)', `(ROI) No ROI review loaded for ${input.rangeLabel}.`);
}

/** Same headline figures as the Executive Highlights page. Client-facing notes only. */
function executiveLines(input: DeckInput): string[] {
  const roi = roiRatio(input.client.quantified, input.client.sub);
  const lines = [
    `Quantified benefit ${moneyFull(input.client.quantified)}`,
    `Additional value ${moneyFull(input.client.additional)}`,
    `Total value creation ${moneyFull(totalValueCreation(input.client))}`,
    `ROI ${roi.toFixed(1)} : 1`,
  ];
  const latest = input.client.trend.reviews[input.client.trend.reviews.length - 1];
  if (latest && !overlaps(latest.s, latest.e, input.range)) {
    lines.push(`Headline ROI is from the ${input.client.period} review, outside ${input.rangeLabel}.`);
  }
  const sources = visibleScrubs(input.client)
    .slice()
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  for (const [name, value] of sources) lines.push(`${name}: ${moneyFull(value)}`);
  return lines;
}

function replaceActionList(xml: string, lines: string[]): string {
  return xml.replace(/<p:txBody>([\s\S]*?)<\/p:txBody>/g, (full, inner: string) => {
    if (!inner.includes('Insert proposed action')) return full;
    const paragraphs = inner.match(/<a:p[\s\S]*?<\/a:p>/g);
    if (!paragraphs?.length) return full;
    const size = lines.length > 8 ? '1400' : '1800';
    const template = paragraphs[0].replace(/sz="2700"/g, `sz="${size}"`);
    const built = lines
      .map((line) => template.replace(/<a:t(?:\s[^>]*)?>[\s\S]*?<\/a:t>/, `<a:t>${escapeText(line)}</a:t>`))
      .join('');
    return `<p:txBody>${inner.replace(/<a:p[\s\S]*<\/a:p>/, built)}</p:txBody>`;
  });
}

function fillExecutive(xml: string, input: DeckInput): string {
  let next = replaceExact(xml, 'Closer Look', 'Executive Highlights');
  next = replaceExact(next, 'What does Best-in-Class look like for ', `${input.client.name} · ${input.client.period}`);
  next = replaceExact(next, '<<Insert>>', '');
  next = replaceExact(next, '?', '');
  const roi = roiRatio(input.client.quantified, input.client.sub);
  next = replaceExact(next, 'Notable accomplishments:', 'Executive message');
  next = replaceExact(
    next,
    'Insert ',
    `For every $1 invested, ${input.client.name} realized approximately $${roi.toFixed(2)} in measurable financial benefit during the review period.`,
  );
  return replaceActionList(next, executiveLines(input));
}

/** Place a filled Executive Highlights slide immediately after the title slide. */
async function addExecutiveSlide(zip: JSZip, input: DeckInput) {
  const source = await zip.file('ppt/slides/slide49.xml')?.async('string');
  const rels = await zip.file('ppt/slides/_rels/slide49.xml.rels')?.async('string');
  if (!source || !rels) return;
  const number = 51;
  zip.file(`ppt/slides/slide${number}.xml`, fillExecutive(source, input));
  zip.file(`ppt/slides/_rels/slide${number}.xml.rels`, rels);

  let contentTypes = await zip.file('[Content_Types].xml')!.async('string');
  const part = `/ppt/slides/slide${number}.xml`;
  if (!contentTypes.includes(part)) {
    contentTypes = contentTypes.replace(
      '</Types>',
      `<Override PartName="${part}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`,
    );
  }
  let relationships = await zip.file('ppt/_rels/presentation.xml.rels')!.async('string');
  const used = [...relationships.matchAll(/\bId="rId(\d+)"/g)].map((match) => Number(match[1]));
  const rId = `rId${Math.max(...used) + 1}`;
  relationships = relationships.replace(
    '</Relationships>',
    `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${number}.xml"/></Relationships>`,
  );
  let presentation = await zip.file('ppt/presentation.xml')!.async('string');
  const sldIds = [...presentation.matchAll(/<p:sldId\b[^>]*\bid="(\d+)"/g)].map((match) => Number(match[1]));
  const sldId = Math.max(...sldIds) + 1;
  presentation = presentation.replace(/<p:sldId\b[^>]*\/>/, (first) => `${first}<p:sldId id="${sldId}" r:id="${rId}"/>`);
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('ppt/_rels/presentation.xml.rels', relationships);
  zip.file('ppt/presentation.xml', presentation);
}

function fillClosing(xml: string, input: DeckInput) {
  return replaceTextNodes(xml, (text) => {
    let next = text.split('University of Utah Health').join(input.client.name);
    next = next.split('University of Utah').join(input.client.name);
    if (next.includes('<<Insert client name>>')) next = next.replaceAll('<<Insert client name>>', input.client.name);
    return next === text ? null : next;
  });
}

/** Titles that would present a workflow this profile does not use. */
function absentPhrases(input: DeckInput) {
  const phrases: string[] = [];
  if (!hasWorkflow(input, /financial clearance|address verification/i)) phrases.push('Patient Financial Clearance');
  if (!hasWorkflow(input, /medicaid/i)) phrases.push('Medicaid Scrub');
  return phrases;
}

function scrubAbsentWorkflows(xml: string, phrases: string[]) {
  if (!phrases.length) return xml;
  return replaceTextNodes(xml, (text) => (phrases.some((phrase) => text.includes(phrase)) ? '' : null));
}

async function removeSlides(zip: JSZip, numbers: Set<number>) {
  let presentation = await zip.file('ppt/presentation.xml')!.async('string');
  let relationships = await zip.file('ppt/_rels/presentation.xml.rels')!.async('string');
  let contentTypes = await zip.file('[Content_Types].xml')!.async('string');
  for (const number of numbers) {
    const target = `slides/slide${number}.xml`;
    const relationship = relationships.match(new RegExp(`<Relationship\\b[^>]*Target="${target}"[^>]*/>`));
    const id = relationship?.[0].match(/\bId="(rId\d+)"/)?.[1];
    if (relationship && id) {
      relationships = relationships.replace(relationship[0], '');
      presentation = presentation.replace(new RegExp(`<p:sldId\\b[^>]*r:id="${id}"[^>]*/>`), '');
    }
    contentTypes = contentTypes.replace(new RegExp(`<Override\\b[^>]*PartName="/ppt/${target}"[^>]*/>`), '');
    zip.remove(`ppt/slides/slide${number}.xml`);
    zip.remove(`ppt/slides/_rels/slide${number}.xml.rels`);
  }
  zip.file('ppt/presentation.xml', presentation);
  zip.file('ppt/_rels/presentation.xml.rels', relationships);
  zip.file('[Content_Types].xml', contentTypes);
}

/** Copy the uploaded Utilization Review template and write this client's figures into it. */
export async function fillReviewTemplate(input: DeckInput): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(await templateBytes());
  const edits: Record<number, (xml: string) => string> = {
    1: (xml) => fillSlide1(xml, input),
    18: (xml) => fillReturnMail(xml, input),
    19: (xml) => fillDialer(xml, input),
    20: (xml) => fillReturnMail(xml, input),
    21: (xml) => fillMedicaid(xml, input),
    27: (xml) => fillSegmentation(xml, input),
    32: (xml) => fillAgency(xml, input),
    39: (xml) => fillBenefitSummary(xml, input),
    42: (xml) => fillValue(xml, input),
    46: (xml) => fillSuccess(xml, input),
    50: (xml) => fillClosing(xml, input),
  };
  const dropped = slidesToRemove(input);
  const phrases = absentPhrases(input);
  const slidePaths = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path));
  for (const path of slidePaths) {
    const number = Number(path.match(/slide(\d+)/)![1]);
    if (dropped.has(number)) continue;
    const file = zip.file(path);
    if (!file) continue;
    let xml = await file.async('string');
    const edit = edits[number];
    if (edit) xml = edit(xml);
    xml = scrubAbsentWorkflows(xml, phrases);
    zip.file(path, xml);
  }
  await removeSlides(zip, dropped);
  await addExecutiveSlide(zip, input);
  return zip.generateAsync({ type: 'uint8array' });
}
