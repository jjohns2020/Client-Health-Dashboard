import type { ReactNode } from 'react';

/** Outlined button group with a filled active option (scrub tabs, Accounts/Guarantors, Delivered by). */
export function ToggleButton({
  active,
  color,
  onClick,
  children,
  kind,
  value,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: ReactNode;
  /** Group class (scb = scrub tab, rml = Return Mail level, mds = Medicaid source), kept from the prototype markup. */
  kind: 'scb' | 'rml' | 'mds';
  value: string;
}) {
  const dataAttr = { scb: 'data-s', rml: 'data-l', mds: 'data-m' }[kind];
  return (
    <button
      type="button"
      className={`btn ${kind}`}
      {...{ [dataAttr]: value }}
      onClick={onClick}
      style={{ border: `1px solid ${color}`, ...(active ? { background: color, color: '#fff' } : { color }) }}
    >
      {children}
    </button>
  );
}

export function ToggleRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0 12px' }}>
      <span className="note" style={{ margin: 0 }}>
        {label}
      </span>
      {children}
    </div>
  );
}
