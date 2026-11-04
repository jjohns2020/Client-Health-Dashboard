import type { Client, ClientKey, ClientProfileFlags, Dataset, ScrubKey, WorkflowKey } from '../data/types';
import { applyPreset, setFrom, setTo, type DatePreset, type MonthRange } from '../lib/dateRange';
import { clientFromSearch } from '../lib/siteLinks';
import type { MedicaidSource, ReturnMailLevel } from '../lib/roi';
import { INTERNAL_VIEWS, navItems, usesPfc, visibleDetails, type ViewId, type ViewKey } from '../lib/visibility';

export interface DashboardState {
  clientKey: ClientKey;
  view: ViewId;
  range: MonthRange;
  preset: DatePreset;
  present: boolean;
  /** Client Profile toggles, per client. Starts from each client's workbook flags. */
  profiles: Record<ClientKey, ClientProfileFlags>;
  /** Selected scrub tab in Trending (also set by opening a workflow detail page). */
  scrub: ScrubKey;
  rmLevel: ReturnMailLevel;
  medSrc: MedicaidSource;
  exportOpen: boolean;
}

export type DashboardAction =
  | { type: 'selectClient'; key: ClientKey }
  | { type: 'setView'; view: ViewKey }
  | { type: 'openDetail'; key: WorkflowKey }
  | { type: 'openTrending'; scrub: ScrubKey }
  | { type: 'setPreset'; preset: DatePreset }
  | { type: 'setFrom'; index: number }
  | { type: 'setTo'; index: number }
  | { type: 'setPresent'; present: boolean }
  | { type: 'setProfileFlag'; flag: keyof ClientProfileFlags; value: boolean }
  | { type: 'setScrub'; scrub: ScrubKey }
  | { type: 'setRmLevel'; level: ReturnMailLevel }
  | { type: 'setMedSrc'; src: MedicaidSource }
  | { type: 'openExport' }
  | { type: 'closeExport' };

export const calendarOf = (ds: Dataset) => Object.values(ds.monthly)[0].months;

export function effectiveClient(ds: Dataset, profiles: Record<ClientKey, ClientProfileFlags>, key: ClientKey): Client {
  return { ...ds.clients[key], ...profiles[key] };
}

export function initialState(ds: Dataset): DashboardState {
  const profiles = Object.fromEntries(
    Object.entries(ds.clients).map(([k, c]) => [k, { agency: c.agency, dialer: c.dialer, pfc: c.pfc, ein: c.ein }]),
  );
  const keys = Object.keys(ds.clients);
  const requested = typeof window === 'undefined' ? null : clientFromSearch(window.location.search, keys);
  return {
    clientKey: requested ?? keys[0],
    view: 'exec',
    range: { fI: 0, tI: calendarOf(ds).length - 1 },
    preset: 'all',
    present: false,
    profiles,
    scrub: 'rm',
    rmLevel: 'acct',
    medSrc: 'all',
    exportOpen: false,
  };
}

export const scrubTabs = (c: Client): [ScrubKey, string][] =>
  (
    [
      ['rm', 'Return Mail'],
      ['piv', 'Address Verification (PIV)'],
      ['bk', 'Bankruptcy'],
      ['dc', 'Deceased'],
      ['mc', 'Medicaid'],
      ['ch', 'Charity'],
    ] as [ScrubKey, string][]
  ).filter((t) => t[0] !== 'piv' || usesPfc(c));

/**
 * Applies the prototype's fallback rules: internal views leave in presentation mode, views hidden by the
 * client profile fall back to Executive Summary, hidden workflow details fall back to Workflow Results,
 * and a workflow detail page selects its scrub trend.
 */
export function normalize(s: DashboardState, ds: Dataset): DashboardState {
  const c = effectiveClient(ds, s.profiles, s.clientKey);
  let { view, scrub } = s;
  if (s.present && (INTERNAL_VIEWS as string[]).includes(view)) view = 'exec';
  const navKey = view.startsWith('d_') ? 'ops' : view;
  if (!navItems(c, s.present).some((x) => x.key === navKey)) view = 'exec';
  const details = visibleDetails(ds.details[s.clientKey], c);
  if (view.startsWith('d_')) {
    const d = details[view.slice(2) as WorkflowKey];
    if (!d) view = 'ops';
    else if (d.trend) scrub = d.trend;
  }
  if (view === 'trend') {
    const tabs = scrubTabs(c);
    if (!tabs.some((t) => t[0] === scrub)) scrub = tabs[0][0];
  }
  return view === s.view && scrub === s.scrub ? s : { ...s, view, scrub };
}

export function reduce(s: DashboardState, a: DashboardAction, ds: Dataset): DashboardState {
  const last = calendarOf(ds).length - 1;
  switch (a.type) {
    case 'selectClient':
      return { ...s, clientKey: a.key };
    case 'setView':
      return { ...s, view: a.view };
    case 'openDetail':
      return { ...s, view: `d_${a.key}` };
    case 'openTrending':
      return { ...s, scrub: a.scrub, view: 'trend' };
    case 'setPreset':
      return { ...s, preset: a.preset, range: applyPreset(a.preset, s.range, last) };
    case 'setFrom':
      return { ...s, preset: 'custom', range: setFrom(a.index, s.range) };
    case 'setTo':
      return { ...s, preset: 'custom', range: setTo(a.index, s.range) };
    case 'setPresent':
      return { ...s, present: a.present };
    case 'setProfileFlag': {
      const profiles = { ...s.profiles, [s.clientKey]: { ...s.profiles[s.clientKey], [a.flag]: a.value } };
      const next = { ...s, profiles };
      if (a.flag === 'ein' && !a.value) next.medSrc = 'all';
      if (a.flag === 'dialer' && a.value) next.view = 'dialer';
      return next;
    }
    case 'setScrub':
      return { ...s, scrub: a.scrub };
    case 'setRmLevel':
      return { ...s, rmLevel: a.level };
    case 'setMedSrc':
      return { ...s, medSrc: a.src };
    case 'openExport':
      return { ...s, exportOpen: true };
    case 'closeExport':
      return { ...s, exportOpen: false };
  }
}

export const dashboardReducer = (ds: Dataset) => (s: DashboardState, a: DashboardAction) => normalize(reduce(s, a, ds), ds);
