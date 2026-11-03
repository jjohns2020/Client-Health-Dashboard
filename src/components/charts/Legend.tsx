import type { Series } from './types';

/** Inline SVG legend. `swatch` is square (bars) or a short line (trend lines). */
export function Legend({
  series,
  x0,
  y,
  charWidth,
  gap,
  swatch,
}: {
  series: Pick<Series, 'n' | 'c'>[];
  x0: number;
  y: number;
  charWidth: number;
  gap: number;
  swatch: 'square' | 'line';
}) {
  let lx = x0;
  return (
    <>
      {series.map((se, i) => {
        const x = lx;
        lx += se.n.length * charWidth + gap;
        return swatch === 'square' ? (
          <g key={i}>
            <rect x={x} y={y} width="10" height="10" fill={se.c} />
            <text x={x + 14} y={y + 9} fontSize="11" fill="#53565A">
              {se.n}
            </text>
          </g>
        ) : (
          <g key={i}>
            <rect x={x} y={y} width="12" height="4" fill={se.c} />
            <text x={x + 16} y={y + 6} fontSize="11" fill="#53565A">
              {se.n}
            </text>
          </g>
        );
      })}
    </>
  );
}
