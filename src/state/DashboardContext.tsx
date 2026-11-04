import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Client, Dataset, MedicaidSplit, WorkflowDetail, WorkflowKey } from '../data/types';
import { rangeLabel } from '../lib/dateRange';
import { medicaidFactor } from '../lib/roi';
import { usesEin, usesPfc, visibleDetails, visibleInsights } from '../lib/visibility';
import {
  calendarOf,
  dashboardReducer,
  effectiveClient,
  initialState,
  normalize,
  type DashboardAction,
  type DashboardState,
} from './dashboardState';

export interface DashboardValue {
  ds: Dataset;
  state: DashboardState;
  dispatch: Dispatch<DashboardAction>;
  /** Selected client with Client Profile toggles applied. */
  client: Client;
  calendar: string[];
  rangeLabel: string;
  details: Partial<Record<WorkflowKey, WorkflowDetail>>;
  insights: ReturnType<typeof visibleInsights>;
  usesPfc: boolean;
  usesEin: boolean;
  medSplit: MedicaidSplit | undefined;
  medF: (kind: 'cov' | 'pay') => number;
  guarRatio: number;
}

const Ctx = createContext<DashboardValue | null>(null);

export function DashboardProvider({
  dataset,
  initialClientKey,
  children,
}: {
  dataset: Dataset;
  initialClientKey?: string;
  children: ReactNode;
}) {
  const reducer = useMemo(() => dashboardReducer(dataset), [dataset]);
  const [state, dispatch] = useReducer(reducer, { dataset, initialClientKey }, (boot) => {
    const next = initialState(boot.dataset);
    if (boot.initialClientKey && boot.dataset.clients[boot.initialClientKey]) next.clientKey = boot.initialClientKey;
    return normalize(next, boot.dataset);
  });
  const value = useMemo<DashboardValue>(() => {
    const client = effectiveClient(dataset, state.profiles, state.clientKey);
    const calendar = calendarOf(dataset);
    const medSplit = dataset.medSplit[state.clientKey];
    const ein = usesEin(client);
    return {
      ds: dataset,
      state,
      dispatch,
      client,
      calendar,
      rangeLabel: rangeLabel(calendar, state.range),
      details: visibleDetails(dataset.details[state.clientKey], client),
      insights: visibleInsights(dataset.insights[state.clientKey], client),
      usesPfc: usesPfc(client),
      usesEin: ein,
      medSplit,
      medF: (kind) => medicaidFactor(kind, medSplit, ein, state.medSrc),
      guarRatio: dataset.guarRatio[state.clientKey],
    };
  }, [dataset, state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDashboard must be used inside DashboardProvider');
  return v;
}
