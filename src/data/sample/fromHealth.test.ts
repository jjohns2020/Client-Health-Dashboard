import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sampleDataSource } from '../dataSource';
import { runChecks } from '../../lib/dataChecks';
import { roiRatio } from '../../lib/roi';
import { buildHealthMocks, healthRoster } from './fromHealth';

const JMAP: Record<string, string> = {
  'McLeod Health': 'mcleod',
  Rush: 'rush',
  'Washington University': 'washu',
  'MaineHealth (Maine General)': 'maine',
  'BJC HealthCare (Barnes-Jewish)': 'bjc',
  "Saint Luke's Health (MO)": 'stl',
};
const DISPLAY: Record<string, string> = {
  mcleod: 'McLeod Health',
  rush: 'Rush',
  washu: 'WashU',
  maine: 'MaineHealth',
  bjc: 'BJC HealthCare',
  stl: "Saint Luke's Health",
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function rosterFromCommandCenter() {
  const html = readFileSync('CO_Command_Center.html', 'utf8');
  const raw = JSON.parse(html.slice(html.indexOf('const ROI=') + 'const ROI='.length, html.indexOf(';\nconst OPS_CLIENTS'))) as {
    n: string;
    g: string;
    total: number | null;
    ratio: number | null;
  }[];
  return raw
    .filter((row) => row.g !== 'Terminated')
    .map((row) => {
      const id = JMAP[row.n] || slug(row.n);
      return { id, name: DISPLAY[id] || row.n, total: row.total, ratio: row.ratio };
    });
}

describe('client health roster mock workbooks', () => {
  const live = rosterFromCommandCenter();
  const ds = sampleDataSource.load();

  it('matches the command center roster, including ids and headline figures', () => {
    expect(healthRoster.map((row) => [row.id, row.name, row.total, row.ratio])).toEqual(
      live.map((row) => [row.id, row.name, row.total, row.ratio]),
    );
  });

  it('keeps the MaineHealth and WashU workbooks and adds a workbook for every other client', () => {
    expect(Object.keys(ds.clients)[0]).toBe('maine');
    expect(ds.clients.maine.quantified).toBe(485089);
    expect(ds.clients.maine.source).toContain('Utilization Review');
    expect(ds.clients.washu.quantified).toBe(3219869);
    expect(ds.clients.washu.agency).toBe(true);
    expect(Object.keys(ds.clients).sort()).toEqual(live.map((row) => row.id).sort());
    expect(buildHealthMocks().clients.maine).toBeUndefined();
    expect(buildHealthMocks().clients.washu).toBeUndefined();
  });

  it('builds Rush from its ROI stats mix and leaves the ratio unchanged', () => {
    const rush = ds.clients.rush;
    expect(rush.name).toBe('Rush');
    expect(rush.quantified).toBe(4646393);
    expect(rush.sub).toBe(Math.round(4646393 / 14));
    expect(roiRatio(rush.quantified, rush.sub).toFixed(1)).toBe('14.0');
    expect(rush.scrubs).toEqual([
      ['Segmentation', 2578614],
      ['Medicaid', 229019],
      ['Return Mail', 344717],
      ['Other quantified value', 4646393 - (2578614 + 229019 + 344717)],
    ]);
    expect(rush.period).toBe('2025 first half');
    expect(ds.details.rush.mc?.name).toBe('Medicaid');
    expect(ds.details.rush.ch).toBeUndefined();
  });

  it('opens an implementation client with no benefit and no invented workflow dollars', () => {
    const bjc = ds.clients.bjc;
    expect(bjc.quantified).toBe(0);
    expect(bjc.scrubs).toEqual([]);
    expect(bjc.period).toContain('no quantified ROI yet');
    expect(ds.details.bjc).toEqual({});
    expect(ds.opps.bjc).toEqual([]);
  });

  it('gives every client the shared monthly calendar and series the views read', () => {
    for (const id of Object.keys(ds.clients)) {
      expect(ds.monthly[id].months).toEqual(ds.monthly.maine.months);
      expect(ds.monthly[id].pay.every((v) => v > 0)).toBe(true);
      expect(ds.monthly[id].dialer.attempts.every((v, i) => v > 0 && ds.monthly[id].dialer.contacts[i] > 0)).toBe(true);
      const scrub = ds.scrubData[id];
      expect(scrub.rm.new).toHaveLength(ds.monthly.maine.months.length);
      expect(scrub.mc.rec.every((v, i) => v > 0 && scrub.mc.cov[i] > 0)).toBe(true);
      expect(ds.loads[id].length).toBeGreaterThan(0);
      expect(ds.months[id]).toBeGreaterThan(0);
      expect(ds.guarRatio[id]).toBeGreaterThan(0);
      expect(ds.insights[id].length).toBeGreaterThan(0);
      expect(() => runChecks(id, ds.clients[id], ds)).not.toThrow();
    }
  });
});
