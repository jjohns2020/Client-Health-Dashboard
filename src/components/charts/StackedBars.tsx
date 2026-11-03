import { Legend } from './Legend';
import type { Fmt } from './types';

/** Stacked monthly bars with gridlines. */
export function StackedBars({ cats, series, fmt }: { cats: string[]; series: { n: string; c: string; v: (number | null)[] }[]; fmt: Fmt }) {
  const w = 600,
    h = 220,
    pl = 62,
    pr = 20,
    n = cats.length,
    gw = (w - pl - pr) / n,
    tot = cats.map((_, i) => series.reduce((a, s) => a + (s.v[i] || 0), 0)),
    max = Math.max(...tot) * 1.1;
  const step = Math.ceil(n / 8);
  return (
    <svg viewBox={`0 0 ${w} ${h + 44}`} width="100%" role="img">
      {[0, 1, 2, 3].map((k) => {
        const v = (max * k) / 3,
          y = h - 10 - ((h - 30) * v) / max;
        return (
          <g key={k}>
            <line x1={pl} y1={y} x2={w - pr} y2={y} stroke="#EEE" />
            <text x={pl - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#8A8D91">
              {fmt(v)}
            </text>
          </g>
        );
      })}
      {cats.map((c, i) => {
        let y0 = h - 10;
        return (
          <g key={i}>
            {series.map((se, j) => {
              const bh = ((h - 30) * (se.v[i] || 0)) / max;
              y0 -= bh;
              return <rect key={j} x={pl + i * gw + gw * 0.15} y={y0} width={gw * 0.7} height={bh} fill={se.c} />;
            })}
            {(i % step === 0 || i === n - 1) && (
              <text x={pl + i * gw + gw / 2} y={h + 10} textAnchor="middle" fontSize="10" fill="#53565A">
                {c}
              </text>
            )}
          </g>
        );
      })}
      <Legend series={series} x0={pl} y={h + 26} charWidth={6.5} gap={40} swatch="square" />
    </svg>
  );
}
