import type { Client, WorkflowDetail } from '../data/types';
import type { OverallStatus } from './dataChecks';

/** A client deck downloads unless Data Checks found a FIX (status NOT READY). REVIEW does not block. */
export const canExport = (status: OverallStatus) => status !== 'NOT READY';

export interface SlidePlan {
  fileName: string;
  slides: string[];
  /** Slides added only because of this client's profile (Agency / Dialer). */
  profileSlides: string[];
}

/**
 * Slide list the PowerPoint export would build from the Utilization Review template.
 * Internal pages (Portfolio, Opportunity Sizing, Data Checks), other clients and internal notes are never included.
 */
export function buildSlidePlan(c: Client, visibleDetails: WorkflowDetail[]): SlidePlan {
  const s = [
    'Title',
    'Agenda',
    'Executive Highlights',
    'ROI Summary',
    'Collection Optimization Overview',
    ...visibleDetails.filter((d) => !d.empty).map((d) => d.name + ' Results'),
  ];
  if (c.seg) s.push('Segmentation Performance');
  s.push('Cash Impact Analysis', 'Performance Trend (review over review, YoY)');
  const extra: string[] = [];
  if (c.agency) extra.push('Agency Performance vs. Benchmark');
  if (c.dialer) extra.push('Dialer Performance');
  s.push('Value Delivery Summary', 'Success Plan & Recommendations');
  return {
    fileName: `${c.name}_${c.period.replace(/[^A-Za-z0-9]+/g, '_')}_ROI_Review.pptx`,
    slides: s,
    profileSlides: extra,
  };
}
