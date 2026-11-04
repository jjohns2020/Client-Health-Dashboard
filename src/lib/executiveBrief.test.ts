import { describe, expect, it } from 'vitest';
import { sampleDataSource } from '../data/dataSource';
import { buildExecutiveBrief } from './executiveBrief';
import { buildSlidePlan } from './exportPlan';
import { visibleDetails } from './visibility';

const ds = sampleDataSource.load();

describe('internal executive summary', () => {
  it('leads with the workbook ROI and keeps internal notes off the client story', () => {
    const brief = buildExecutiveBrief('maine', ds.clients.maine, ds, ds.insights.maine, { fI: 0, tI: 20 });
    expect(brief.ratioLabel).toBe('3.4 : 1');
    expect(brief.subscription).toBe('$141,498');
    expect(brief.quantified).toBe('$485K');
    expect(brief.sources.map((row) => row.value)).toEqual(['$464,737', '$20,352']);
    expect(brief.message).toContain('MaineHealth');
    expect(brief.say.map((point) => point.title)).toContain('Q3 value is driven by stronger patient payment performance');
    expect(brief.hold.map((point) => point.title)).toContain('ROI rests almost entirely on one lever');
    expect(brief.say.some((point) => point.title === 'ROI rests almost entirely on one lever')).toBe(false);
    expect(brief.recommendations[0]).toBe('Return Mail Automation');
    expect(brief.status).toBe('REVIEW');
    expect(brief.outsideReview).toBe(false);
  });

  it('leaves declined opportunities out and labels illustrative ones', () => {
    const brief = buildExecutiveBrief('washu', ds.clients.washu, ds, ds.insights.washu, { fI: 0, tI: 2 });
    expect(brief.opportunities.map((item) => item.name)).not.toContain('Bankruptcy vendor revenue stream');
    expect(brief.opportunities.find((item) => item.workflow === 'Segmentation')!.illustrative).toBe(true);
    expect(brief.outsideReview).toBe(true);
    expect(brief.ratioLabel).toBe('17.2 : 1');
  });

  it('is not part of the client slide list', () => {
    const plan = buildSlidePlan(ds.clients.maine, Object.values(visibleDetails(ds.details.maine, ds.clients.maine)));
    for (const title of [...plan.slides, ...plan.profileSlides]) expect(title).not.toMatch(/Executive Brief|Internal/);
  });
});
