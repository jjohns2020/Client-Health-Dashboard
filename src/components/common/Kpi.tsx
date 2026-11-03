import type { ReactNode } from 'react';

export function Kpi({ label, value, note, color }: { label: ReactNode; value: ReactNode; note?: ReactNode; color: string }) {
  return (
    <div className="kpi" style={{ borderBlockStartColor: color }}>
      <div className="l">{label}</div>
      <div className="v" style={{ color }}>
        {value}
      </div>
      <div className="n">{note}</div>
    </div>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return <div className="kpis">{children}</div>;
}
