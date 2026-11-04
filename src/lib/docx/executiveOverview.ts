/**
 * Client-facing Executive Highlights as a Word document.
 * Same figures as the Executive Highlights page. Internal notes are left out.
 * This is a separate download from the Utilization Review PowerPoint.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Client, Insight } from '../../data/types';
import type { MonthRange } from '../dateRange';
import { overlaps } from '../dateRange';
import { moneyFull } from '../format';
import { roiRatio, totalValueCreation } from '../roi';
import { visibleInsights, visibleScrubs } from '../visibility';

export interface OverviewInput {
  client: Client;
  range: MonthRange;
  rangeLabel: string;
  insights: Insight[];
}

const BLUE = '005EB8';
const INK = '262626';
const MUTED = '53565A';
const LINE = 'D0D5DD';
const PAGE = 10080;

const hair = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: hair, bottom: hair, left: hair, right: hair };

export function executiveOverviewFileName(client: Pick<Client, 'name' | 'period'>) {
  return `${client.name}_${client.period.replace(/[^A-Za-z0-9]+/g, '_')}_Executive_Highlights.docx`;
}

function text(value: string, options: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}) {
  return new TextRun({
    text: value,
    bold: options.bold,
    italics: options.italics,
    color: options.color ?? INK,
    size: options.size ?? 22,
    font: 'Calibri',
  });
}

function paragraph(value: string, options: { bold?: boolean; color?: string; size?: number; italics?: boolean; before?: number; after?: number } = {}) {
  return new Paragraph({
    spacing: { before: options.before ?? 0, after: options.after ?? 120 },
    children: [text(value, options)],
  });
}

function heading(value: string) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 1 } },
    children: [text(value, { bold: true, color: BLUE, size: 26 })],
  });
}

function cell(value: string, width: number, options: { bold?: boolean; fill?: string; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  const onColor = options.fill === BLUE;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: options.fill ? { type: ShadingType.CLEAR, fill: options.fill } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: options.align ?? AlignmentType.LEFT,
        children: [text(value, { bold: options.bold || onColor, color: options.color ?? (onColor ? 'FFFFFF' : INK), size: 20 })],
      }),
    ],
  });
}

function table(rows: TableRow[], widths: number[]) {
  return new Table({
    width: { size: PAGE, type: WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}

function executiveMessage(client: Client) {
  const roi = roiRatio(client.quantified, client.sub);
  return `For every $1 invested, ${client.name} realized approximately $${roi.toFixed(2)} in measurable financial benefit during the review period.`;
}

function overviewDocument(input: OverviewInput) {
  const { client } = input;
  const roi = roiRatio(client.quantified, client.sub);
  const latest = client.trend.reviews[client.trend.reviews.length - 1];
  const outside = latest && !overlaps(latest.s, latest.e, input.range);
  const highlights = visibleInsights(input.insights, client)
    .filter((item) => item.aud === 'client')
    .slice(0, 3);
  const sources = visibleScrubs(client);
  const quarter = Math.floor(PAGE / 4);

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [text('Executive Highlights', { bold: true, color: BLUE, size: 40 })],
    }),
    paragraph(`${client.name} · ${client.period}`, { color: MUTED, size: 24, after: 40 }),
    paragraph('Sample data. Not validated production results.', { italics: true, color: MUTED, size: 18, after: 160 }),
  ];

  if (outside) {
    children.push(
      table(
        [
          new TableRow({
            children: [
              cell(
                `Headline ROI figures are from the ${client.period} review, which falls outside the selected dates (${input.rangeLabel}).`,
                PAGE,
                { fill: 'FFF6EC' },
              ),
            ],
          }),
        ],
        [PAGE],
      ),
    );
  }

  children.push(
    heading('Headline results'),
    table(
      [
        new TableRow({
          children: ['Quantified benefit', 'Additional value', 'Total value creation', 'ROI'].map((label) => cell(label, quarter, { bold: true, fill: BLUE })),
        }),
        new TableRow({
          children: [
            cell(moneyFull(client.quantified), quarter, { bold: true }),
            cell(moneyFull(client.additional), quarter, { bold: true }),
            cell(moneyFull(totalValueCreation(client)), quarter, { bold: true }),
            cell(`${roi.toFixed(1)} : 1`, quarter, { bold: true }),
          ],
        }),
      ],
      [quarter, quarter, quarter, quarter],
    ),
    paragraph('Quantified benefit and the subscription are the ROI. Additional value is identified on top of that ROI.', {
      color: MUTED,
      size: 18,
      before: 80,
    }),
    heading('Where the value came from'),
    table(
      [
        new TableRow({
          children: [cell('Source', 7000, { bold: true, fill: BLUE }), cell('Value', 3080, { bold: true, fill: BLUE, align: AlignmentType.RIGHT })],
        }),
        ...sources.map(
          ([name, value]) =>
            new TableRow({
              children: [cell(name, 7000), cell(moneyFull(value), 3080, { align: AlignmentType.RIGHT })],
            }),
        ),
      ],
      [7000, 3080],
    ),
    heading('Benefit and investment'),
    table(
      [
        new TableRow({
          children: [
            cell('Quantified benefit', 7000, { bold: true }),
            cell(moneyFull(client.quantified), 3080, { bold: true, align: AlignmentType.RIGHT }),
          ],
        }),
        new TableRow({
          children: [cell('Subscription', 7000), cell(moneyFull(client.sub), 3080, { align: AlignmentType.RIGHT })],
        }),
      ],
      [7000, 3080],
    ),
    heading('Executive message'),
    paragraph(executiveMessage(client), { size: 24, after: 80 }),
  );

  if (highlights.length) {
    children.push(heading('Analyst highlights'));
    for (const item of highlights) {
      children.push(
        paragraph(item.title, { bold: true, before: 80, after: 40 }),
        paragraph(item.obs, { after: 80 }),
      );
    }
  }

  children.push(
    paragraph(
      `Patient payments for ${input.rangeLabel} are illustrative sample data. They are shown on the dashboard and are not part of the quantified ROI.`,
      { italics: true, color: MUTED, size: 18, before: 200, after: 0 },
    ),
  );

  return new Document({
    title: `Executive Highlights — ${client.name}`,
    description: 'Sample data. Not validated production results.',
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 900, bottom: 900, left: 1080, right: 1080 },
          },
        },
        children,
      },
    ],
  });
}

/** Build the deliverable .docx. Returns the file bytes. */
export async function buildExecutiveOverview(input: OverviewInput): Promise<Uint8Array> {
  const buffer = await Packer.toBuffer(overviewDocument(input));
  return new Uint8Array(buffer);
}

/** Download the overview in the browser. In Node, returns the bytes without writing a file. */
export async function saveExecutiveOverview(input: OverviewInput) {
  const fileName = executiveOverviewFileName(input.client);
  if (typeof window === 'undefined') {
    return { fileName, bytes: await buildExecutiveOverview(input) };
  }
  const blob = await Packer.toBlob(overviewDocument(input));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
  return { fileName, bytes };
}
