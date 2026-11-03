export type Fmt = (v: number) => string;

export interface Series {
  n: string;
  c: string;
  v: (number | null)[];
  w?: number;
  dash?: boolean;
  nolabel?: boolean;
}
