import { Legend } from './Legend';
import type { Fmt } from './types';

/** Grouped vertical bars with value labels. */
export function VBars({ cats, series, fmt }: { cats: string[]; series: { n: string; c: string; v: number[] }[]; fmt: Fmt }) {
  const w = 560,
    h = 230,
    pad = 36,
    gw = (w - pad * 2) / cats.length,
    max = Math.max(...series.flatMap((s) => s.v), 0),
    scale = max > 0 ? max : 1,
    bw = gw / (series.length + 1);
  return (
    <svg viewBox={`0 0 ${w} ${h + 40}`} width="100%" role="img">
      <line x1={pad} y1={h} x2={w - pad} y2={h} stroke="#ccc" />
      {cats.map((c, i) => (
        <g key={i}>
          {series.map((se, j) => {
            const bh = ((h - 30) * se.v[i]) / scale,
              x = pad + i * gw + bw * (j + 0.5);
            return (
              <g key={j}>
                <rect x={x} y={h - bh} width={bw * 0.9} height={bh} fill={se.c} rx="2" />
                <text x={x + bw * 0.45} y={h - bh - 4} textAnchor="middle" fontSize="10" fill="#262626">
                  {fmt(se.v[i])}
                </text>
              </g>
            );
          })}
          <text x={pad + i * gw + gw / 2} y={h + 16} textAnchor="middle" fontSize="12" fill="#53565A">
            {c}
          </text>
        </g>
      ))}
      <Legend series={series} x0={pad} y={h + 26} charWidth={7} gap={40} swatch="square" />
    </svg>
  );
}
