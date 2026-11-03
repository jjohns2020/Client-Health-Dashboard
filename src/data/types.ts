export type ClientKey = string;

/** Number format hint used throughout the workbook data: n = count, p = percent (0–1), $ = dollars. */
export type ValueFormat = 'n' | 'p' | '$';

export interface CashImpact {
  prior: string;
  cur: string;
  payPrior: number;
  payCur: number;
  ratePrior: number;
  rateCur: number;
  lift: number;
  liftLabel: string;
}

/** One loaded ROI review. `s`/`e` are month indexes into the shared monthly calendar. */
export interface TrendReview {
  p: string;
  m: number;
  b: number;
  sub: number;
  s: number;
  e: number;
}

export interface TrendYoy {
  p: string;
  py: string;
  cy: string;
  pay: [number, number];
  rate: [number, number];
}

export interface ClientTrend {
  reviews: TrendReview[];
  yoy: TrendYoy[];
  wf?: { label: string; rows: [string, number, number][] };
  seg?: { years: string[]; vol: number[][] };
  note: string;
}

export interface AgencyData {
  buckets: string[];
  periods: Record<string, Record<string, number[]>>;
}

/** Client Profile flags (Uses PFC / Medicaid via eInsights / Has Agency / Has Dialer). */
export interface ClientProfileFlags {
  agency: boolean;
  dialer: boolean;
  pfc: boolean;
  ein: boolean;
}

export interface Client extends ClientProfileFlags {
  name: string;
  period: string;
  source: string;
  decision: string;
  quantified: number;
  sub: number;
  additional: number;
  fte?: number;
  scrubs: [string, number][];
  addl: [string, number][];
  ops: [string, number, ValueFormat][];
  cash: CashImpact;
  seg: { vol: number[]; pay: number[] } | null;
  agencyData?: AgencyData;
  trend: ClientTrend;
  recs: string[];
}

export interface MonthlySeries {
  months: string[];
  pay: number[];
  rate: number[];
  wf: Record<string, number[]>;
  known: string;
  dialer: { attempts: number[]; contacts: number[]; payments: number[] };
}

export type YoyRow = (string | number | null)[];

export interface ScrubData {
  rm: { new: number[]; imp: number[]; eq: number[]; nh: number[] };
  piv: { vol: number[]; new: number[]; imp: number[] };
  bk: number[];
  dc: number[];
  mc: { rec: number[]; cov: number[] };
  ch: number[];
  yoy: {
    rm: [string, number | null, number | null, number | null][];
    rmc: [string, number][];
    piv: [string, number, number, number][];
    bk: [string, number, number][];
    dc: [string, number][];
    mc: [string, number, number][];
    ch: [string, number, number][];
  };
  flags: string[];
  known: string;
}

export interface WorkflowChart {
  t: string;
  cats: string[];
  v: number[];
  f: ValueFormat;
}

export type WorkflowKey = 'pfc' | 'av' | 'bk' | 'dc' | 'rm' | 'mc' | 'ch';
export type ScrubKey = 'rm' | 'piv' | 'bk' | 'dc' | 'mc' | 'ch';

/** Content of one Utilization Review workflow slide (Workflow Results detail page). */
export interface WorkflowDetail {
  name: string;
  sub: string;
  src: string;
  kpis?: [string, string, string][];
  table?: { h: string[]; r: [string, string][] };
  charts?: WorkflowChart[];
  tl?: string;
  take?: string;
  empty?: string;
  trend?: ScrubKey;
}

export type InsightType = 'Observation' | 'Risk' | 'Opportunity' | 'Data quality';
export type Audience = 'client' | 'internal';

export interface Insight {
  area: string;
  type: InsightType;
  aud: Audience;
  title: string;
  obs: string;
  so: string;
  rec: string;
  metric: string;
}

export type OpportunityStatus = 'Accepted' | 'Proposed' | 'In discussion' | 'Not yet discussed' | 'Declined';

export interface Opportunity {
  w: string;
  o: string;
  v: number;
  src: string;
  st: OpportunityStatus;
}

/** Medicaid source split (Experian vs eInsights). The expCov/expPay shares are illustrative. */
export interface MedicaidSplit {
  expCov: number;
  expPay: number;
  rec: number;
  recBal: number;
  cov: number;
  covBal: number;
  pay: number;
  stmt: number;
  yoy: [string, number, number][];
}

export interface DataLoad {
  n: string;
  p: string;
  s: number;
  e: number;
}

/** Everything the dashboard reads. A real data source must produce this shape. */
export interface Dataset {
  clients: Record<ClientKey, Client>;
  monthly: Record<ClientKey, MonthlySeries>;
  scrubData: Record<ClientKey, ScrubData>;
  details: Record<ClientKey, Partial<Record<WorkflowKey, WorkflowDetail>>>;
  insights: Record<ClientKey, Insight[]>;
  opps: Record<ClientKey, Opportunity[]>;
  /** Number of months in each client's review period (used to annualize opportunities). */
  months: Record<ClientKey, number>;
  medSplit: Record<ClientKey, MedicaidSplit | undefined>;
  loads: Record<ClientKey, DataLoad[]>;
  /** Workbook "Avg Guar to Acct Ratio" used for the Return Mail guarantor view. */
  guarRatio: Record<ClientKey, number>;
}
