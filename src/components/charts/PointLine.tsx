import { Legend } from './Legend';
import type { Fmt } from './types';

/** Line with a labelled point per category (review-over-review charts). */
export function PointLine({ cats, series, fmt }: { cats: string[]; series: { n: string; c: string; v: number[] }[]; fmt: Fmt }) {
  const w = 560,
    h = 220,
    pad = 50;
  const all = series.flatMap((x) => x.v),
    max = Math.max(...all) * 1.15,
    min = 0;
  const X = (i: number) => (cats.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (cats.length - 1)),
    Y = (v: number) => h - ((h - 30) * (v - min)) / (max - min);
  return (
    <svg viewBox={`0 0 ${w} ${h + 40}`} width="100%" role="img">
      <line x1={pad} y1={h} x2={w - pad} y2={h} stroke="#ccc" />
      {cats.map((c, i) => (
        <text key={i} x={X(i)} y={h + 16} textAnchor="middle" fontSize="12" fill="#53565A">
          {c}
        </text>
      ))}
      {series.map((se, si) => (
        <g key={si}>
          <polyline fill="none" stroke={se.c} strokeWidth="3" points={se.v.map((v, i) => X(i) + ',' + Y(v)).join(' ')} />
          {se.v.map((v, i) => (
            <g key={i}>
              <circle cx={X(i)} cy={Y(v)} r="5" fill={se.c} />
              <text x={X(i)} y={Y(v) - 10} textAnchor="middle" fontSize="11" fill="#262626">
                {fmt(v)}
              </text>
            </g>
          ))}
        </g>
      ))}
      <Legend series={series} x0={pad} y={h + 26} charWidth={7} gap={40} swatch="square" />
    </svg>
  );
}
