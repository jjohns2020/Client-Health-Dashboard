import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { sampleDataSource } from '../../data/dataSource';
import { buildExecutiveOverview, executiveOverviewFileName, type OverviewInput } from './executiveOverview';

const ds = sampleDataSource.load();

function inputFor(key: 'maine' | 'washu', patch: Partial<OverviewInput> = {}): OverviewInput {
  return {
    client: ds.clients[key],
    range: { fI: 0, tI: 20 },
    rangeLabel: 'Jan 2024 – Sep 2025',
    insights: ds.insights[key],
    ...patch,
  };
}

async function documentText(input: OverviewInput) {
  const bytes = await buildExecutiveOverview(input);
  const zip = await JSZip.loadAsync(bytes);
  expect(await zip.file('[Content_Types].xml')!.async('string')).toContain('wordprocessingml.document.main+xml');
  const xml = await zip.file('word/document.xml')!.async('string');
  return [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map((match) => match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
    .join('');
}

describe('executive overview document', () => {
  it('names the file for the client and period', () => {
    expect(executiveOverviewFileName(ds.clients.maine)).toBe('MaineHealth_Q3_2025_Jul_Sep__Executive_Highlights.docx');
  });

  it('writes the MaineHealth headline figures and leaves internal notes out', async () => {
    const text = await documentText(inputFor('maine'));
    expect(text).toContain('Executive Highlights');
    expect(text).toContain('MaineHealth');
    expect(text).toContain('Q3 2025 (Jul – Sep)');
    expect(text).toContain('$485,089');
    expect(text).toContain('3.4 : 1');
    expect(text).toContain('For every $1 invested, MaineHealth realized approximately $3.43');
    expect(text).toContain('More addresses found and corrected year over year');
    expect(text).toContain('Low income does not mean low likelihood to pay');
    expect(text).toContain('Sample data. Not validated production results.');
    expect(text).toContain('illustrative sample data');
    expect(text).not.toContain('falls outside');
    expect(text).not.toContain('ROI rests almost entirely on one lever');
    expect(text).not.toContain('Workbook');
    expect(text).not.toContain('WashU');
  });

  it('says when the loaded review is outside the selected dates', async () => {
    const text = await documentText(inputFor('maine', { range: { fI: 0, tI: 5 }, rangeLabel: 'Jan 2024 – Jun 2024' }));
    expect(text).toContain('falls outside the selected dates (Jan 2024 – Jun 2024)');
  });
});
