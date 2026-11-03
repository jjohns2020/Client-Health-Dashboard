import type { ReactNode } from 'react';

/** Simple table where every column after the first is right-aligned (workbook YoY blocks). */
export function NumericTable({ headers, rows }: { headers: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <table>
      <tbody>
        <tr>
          {headers.map((x, i) => (
            <th key={i} className={i ? 'num' : ''}>
              {x}
            </th>
          ))}
        </tr>
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((x, i) => (
              <td key={i} className={i ? 'num' : ''}>
                {x}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
