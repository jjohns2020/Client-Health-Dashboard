import type { CSSProperties, ReactNode } from 'react';
import { useDashboard } from '../../state/DashboardContext';

/** Dark banner shown at the top of every internal-only page. */
export function InternalBanner({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: '#53565A', color: '#fff', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      🔒 <b>INTERNAL ONLY — never client-facing.</b> {children}
    </div>
  );
}

/** Pill label, e.g. MOCKUP or ILLUSTRATIVE SAMPLE DATA. Gray variant marks illustrative data. */
export function MockTag({ children, gray, style }: { children: ReactNode; gray?: boolean; style?: CSSProperties }) {
  return (
    <span className="mock" style={{ ...(gray ? { background: '#8A8D91' } : {}), ...style }}>
      {children}
    </span>
  );
}

export function RangeChip() {
  const { rangeLabel } = useDashboard();
  return (
    <span style={{ background: '#E8F1FB', color: '#005EB8', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12 }}>
      📅 {rangeLabel}
    </span>
  );
}

export function PageHead({ title, subtitle }: { title: ReactNode; subtitle: ReactNode }) {
  const { client } = useDashboard();
  return (
    <>
      <p className="title">{title}</p>
      <p className="subtitle">
        {client.name} · {client.period} — {subtitle}
      </p>
    </>
  );
}

export function Card({ title, children, style }: { title?: ReactNode; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className="card" style={style}>
      {title != null && <h4>{title}</h4>}
      {children}
    </div>
  );
}

export function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid2">{children}</div>;
}

export function Takeaway({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="takeaway">
      <b>{label}</b> {children}
    </div>
  );
}

/** Gray takeaway box used for internal notes and flags. */
export function InternalNote({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="takeaway" style={{ borderColor: '#53565A', background: '#F3F4F6' }}>
      <b style={{ color: '#53565A' }}>{label}</b>
      {children}
    </div>
  );
}
