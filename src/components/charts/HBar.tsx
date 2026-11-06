import type { Fmt } from './types';

/** Horizontal bars with labels on the left and values at the bar end. */
export function HBar({ rows, color, fmt }: { rows: [string, number][]; color: string | string[]; fmt: Fmt }) {
  const w = 560,
    rh = 30,
    lw = 210,
    max = Math.max(...rows.map((r) => r[1]));
  if (!rows.length || !Number.isFinite(max) || max <= 0) return <p className="note">No quantified workflow dollars in this review.</p>;
  return (
    <svg viewBox={`0 0 ${w} ${rows.length * rh + 10}`} width="100%" role="img">
      {rows.map((r, i) => {
        const bw = ((w - lw - 90) * r[1]) / max;
        return (
          <g key={i}>
            <text x={lw - 8} y={i * rh + 20} textAnchor="end" fontSize="12" fill="#53565A">
              {r[0]}
            </text>
            <rect
              x={lw}
              y={i * rh + 6}
              width={Math.max(bw, 2)}
              height="18"
              rx="3"
              fill={Array.isArray(color) ? color[i % color.length] : color}
            />
            <text x={lw + bw + 6} y={i * rh + 20} fontSize="12" fill="#262626">
              {fmt(r[1])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
