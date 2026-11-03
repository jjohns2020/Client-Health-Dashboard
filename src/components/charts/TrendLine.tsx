import { Legend } from './Legend';
import type { Fmt, Series } from './types';

/** Monthly trend lines with gridlines; null points are skipped; the last point of each series is labelled. */
export function TrendLine({ cats, series, fmt, zero }: { cats: string[]; series: Series[]; fmt: Fmt; zero?: boolean }) {
  const w = 600,
    h = 230,
    pl = 62,
    pr = 20;
  const all = series.flatMap((x) => x.v.filter((v): v is number => v != null));
  let max = Math.max(...all),
    min = zero ? 0 : Math.min(...all);
  const span = max - min || 1;
  max += span * 0.12;
  min = Math.max(0, min - span * 0.12);
  const n = cats.length,
    X = (i: number) => pl + (i * (w - pl - pr)) / Math.max(n - 1, 1),
    Y = (v: number) => h - 10 - ((h - 30) * (v - min)) / (max - min);
  const step = Math.ceil(n / 8);
  return (
    <svg viewBox={`0 0 ${w} ${h + 44}`} width="100%" role="img">
      {[0, 1, 2, 3].map((k) => {
        const v = min + ((max - min) * k) / 3,
          y = Y(v);
        return (
          <g key={k}>
            <line x1={pl} y1={y} x2={w - pr} y2={y} stroke="#EEE" />
            <text x={pl - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#8A8D91">
              {fmt(v)}
            </text>
          </g>
        );
      })}
      {cats.map((c, i) =>
        i % step === 0 || i === n - 1 ? (
          <text key={i} x={X(i)} y={h + 10} textAnchor="middle" fontSize="10" fill="#53565A">
            {c}
          </text>
        ) : null,
      )}
      {series.map((se, si) => {
        const pts = se.v.map((v, i) => (v == null ? null : X(i) + ',' + Y(v))).filter(Boolean);
        const li = se.v
          .map((v, i) => (v == null ? -1 : i))
          .filter((i) => i >= 0)
          .pop();
        const lv = li != null ? se.v[li] : null;
        return (
          <g key={si}>
            <polyline
              fill="none"
              stroke={se.c}
              strokeWidth={se.w || 2.5}
              strokeDasharray={se.dash ? '5,4' : undefined}
              points={pts.join(' ')}
            />
            {li != null && lv != null && !se.nolabel && (
              <>
                <circle cx={X(li)} cy={Y(lv)} r="4" fill={se.c} />
                <text x={X(li) - 4} y={Y(lv) - 9} textAnchor="end" fontSize="11" fontWeight="600" fill={se.c}>
                  {fmt(lv)}
                </text>
              </>
            )}
          </g>
        );
      })}
      <Legend series={series} x0={pl} y={h + 28} charWidth={6.5} gap={44} swatch="line" />
    </svg>
  );
}
